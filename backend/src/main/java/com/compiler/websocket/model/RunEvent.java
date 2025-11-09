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
public class RunEvent {

    @NotBlank
    private String language;

    @NotBlank
    private String file_name;

    @NotBlank
    private String source_code;

}
