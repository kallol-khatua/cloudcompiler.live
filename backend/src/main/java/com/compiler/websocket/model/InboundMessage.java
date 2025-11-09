package com.compiler.websocket.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InboundMessage {

    @NotBlank
    private String type;   // e.g. "RUN_EVENT", "INPUT_EVENT"

    @NotBlank
    private JsonNode data; // generic JSON payload

}
