package com.compiler.websocket.messaging;

import com.compiler.websocket.service.JobMessagingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Component
public class RedisSubscriber implements MessageListener {

    private static final Logger logger = LoggerFactory.getLogger(RedisSubscriber.class);

    private final JobMessagingService jobMessagingService;

    public RedisSubscriber(JobMessagingService jobMessagingService) {
        this.jobMessagingService = jobMessagingService;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        String payload = new String(message.getBody());
        logger.debug("Redis message on {}: {}", channel, payload);

        try {
            if (channel.startsWith("job:")) {
                String jobId = channel.substring("job:".length());
                logger.info("job id: {}", jobId);

                // pass the payload string directly
                jobMessagingService.sendToJob(jobId, payload);
            } else {
                logger.warn("Unhandled channel {}", channel);
            }
        } catch (Exception e) {
            logger.error("Failed to handle redis message", e);
        }
    }
}