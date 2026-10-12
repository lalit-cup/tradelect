package com.tradelect.lambda.models;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LambdaResponse {
    private boolean success;
    private String message;
    private Object data;
}
