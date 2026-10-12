package com.tradelect.lambda.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradelect.lambda.models.LambdaResponse;
import java.util.*;

/**
 * AWS Lambda handler for product search (serverless mode).
 * Can be deployed independently alongside Spring Boot microservices.
 */
public class ProductSearchHandler
        implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent input, Context context) {

        context.getLogger().log("ProductSearchHandler invoked: " + input.getPath());

        Map<String, String> params = input.getQueryStringParameters();
        if (params == null) params = new HashMap<>();

        String searchQuery = params.getOrDefault("q", "");
        String brand = params.getOrDefault("brand", "");
        String category = params.getOrDefault("category", "");

        // In production: call RDS or DynamoDB directly
        LambdaResponse response = LambdaResponse.builder()
                .success(true)
                .message("Search results for: " + searchQuery)
                .data(Map.of("query", searchQuery, "brand", brand,
                        "category", category, "results", List.of()))
                .build();

        try {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withHeaders(Map.of("Content-Type", "application/json",
                            "Access-Control-Allow-Origin", "*"))
                    .withBody(mapper.writeValueAsString(response));
        } catch (Exception e) {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(500)
                    .withBody("{\"success\":false,\"message\":\"Internal error\"}");
        }
    }
}
