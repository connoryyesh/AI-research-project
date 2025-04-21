// surveyStatus.js — Lambda function for toggling and retrieving survey availability
// Supports two methods:
//   - GET:  Retrieve current survey open/closed state
//   - POST: Update the state (admin action)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetCommand, UpdateCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// === Setup DynamoDB Document Client ===
// If deploying in another region or adding retries/logging, configure DynamoDBClient here
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

// === Table and Key Constants ===
// If table schema evolves (e.g., multiple surveys with different IDs), refactor to accept surveyId dynamically
const TABLE_NAME = 'SurveyStatus';
const SURVEY_ID = 'my-survey'; // Only one row is tracked for simplicity

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;

  // CORS and content headers — adjust to restrict origins in production
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // === GET: Retrieve current survey open/closed status ===
    // You may want to include last modified timestamp in the future
    if (method === 'GET') {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { surveyId: SURVEY_ID }
      });

      const { Item } = await docClient.send(command);
      // If Item doesn't exist yet, assume survey is closed
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ isOpen: Item?.isOpen ?? false })
      };
    }

    // === POST: Update survey open/closed state ===
    // If you later restrict this action to admins only, apply an auth check before this block
    else if (method === 'POST') {
      const { isOpen } = JSON.parse(event.body);

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { surveyId: SURVEY_ID },
        UpdateExpression: "SET isOpen = :s",
        ExpressionAttributeValues: { ":s": isOpen }
      });

      await docClient.send(command);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Updated', isOpen })
      };
    }

    // === Fallback: Unsupported HTTP method ===
    else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Method Not Allowed' })
      };
    }

  } catch (err) {
    console.error("Lambda error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: err.message })
    };
  }
};
