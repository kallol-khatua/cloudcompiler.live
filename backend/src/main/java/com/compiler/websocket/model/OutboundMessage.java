package com.compiler.websocket.model;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OutboundMessage {
//    COMPLETION, STDERR, STDOUT, FAILURE, TERMINATION
    private String type;    // e.g. OUTPUT, ERROR, DONE
    private Object content; // flexible: string text or structured JSON
    private String job_id;   // optional
}