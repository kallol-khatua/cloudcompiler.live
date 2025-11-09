package com.compiler.websocket.messaging;

import com.compiler.websocket.model.RedisPublisherPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisPublisher {

    private static final Logger logger = LoggerFactory.getLogger(RedisPublisher.class);
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisPublisher(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public void publish(String channel, RedisPublisherPayload redisPublisherPayload) {
        try{
            String messageBody = objectMapper.writeValueAsString(redisPublisherPayload);

            redisTemplate.convertAndSend(channel, messageBody);
            logger.info("INPUT_EVENT published on {}, message {}", channel, messageBody);
        }catch(Exception exception) {
            logger.error("Error while publishing to redis {}", exception.getMessage());
        }
    }

    public void publishSessionCloseEvent(String channel, RedisPublisherPayload redisPublisherPayload) {
        try{
            String messageBody = objectMapper.writeValueAsString(redisPublisherPayload);

            redisTemplate.convertAndSend(channel, messageBody);
            logger.info("SESSION_CLOSED_EVENT published on {}, message {}", channel, messageBody);
        }catch(Exception exception) {
            logger.error("Error while publishing SESSION_CLOSED_EVENT to redis {}", exception.getMessage());
        }
    }

}
