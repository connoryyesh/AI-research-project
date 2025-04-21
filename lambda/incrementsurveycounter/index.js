// incrementCounter.js — AWS Lambda handler for survey counter operations
// Supports two routes:
// 1. POST /incrementSurveyCounter — Increments the counter and sends optional SNS notification
// 2. GET /getSurveyCounter — Returns current counter value

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// === DynamoDB and SNS Clients ===
// These are the AWS SDK clients. If deploying in a different region or using local development tools like LocalStack,
// pass the correct region config (e.g., new DynamoDBClient({ region: "us-east-1" }))
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

// === Environment Variables ===
// Make sure these values are set in Lambda configuration or infrastructure-as-code like SAM/CloudFormation.
// You can override TABLE_NAME and SNS_TOPIC_ARN for different environments (dev/test/prod)
const TABLE_NAME = process.env.TABLE_NAME || "SurveyCounter";
const COUNTER_KEY = process.env.COUNTER_KEY || "totalSurveys";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const method = event.requestContext?.http?.method;
  const path = event.rawPath;

  // === Route: Increment Counter ===
  // Triggered when a participant completes a survey.
  // If you want to track different counters (e.g., per survey type), you must extend this logic
  if (method === "POST" && path === "/incrementSurveyCounter") {
    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { totalSurveys: COUNTER_KEY },
        UpdateExpression: "SET #count = if_not_exists(#count, :start) + :inc",
        ExpressionAttributeNames: { "#count": "count" },
        ExpressionAttributeValues: { ":start": 0, ":inc": 1 },
        ReturnValues: "UPDATED_NEW"
      }));

      const newCount = result.Attributes.count;

      // === Optional SNS Notification ===
      // If you'd like to notify a Slack channel or trigger downstream updates when surveys are completed,
      // configure SNS_TOPIC_ARN in your Lambda environment variables. If it's missing, this is skipped.
      if (SNS_TOPIC_ARN) {
        await snsClient.send(new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: "Survey Completed!",
          Message: `A survey was just completed. New total count: ${newCount}`
        }));
      }

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ count: newCount })
      };

    } catch (err) {
      console.error("Error incrementing counter:", err);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // === Route: Get Counter ===
  // Use this to retrieve total survey completions
  // You might call this from the dashboard page to show how many surveys have been taken
  else if (method === "GET" && path === "/getSurveyCounter") {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { totalSurveys: COUNTER_KEY }
      }));

      const count = result.Item?.count ?? 0;

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ count })
      };

    } catch (err) {
      console.error("Error getting counter:", err);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // === Fallback for unsupported paths ===
  // If this Lambda is called with an unknown path or method
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Not Found" })
  };
};
