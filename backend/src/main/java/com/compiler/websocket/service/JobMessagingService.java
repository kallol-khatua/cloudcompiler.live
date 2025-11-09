package com.compiler.websocket.service;

import com.compiler.websocket.messaging.ChannelNaming;
import com.compiler.websocket.model.OutboundMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * High-throughput per-job ordered dispatcher.
 * <p>
 * Key optimizations:
 * - Pre-serialize OutboundMessage into String before queueing
 * - Use ArrayBlockingQueue per job (bounded, predictable GC)
 * - Single drainer per job using per-job AtomicBoolean
 * - Shared ThreadPoolExecutor sized for high throughput
 */
@Service
public class JobMessagingService {

    private static final Logger logger = LoggerFactory.getLogger(JobMessagingService.class);
    private final RedisMessageListenerContainer redisMessageListenerContainer;


    // Per-job structures
    private final Map<String, ArrayBlockingQueue<String>> jobQueues = new ConcurrentHashMap<>();
    private final Map<String, AtomicBoolean> jobLocks = new ConcurrentHashMap<>();
    // jobId -> active websocket session
    private final Map<String, WebSocketSession> byJob = new ConcurrentHashMap<>();
    // sessionId -> jobId
    private final Map<String, String> sessionToJob = new ConcurrentHashMap<>();


    // High-throughput pool for draining queues
    private final ThreadPoolExecutor pool;

    private final ObjectMapper objectMapper;

    // Tunables (adjust for your hardware)
    private static final int WEBSOCKET_BUFFER_BYTES = 20 * 1024 * 1024; // 20 MB per-session buffer
    private static final int DEFAULT_QUEUE_CAPACITY = 10_000; // per-job queue capacity

    public JobMessagingService(ObjectMapper objectMapper,
                               RedisMessageListenerContainer redisMessageListenerContainer
    ) {
        this.objectMapper = objectMapper;
        this.redisMessageListenerContainer = redisMessageListenerContainer;


        // ThreadPoolExecutor tuned for high throughput with a large queue for bursts
        this.pool = new ThreadPoolExecutor(
                2,                       // core threads
                8,                      // max threads
                60L, TimeUnit.SECONDS,    // keepAlive
                new LinkedBlockingQueue<>(200_000), // shared queue for tasks (burst absorption)
                runnable -> {             // thread factory
                    Thread t = new Thread(runnable);
                    t.setName("job-dispatcher-" + t.threadId());
                    t.setDaemon(true);
                    return t;
                },
                new ThreadPoolExecutor.CallerRunsPolicy() // backpressure fallback
        );
        // avoid allowing core threads to time out (depends on workload)
        this.pool.allowCoreThreadTimeOut(false);
    }

    /**
     * Register a new job -> session mapping and create per-job queue and lock.
     */
    public void registerJob(String jobId, WebSocketSession session) {
        // Wrap the session with a larger buffer to handle bursts to slow clients.
        WebSocketSession wrapped = new ConcurrentWebSocketSessionDecorator(
                session,
                (int) Duration.ofSeconds(15).toMillis(), // sendTimeLimit ms
                WEBSOCKET_BUFFER_BYTES
        );

        byJob.put(jobId, wrapped);
        sessionToJob.put(session.getId(), jobId);
        // If queue exists already (reconnect), don't overwrite capacity
        jobQueues.computeIfAbsent(jobId, id -> new ArrayBlockingQueue<>(DEFAULT_QUEUE_CAPACITY));
        jobLocks.computeIfAbsent(jobId, id -> new AtomicBoolean(false));

        logger.debug("Registered job {} with session {}", jobId, session.getId());
    }

    /**
     * Unregister a job and cleanup resources.
     */
    public void unregisterJob(String jobId) {
        WebSocketSession session = byJob.remove(jobId);
        sessionToJob.remove(session.getId());
        jobQueues.remove(jobId);
        jobLocks.remove(jobId);

        unsubscribeJobChannel(jobId);
        closeSession(session);

        logger.debug("Unregistered job {}", jobId);
    }

    /**
     * Unregister a job and cleanup resources.
     */
    public void  unregisterSession(WebSocketSession session) {
        String jobId = sessionToJob.remove(session.getId());
        byJob.remove(jobId);
        jobQueues.remove(jobId);
        jobLocks.remove(jobId);

        unsubscribeJobChannel(jobId);
        closeSession(session);

        logger.debug("Unregistered session {}", session.getId());
    }

