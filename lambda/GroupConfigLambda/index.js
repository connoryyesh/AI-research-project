// groupSettings.js — Lambda handler for managing survey question groups
// Supports CRUD actions for researcher-defined question sets stored in DynamoDB

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// === Configuration ===
// You can override this table name via Lambda environment variables (e.g., TABLE_NAME=GroupsDev)
const TABLE_NAME = process.env.TABLE_NAME || "Groups";

exports.handler = async (event) => {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || "";
  const { groupId } = event.pathParameters || {}; // passed in REST route path
  let response;

  try {
    switch (httpMethod.toUpperCase()) {
      // === Save or Update Group ===
      // If switching to PATCH-style updates instead of overwrite, update saveGroupConfig()
      case "POST":
      case "PUT": {
        const newGroupId = !groupId || groupId === "undefined"
          ? String(await getNextGroupId())
          : groupId;
        response = await saveGroupConfig(newGroupId, event.body);
        break;
      }

      // === Retrieve Group or All Groups ===
      // If you add filtering or pagination, adjust getAllGroupConfigs()
      case "GET": {
        response = groupId
          ? await getGroupConfig(groupId)
          : await getAllGroupConfigs();
        break;
      }

      // === Remove a Question from a Group ===
      // If switching to soft-deletes or version history, update logic here
      case "DELETE": {
        if (!event.body) throw new Error("Missing body for DELETE");
        const body = JSON.parse(event.body);
        if (!body.questionText) throw new Error("Missing questionText for DELETE");
        response = await deleteQuestionFromGroup(groupId, body.questionText);
        break;
      }

      // === Unsupported method fallback ===
      default:
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: `Unsupported method: ${httpMethod}` }),
        };
    }
  } catch (err) {
    console.error("Lambda error:", err);
    response = {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Internal Server Error", error: err.message }),
    };
  }

  // Always include CORS headers in response
  response.headers = {
    ...(response.headers || {}),
    ...corsHeaders(),
  };

  return response;
};

// === Utility: Return standard CORS headers ===
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
  };
}

// === Create next available groupId counter (atomic update) ===
// If switching to UUIDs or timestamps for groupId, replace this with uuidv4 or Date.now()
async function getNextGroupId() {
  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { groupId: "COUNTER" },
    UpdateExpression: "SET currentId = if_not_exists(currentId, :start) + :inc",
    ExpressionAttributeValues: { ":start": 0, ":inc": 1 },
    ReturnValues: "UPDATED_NEW",
  }));
  return result.Attributes.currentId;
}

// === Save or Update a group config ===
// If your schema evolves (e.g., new settings), update newConfig and client-side payloads
async function saveGroupConfig(groupId, requestBody) {
  const config = JSON.parse(requestBody);
  const newConfig = {
    fontFace: config.fontFace || "Arial",
    colorScheme: config.colorScheme || "#000000",
    questionsJson: JSON.stringify(config.questions || []),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        groupId,
        ...newConfig,
      },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Saved group ${groupId}`, groupId }),
  };
}

// === Retrieve single group config ===
// Consider caching result or adding metrics if group fetch is a bottleneck
async function getGroupConfig(groupId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { groupId },
    })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: `Group ${groupId} not found.` }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      fontFace: result.Item.fontFace,
      colorScheme: result.Item.colorScheme,
      questions: JSON.parse(result.Item.questionsJson || "[]"),
    }),
  };
}

// === Get all group configurations ===
// If table grows large, replace with paginated Scan or Query with filters
async function getAllGroupConfigs() {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
}

// === Delete a specific question from a group ===
// If last question removed, the group itself is deleted for cleanup
// If you want to retain empty groups for analytics, remove delete call
async function deleteQuestionFromGroup(groupId, questionText) {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { groupId } })
  );

  if (!result.Item || !result.Item.questionsJson) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: `No questions found for group ${groupId}` }),
    };
  }

  const originalQuestions = JSON.parse(result.Item.questionsJson);
  const normalizedToDelete = questionText.trim().toLowerCase();
  const updated = originalQuestions.filter(q =>
    (q.question || "").trim().toLowerCase() !== normalizedToDelete
  );

  if (updated.length === 0) {
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { groupId } }));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Deleted entire group row for groupId ${groupId}` }),
    };
  } else {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          groupId,
          fontFace: result.Item.fontFace || "Arial",
          colorScheme: result.Item.colorScheme || "#000000",
          questionsJson: JSON.stringify(updated),
        },
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Removed question from group ${groupId}` }),
    };
  }
}
