package com.tradelect.lambda.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.SecureRandom;
import java.util.Map;

/**
 * AWS Lambda handler for OTP generation and delivery via SES/SNS.
 */
public class OtpHandler
        implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent input, Context context) {
        try {
            Map<?, ?> body = mapper.readValue(input.getBody(), Map.class);
            String email = (String) body.get("email");

            if (email == null || email.isEmpty()) {
                return new APIGatewayProxyResponseEvent().withStatusCode(400)
                        .withBody("{\"success\":false,\"message\":\"Email is required\"}");
            }

            String otp = String.valueOf(100000 + new SecureRandom().nextInt(900000));
            // In production: store OTP in ElastiCache, send via SES
            context.getLogger().log("OTP generated for: " + email);

            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withHeaders(Map.of("Content-Type", "application/json"))
                    .withBody(mapper.writeValueAsString(
                            Map.of("success", true, "message", "OTP sent to " + email)));
        } catch (Exception e) {
            return new APIGatewayProxyResponseEvent().withStatusCode(500)
                    .withBody("{\"success\":false,\"message\":\"Error processing OTP\"}");
        }
    }
}
