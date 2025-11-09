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
public class InputEvent {

    @NotBlank
    private String job_id;

    @NotBlank
    private String content;

}
