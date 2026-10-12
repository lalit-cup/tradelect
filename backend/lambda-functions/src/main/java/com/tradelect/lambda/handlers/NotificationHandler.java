package com.tradelect.lambda.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SNSEvent;

/**
 * AWS Lambda handler triggered by SNS for sending push/email notifications.
 */
public class NotificationHandler implements RequestHandler<SNSEvent, String> {

    @Override
    public String handleRequest(SNSEvent event, Context context) {
        for (SNSEvent.SNSRecord record : event.getRecords()) {
            String message = record.getSNS().getMessage();
            context.getLogger().log("Processing notification: " + message);
            // In production: integrate SES for email, SNS for push
        }
        return "Notifications processed: " + event.getRecords().size();
    }
}
