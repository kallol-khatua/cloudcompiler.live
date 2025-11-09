package com.compiler.websocket.service;

import com.compiler.websocket.model.SqsPayload;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageResponse;
import software.amazon.awssdk.services.sqs.model.SqsException;

@Service
public class SqsPublisherCPP {

    private static final Logger logger = LoggerFactory.getLogger(SqsPublisherCPP.class);

    private final String queueUrl;
    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;

    public SqsPublisherCPP(@Value("${aws.sqs.cpp-queue-url}") String queueUrl, SqsClient sqsClient, ObjectMapper objectMapper) {
        this.queueUrl = queueUrl;
        this.sqsClient = sqsClient;
        this.objectMapper = objectMapper;
    }

    public String sendMessage(SqsPayload payload) {
        try {
            String messageBody = objectMapper.writeValueAsString(payload);

            SendMessageRequest request = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    // For FIFO queue, you must set MessageGroupId & MessageDeduplicationId
                    .messageBody(messageBody)
                    .build();

            SendMessageResponse response = sqsClient.sendMessage(request);

            logger.info("Message sent successfully. MessageId: {}", response.messageId());

            return response.messageId();
        } catch (SqsException e) {
            logger.error("Failed to send message to SQS: {}", e.getMessage());
            throw new RuntimeException("Failed to send message to SQS", e);
        } catch (JsonProcessingException e) {
            logger.error("Failed to convert Java object to JSON: {}", e.getMessage());
            throw new RuntimeException("Failed to convert Java object to JSON", e);
        }
    }
}
