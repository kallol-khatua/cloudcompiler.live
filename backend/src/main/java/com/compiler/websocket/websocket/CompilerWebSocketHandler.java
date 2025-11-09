package com.compiler.websocket.websocket;

import com.compiler.websocket.messaging.ChannelNaming;
import com.compiler.websocket.messaging.RedisPublisher;
import com.compiler.websocket.messaging.RedisSubscriber;
import com.compiler.websocket.model.*;
import com.compiler.websocket.service.JobMessagingService;
import com.compiler.websocket.service.SqsPublisher;
import com.compiler.websocket.service.SqsPublisherCPP;
import com.compiler.websocket.service.SqsPublisherPython;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.UUID;

@Component
public class CompilerWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(CompilerWebSocketHandler.class);

    private final ObjectMapper objectMapper;
    private final JobMessagingService jobMessagingService;
    private final SqsPublisher sqsPublisher;
    private final SqsPublisherCPP sqsPublisherCPP;
    private final SqsPublisherPython sqsPublisherPython;
    private final RedisSubscriber redisSubscriber;
    private final RedisPublisher redisPublisher;
    private final RedisMessageListenerContainer redisMessageListenerContainer;

    public CompilerWebSocketHandler(JobMessagingService jobMessagingService,
                                    ObjectMapper objectMapper,
                                    RedisSubscriber redisSubscriber,
                                    RedisMessageListenerContainer redisMessageListenerContainer,
                                    RedisPublisher redisPublisher,
                                    SqsPublisherCPP sqsPublisherCPP,
                                    SqsPublisherPython sqsPublisherPython,
                                    SqsPublisher sqsPublisher) {
        this.objectMapper = objectMapper;
        this.jobMessagingService = jobMessagingService;
        this.sqsPublisher = sqsPublisher;
        this.sqsPublisherCPP = sqsPublisherCPP;
        this.sqsPublisherPython = sqsPublisherPython;
        this.redisSubscriber = redisSubscriber;
        this.redisPublisher = redisPublisher;
        this.redisMessageListenerContainer = redisMessageListenerContainer;
    }


    // after websocket connection established, create a jobId for the session and store in memory
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 1) Generate jobId
        String job_id = UUID.randomUUID().toString();

        session.setTextMessageSizeLimit(512 * 1024);

        // 2) Track mapping: jobId -> session, sessionId -> jobId
        jobMessagingService.registerJob(job_id, session);

        logger.info("New WebSocket session established sessionId: {}", session.getId());

        // 3) Ack back to user with jobId
        sendToSession(session, OutboundMessage.builder()
                .type("SESSION_CREATED")
                .job_id(job_id)
                .content("Session created with session id: " + session.getId())
                .build());
    }


    // TODO: Handle dual write or message lost
    // handle code compile request, add to sqsQueue, subscribe to redis pub/sub
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        logger.debug("WS message from session {}: {}", session.getId(), payload);

        // Deserialize into generic wrapper
        InboundMessage inbound = objectMapper.readValue(payload, InboundMessage.class);

        // Get jobId
        String job_id = jobMessagingService.jobIdCorrespondingToSession(session);

        switch (inbound.getType()) {
            case "RUN_EVENT":
                RunEvent runEvent = objectMapper.treeToValue(inbound.getData(), RunEvent.class);
                handleRunEvent(session, runEvent, job_id);
                break;

            case "INPUT_EVENT":
                InputEvent inputEvent = objectMapper.treeToValue(inbound.getData(), InputEvent.class);
                handleInputEvent(session, inputEvent, job_id);
                break;

            default:
                logger.warn("Unknown event type: {}", inbound.getType());
                sendToSession(session, OutboundMessage.builder()
                        .type("ERROR")
                        .job_id(job_id)
                        .content("Unknown event type: " + inbound.getType())
                        .build());
        }
    }


    private void handleRunEvent(WebSocketSession session, RunEvent req, String job_id) {
        try {
            // TODO: publish to language specific queue
            // Publish to SQS
            SqsPayload sqsPayload = SqsPayload.builder()
                    .job_id(job_id)
                    .language(req.getLanguage())
                    .file_name(req.getFile_name())
                    .source_code(req.getSource_code())
                    .build();

            String messageId = "";
            // TODO: replace with switch
            if (req.getLanguage().equals("java")) {
                messageId = sqsPublisher.sendMessage(sqsPayload);
            } else if (req.getLanguage().equals("cpp")) {
                messageId = sqsPublisherCPP.sendMessage(sqsPayload);
            } else if (req.getLanguage().equals("py")) {
                messageId = sqsPublisherPython.sendMessage(sqsPayload);
            }

            // Subscribe to Redis for this jobId
            String channel = ChannelNaming.jobChannel(job_id);
            redisMessageListenerContainer.addMessageListener(redisSubscriber, new ChannelTopic(channel));
            logger.info("Subscribed to: {}", channel);

            // Ack
            sendToSession(session, OutboundMessage.builder()
                    .type("JOB_ENQUEUED")
                    .job_id(job_id)
                    .content("Job queued with messageId: " + messageId)
                    .build());
        } catch (Exception exception) {
            logger.error("Error handling run event: {}", exception.getMessage());
        }
    }


    // TODO: complete
    private void handleInputEvent(WebSocketSession session, InputEvent req, String job_id) {
        try {
            String channel = ChannelNaming.inputChannel(req.getJob_id());
            RedisPublisherPayload redisPublisherPayload = RedisPublisherPayload.builder()
                    .event_type("INPUT_EVENT")
                    .content(req.getContent())
                    .build();
            redisPublisher.publish(channel, redisPublisherPayload);

            // Ack back
            sendToSession(session, OutboundMessage.builder()
                    .type("INPUT_RECEIVED")
                    .job_id(job_id)
                    .content("Input forwarded to job")
                    .build());
        } catch (Exception e) {
            logger.error("Error: {}", e.getMessage());
        }
    }


    // after websocket connection closed remove session and job from in memory
    // If session is closed before successful execution then stop code execution
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        try {
            // Get jobId
            String job_id = jobMessagingService.jobIdCorrespondingToSession(session);

            String channel = ChannelNaming.inputChannel(job_id);
            RedisPublisherPayload redisPublisherPayload = RedisPublisherPayload.builder()
                    .event_type("SESSION_CLOSED_EVENT")
                    .content("User close the session before completion")
                    .build();
            redisPublisher.publishSessionCloseEvent(channel, redisPublisherPayload);

            // Ack back
            sendToSession(session, OutboundMessage.builder()
                    .type("SESSION_CLOSED")
                    .job_id(job_id)
                    .content("Input forwarded to job")
                    .build());

            logger.info("Session {} closed with status {}", session.getId(), status);
            jobMessagingService.unregisterSession(session);
        } catch (Exception e) {
            logger.error("Session closed");
        }
    }


    private void sendToSession(WebSocketSession session, OutboundMessage msg) throws IOException {
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
        } catch (IOException e) {
            // If send fails, cleanup and break. Remaining messages are dropped.
            logger.error("Failed to send to session for job {}: {}", msg.getJob_id(), e.getMessage());
        }
    }
}
