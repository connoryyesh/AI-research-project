// projectResearcher.js — Lambda function for managing researcher assignments to projects
// Supports adding, listing, and removing researchers per project (partition key = projectId, sort key = researcherEmail)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
  UpdateCommand
} = require("@aws-sdk/lib-dynamodb");

// === DynamoDB Setup ===
// If your environment changes (e.g., region, auth), update the DynamoDBClient instantiation here.
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "Projects";

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const method = event.httpMethod || event.requestContext?.http?.method || "";
  let { projectId, researcherId } = event.pathParameters || {};

  let bodyObj = {};
  if (event.body) {
    try {
      bodyObj = JSON.parse(event.body);
    } catch (err) {
      console.error("Failed to parse JSON body:", err);
      return badRequest("Invalid JSON body");
    }
  }

  try {
    switch (method.toUpperCase()) {
      // === GET /projects/{projectId}/researchers ===
      // Use this to fetch all researchers tied to a project.
      case "GET":
        return await handleGetResearchers(projectId);

      // === POST /projects or /projects/{projectId}/researchers ===
      // If no projectId is passed, one will be auto-generated. Use this logic if enabling researcher-driven project creation.
      case "POST":
        if (!projectId) {
          projectId = await getNextProjectId();
        }
        return await handleAddResearcher(projectId, bodyObj.email, bodyObj.name);

      // === DELETE /projects/{projectId}/researchers/{researcherId} ===
      // Allows soft-removal of researchers. If soft delete is needed later, adjust logic here.
      case "DELETE":
        return await handleRemoveResearcher(projectId, researcherId);

      default:
        return {
          statusCode: 400,
          headers: defaultHeaders(),
          body: JSON.stringify({ message: `Unsupported method: ${method}` })
        };
    }
  } catch (err) {
    console.error("Unhandled error:", err);
    return {
      statusCode: 500,
      headers: defaultHeaders(),
      body: JSON.stringify({ message: "Internal server error", error: err.message })
    };
  }
};

// === GET researchers in a project ===
// If you change the schema (e.g., add secondary indexes), update the KeyConditionExpression here.
async function handleGetResearchers(projectId) {
  if (!projectId) return badRequest("Missing projectId in path");

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "projectId = :pid",
      ExpressionAttributeValues: { ":pid": projectId }
    }));

    return {
      statusCode: 200,
      headers: defaultHeaders(),
      body: JSON.stringify(result.Items || [])
    };
  } catch (err) {
    console.error("Error in handleGetResearchers:", err);
    return dynamoError(err);
  }
}

// === Add researcher to a project ===
// If you plan to add roles or status fields later (e.g., active/inactive), update the item structure here.
async function handleAddResearcher(projectId, researcherEmail, researcherName) {
  if (!projectId) return badRequest("Missing projectId in path");
  if (!researcherEmail) return badRequest("Missing researcherEmail in body");

  const newItem = {
    projectId: projectId,
    id: researcherEmail,
    researcherName: researcherName || ""
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: newItem,
      ConditionExpression: "attribute_not_exists(projectId) AND attribute_not_exists(id)"
    }));

    return {
      statusCode: 200,
      headers: defaultHeaders(),
      body: JSON.stringify({
        message: `Researcher ${researcherEmail} added to project ${projectId}`,
        projectId,
        researcher: newItem
      })
    };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        headers: defaultHeaders(),
        body: JSON.stringify({
          message: `Researcher ${researcherEmail} already exists in project ${projectId}`
        })
      };
    }
    console.error("Error in handleAddResearcher:", err);
    return dynamoError(err);
  }
}

// === Remove researcher from project ===
// This permanently deletes the record. If you want to soft-delete, consider adding a `deleted: true` attribute instead.
async function handleRemoveResearcher(projectId, researcherEmail) {
  if (!projectId) return badRequest("Missing projectId in path");
  if (!researcherEmail) return badRequest("Missing researcherId in path");

  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { projectId: projectId, id: researcherEmail }
    }));

    return {
      statusCode: 200,
      headers: defaultHeaders(),
      body: JSON.stringify({
        message: `Researcher ${researcherEmail} removed from project ${projectId}`
      })
    };
  } catch (err) {
    console.error("Error in handleRemoveResearcher:", err);
    return dynamoError(err);
  }
}

// === Generate auto-incremented projectId ===
// This simulates a counter using DynamoDB. If you move to UUIDs or slugs, replace this logic accordingly.
async function getNextProjectId() {
  const counterKey = { projectId: "COUNTER" };
  try {
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: counterKey,
      UpdateExpression: "SET currentId = if_not_exists(currentId, :start) + :inc",
      ExpressionAttributeValues: { ":start": 0, ":inc": 1 },
      ReturnValues: "UPDATED_NEW"
    }));
    return updateResult.Attributes.currentId.toString();
  } catch (err) {
    console.error("Error incrementing project counter:", err);
    throw new Error("Failed to generate new projectId");
  }
}

// === Response Helpers ===
function badRequest(msg) {
  return {
    statusCode: 400,
    headers: defaultHeaders(),
    body: JSON.stringify({ message: msg })
  };
}
function dynamoError(err) {
  return {
    statusCode: 500,
    headers: defaultHeaders(),
    body: JSON.stringify({ message: "DynamoDB error", error: err.message })
  };
}
function defaultHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE"
  };
}
