// questionsApi.js — Lambda function for managing individual survey questions via composite key (surveyId + questionId)
// Supports endpoints for creating, retrieving, updating, and deleting questions
// Uses DynamoDB with composite keys for scalable question storage

const { 
  DynamoDBClient, 
  ScanCommand, 
  PutItemCommand,
  GetItemCommand, 
  DeleteItemCommand
} = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

// === DynamoDB Config ===
// If your deployment uses different environments (dev, prod), consider using environment variable overrides.
const dbClient = new DynamoDBClient({ region: "us-east-2" });
const TABLE_NAME = process.env.QUESTIONS_TABLE || "Questions"; // Composite key: surveyId + questionId

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const methodCandidate = event.httpMethod || event.requestContext?.http?.method || "";
  if (methodCandidate.toUpperCase() === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({}) };
  }

  const method = methodCandidate.toUpperCase();
  const rawPath = event.path || event.requestContext?.http?.path || "";

  try {
    // === GET /questions — Return all stored questions ===
    if (method === "GET" && rawPath === "/questions") {
      const items = await getAllQuestions();
      return successRes(items);
    }

    // === POST /questions — Create multiple questions for a survey ===
    // If no surveyId is provided, a new one will be generated. Update here if you add user-authenticated ownership.
    else if (method === "POST" && rawPath === "/questions") {
      const data = JSON.parse(event.body || "{}");
      const res = await createMultipleQuestions(data);
      return successRes(res);
    }

    // === GET /questions/{questionId}?surveyId=... — Retrieve a specific question ===
    else if (method === "GET" && rawPath.startsWith("/questions/")) {
      const questionId = rawPath.replace("/questions/", "");
      const surveyId = (event.queryStringParameters || {}).surveyId;
      if (!surveyId) return badRequest("Missing surveyId as query param");

      const question = await getSingleQuestion(surveyId, questionId);
      if (!question) return notFound(`No question found for surveyId=${surveyId}, questionId=${questionId}`);
      return successRes(question);
    }

    // === PUT /questions/{questionId}?surveyId=... — Update a question ===
    // If your schema evolves (e.g., adding tags or timestamps), update the transformation functions accordingly.
    else if (method === "PUT" && rawPath.startsWith("/questions/")) {
      const questionId = rawPath.replace("/questions/", "");
      const data = JSON.parse(event.body || "{}");
      const surveyId = (event.queryStringParameters || {}).surveyId;
      if (!surveyId) return badRequest("Missing surveyId as query param");

      const updated = await updateQuestion(surveyId, questionId, data);
      return successRes(updated);
    }

    // === DELETE /questions/{questionId}?surveyId=... — Delete a question ===
    // Consider converting this to a soft delete pattern if question auditability becomes important.
    else if (method === "DELETE" && rawPath.startsWith("/questions/")) {
      const questionId = rawPath.replace("/questions/", "");
      const surveyId = (event.queryStringParameters || {}).surveyId;
      if (!surveyId) return badRequest("Missing surveyId as query param");

      await deleteQuestion(surveyId, questionId);
      return successRes({ message: `Question ${questionId} deleted` });
    }

    // === Fallback: Unsupported route ===
    else {
      return notFound(`Route not found for ${method} ${rawPath}`);
    }
  } catch (err) {
    console.error("Lambda error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ message: err.message || "Internal Server Error" })
    };
  }
};

// === DynamoDB Logic ===
async function getAllQuestions() {
  // If the table becomes large, use pagination here to avoid scan timeouts.
  const result = await dbClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return (result.Items || []).map(dynToQuestion);
}

async function createMultipleQuestions(data) {
  const surveyId = data.surveyId || uuidv4();
  const questions = data.questions || [];

  // If adding question metadata or validation rules, insert transformation here.
  for (const q of questions) {
    const questionId = uuidv4();
    const item = questionToDynamo({
      surveyId,
      questionId,
      text: q.text,
      type: q.type,
      required: q.required,
      options: q.options
    });
    await dbClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: item }));
  }

  return { message: "Questions stored", surveyId, count: questions.length };
}

async function getSingleQuestion(surveyId, questionId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      surveyId: { S: surveyId },
      questionId: { S: questionId }
    }
  };
  const result = await dbClient.send(new GetItemCommand(params));
  return result.Item ? dynToQuestion(result.Item) : null;
}

async function updateQuestion(surveyId, questionId, data) {
  // This function replaces the entire item. For partial updates, use UpdateItemCommand instead.
  const item = questionToDynamo({ surveyId, questionId, ...data });
  await dbClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: item }));
  return { surveyId, questionId, ...data };
}

async function deleteQuestion(surveyId, questionId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      surveyId: { S: surveyId },
      questionId: { S: questionId }
    }
  };
  await dbClient.send(new DeleteItemCommand(params));
}

// === Conversion Helpers ===
function questionToDynamo({ surveyId, questionId, text, type, required, options }) {
  const item = {
    surveyId: { S: surveyId },
    questionId: { S: questionId },
    text: { S: text || "" },
    type: { S: type || "short-answer" }
  };
  if (typeof required !== "undefined") item.required = { BOOL: !!required };
  if (options) item.options = { L: options.map(opt => ({ S: opt })) };
  return item;
}

function dynToQuestion(dynItem) {
  return {
    surveyId: dynItem.surveyId.S,
    questionId: dynItem.questionId.S,
    text: dynItem.text.S,
    type: dynItem.type.S,
    required: dynItem.required?.BOOL || false,
    options: dynItem.options?.L ? dynItem.options.L.map(x => x.S) : []
  };
}

// === Response Helpers ===
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,POST,DELETE"
  };
}
function successRes(body) {
  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(body) };
}
function notFound(msg) {
  return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ message: msg }) };
}
function badRequest(msg) {
  return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ message: msg }) };
}
