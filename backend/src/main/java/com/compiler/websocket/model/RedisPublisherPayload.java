package com.compiler.websocket.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedisPublisherPayload {

    @NotBlank
    String event_type; // SESSION_CLOSED_EVENT, INPUT_EVENT

    @NotBlank
    String content;

}