    public void closeSession(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close(CloseStatus.NORMAL);
                logger.info("Session closed: {}", session.getId());
            }
        } catch (Exception e) {
            logger.error("Error while closing session: {}", e.getMessage());
        }
    }


    // Unsubscribe redis listener from a channel
    public void unsubscribeJobChannel(String jobId) {
        String channel = ChannelNaming.jobChannel(jobId);
        redisMessageListenerContainer.removeMessageListener(null, new ChannelTopic(channel));
        System.out.println("Unsubscribed from " + channel);
        logger.info("Unsubscribed redis listener from: {}", channel);
    }


    public String jobIdCorrespondingToSession(WebSocketSession session) {
        return sessionToJob.get(session.getId());
    }

    /**
     * Enqueue message for the job. We pre-serialize the message to avoid doing it inside pool threads.
     * If the per-job queue is full, this will drop the message (or could block/metrics depending on policy).
     */
    public void sendToJob(String jobId, String payload) {
        ArrayBlockingQueue<String> queue = jobQueues.get(jobId);
        if (queue == null) {
            // job not registered; optionally log or buffer elsewhere
            logger.debug("sendToJob: job {} not found, dropping message", jobId);
            return;
        }


        // Offer into bounded queue (non-blocking). If full, you can:
        // - drop, - block with offer(timeout), - or apply backpressure upstream.
        boolean offered = queue.offer(payload);
        if (!offered) {
            // TODO: increase size
            // Queue full: increment metric or log. For high-throughput, avoid blocking.
            logger.warn("Queue full for job {} - dropping message", jobId);
            return;
        }

        tryDispatch(jobId);
    }

    /**
     * Attempt to acquire the per-job lock and schedule a drainer if not already running.
     */
    private void tryDispatch(String jobId) {
        AtomicBoolean lock = jobLocks.get(jobId);
        if (lock != null && lock.compareAndSet(false, true)) {
            try {
                pool.execute(() -> drainQueue(jobId));
            } catch (RejectedExecutionException rex) {
                // TODO:
                // If pool is saturated, release lock and handle fallback (CallerRunsPolicy would have handled).
                lock.set(false);
                logger.error("Pool saturated while scheduling drainer for job {}", jobId, rex);
            }
        }
    }

    /**
     * Drains queue and sends messages sequentially for a job. If the session fails, job is unregistered.
     */
    private void drainQueue(String jobId) {
        try {
            WebSocketSession session = byJob.get(jobId);
            ArrayBlockingQueue<String> queue = jobQueues.get(jobId);

            // If session or queue missing, exit early.
            while (session != null && queue != null) {
                String payload = queue.poll();
                if (payload == null) break;

                OutboundMessage msg = objectMapper.readValue(payload, OutboundMessage.class);

                try {
                    logger.info("sending {} to session {} with job id: {}", payload, session.getId(), jobId);

                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(payload));
                    }

                    if (msg.getType().equals("COMPLETION") || msg.getType().equals("TERMINATION")) {
                        // remove all and close socket connection
                        // unregisterJob(jobId);
                        closeSession(session);
                    }
                } catch (IOException e) {
                    // If send fails, cleanup and break. Remaining messages are dropped.
                    logger.error("Failed to send to session for job {}: {}", jobId, e.getMessage());

                    // TODO: check after break does finally work or not, if wor then do not remove
                    unregisterJob(jobId);
                    break;
                }
            }
        } catch (Exception e) {
            logger.error("Unexpected error during drain for job {}: {}", jobId, e.getMessage(), e);
        } finally {
            AtomicBoolean lock = jobLocks.get(jobId);
            if (lock != null) {
                lock.set(false);
                // If messages arrived while we were finishing, re-schedule
                ArrayBlockingQueue<String> queue = jobQueues.get(jobId);
                if (queue != null && !queue.isEmpty()) {
                    tryDispatch(jobId);
                }
            }
        }
    }


//    public void sendToJob(String jobId, OutboundMessage msg) {
//        try {
//            String json = objectMapper.writeValueAsString(msg);
//            WebSocketSession session = sessionRegistry.sessionCorrespondingToJobId(jobId);
//
//            // if session is open then send message to user
//            if (session.isOpen()) {
//                try {
//                    logger.info("session id: {}", session.getId());
//                    session.sendMessage(new TextMessage(json));
//                } catch (IOException e) {
//                    logger.warn("Failed to send to session {}: {}", session.getId(), e.getMessage());
//                }
//            }else {
//                // TODO: if session is closed before successful execution then stop code execution
//            }
//
//            // TODO: Auto-unsubscribe when job is DONE, and remove session from in memory
//            // TODO: close the session, remove redis listener
//            // TODO: creating a loop
////            if ("DONE".equals(msg.getType())) {
////                String channel = ChannelNaming.jobChannel(jobId);
////                redisMessageListenerContainer.removeMessageListener(redisSubscriber, new ChannelTopic(channel));
////                logger.info("Job {} finished. Unsubscribed from Redis channel {}", jobId, channel);
////            }
//        } catch (Exception e) {
//            logger.error("Failed to send to job {}", jobId, e);
//        }
//    }
}
