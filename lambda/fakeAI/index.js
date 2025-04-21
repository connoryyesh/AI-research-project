// surveyApi.js — Handles survey question delivery, answer simulation, and rating submission
// Supports multiple routes for fetching questions, simulating AI answers, storing ratings, and retrieving summaries

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// === Configuration ===
// If deployed in another region or renamed tables, update accordingly
const REGION = "us-east-2";
const GROUPS_TABLE = "Groups";          // Contains the question sets configured by researchers
const RESPONSES_TABLE = "Responses";    // Stores ratings submitted by users

const lowClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(lowClient);
let allDbQuestions = []; // Cached question list — loaded from GROUPS_TABLE

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const methodCand = event.httpMethod || event.requestContext?.http?.method || "";
  if (methodCand.toUpperCase() === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "{}" };
  }

  const method = methodCand.toUpperCase();
  const rawPath = event.path || event.requestContext?.http?.path || "";

  try {
    if (method === "GET" && rawPath === "/fixed-questions") {
      return successRes(await getQuestionsAllRows());
    }

    if (method === "POST" && rawPath === "/ask") {
      const { questionId, phase } = JSON.parse(event.body || "{}");
      return successRes(await handleAsk(questionId, phase));
    }

    if (method === "POST" && rawPath === "/rate") {
      const { questionId, rating } = JSON.parse(event.body || "{}");
      return successRes(await handleRate(questionId, rating));
    }

    if (method === "GET" && rawPath === "/ratings") {
      return successRes(await getAllRatings());
    }

    return notFound(`Route not found for ${method} ${rawPath}`);

  } catch (err) {
    console.error("Lambda error:", err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ message: err.message }) };
  }
};

// === Retrieve and flatten all group-based questions from GROUPS_TABLE ===
// Each row is converted to a question with groupId, style settings, and ID assigned
// If the group structure or schema changes (e.g. new field or nested format), modify parsing logic here
async function getQuestionsAllRows() {
  const allItems = (await lowClient.send(new ScanCommand({ TableName: GROUPS_TABLE }))).Items ?? [];
  const flat = [];
  let nextId = 1;

  for (const itm of allItems) {
    const groupId = itm.groupId?.S ?? "";
    const colorScheme = itm.colorScheme?.S ?? "";
    const fontFace = itm.fontFace?.S ?? "";

    let arr = [];
    if (itm.questionsJson?.S) {
      try { arr = JSON.parse(itm.questionsJson.S); } catch (e) { console.error("JSON parse", e); }
    }

    (arr || []).forEach(obj => flat.push({
      assignedId: nextId++,
      question: obj.question ?? "",
      preAnswer: obj.preAnswer ?? "Thinking...",
      answer: obj.answer ?? "",
      delay: obj.delay ?? "1",
      groupId, colorScheme, fontFace
    }));
  }

  allDbQuestions = flat;

  // If frontend expects a specific structure, maintain shape here
  return flat.map(q => ({
    id: q.assignedId,
    question: q.question
  }));
}

// === Simulates AI pre and final responses ===
// Introduces delay for realism and applies styling
// If switching from simulated to real LLMs, replace this with API integration
async function handleAsk(questionId, phase = "pre") {
  if (!questionId) return { message: "Missing questionId" };
  if (!allDbQuestions.length) await getQuestionsAllRows();
  const dbQ = allDbQuestions.find(q => q.assignedId === questionId);
  if (!dbQ) return { message: `No DB question for id ${questionId}` };

  if (phase === "pre") return { preAnswerMessage: dbQ.preAnswer };

  await sleep(Number(dbQ.delay || 1) * 1000); // Wait before showing final answer
  return {
    finalAnswer: dbQ.answer,
    colorScheme: dbQ.colorScheme,
    fontFace: dbQ.fontFace
  };
}

// === Store a user-submitted rating ===
// Adds to counter column for selected rating value (1-5)
// Also stores question text if it's the first rating for that question
// If modifying how questions are identified or adding multi-group tracking, reflect here
async function handleRate(questionId, rating) {
  const r = Number(rating);
  if (!questionId || !(r >= 1 && r <= 5)) return { message: "Invalid input" };

  const ratingCol = `rating${r}`;
  const upd = await docClient.send(new UpdateCommand({
    TableName: RESPONSES_TABLE,
    Key: { questionId: String(questionId) },
    UpdateExpression: "ADD #c :one",
    ExpressionAttributeNames: { "#c": ratingCol },
    ExpressionAttributeValues: { ":one": 1 },
    ReturnValues: "UPDATED_NEW"
  }));

  // If it's the first rating, store the question text for visibility in the dashboard
  const existingText = upd.Attributes?.question;
  if (!existingText) {
    const text = allDbQuestions.find(q => q.assignedId === Number(questionId))?.question || "";
    if (text) {
      await docClient.send(new UpdateCommand({
        TableName: RESPONSES_TABLE,
        Key: { questionId: String(questionId) },
        UpdateExpression: "SET #q = if_not_exists(#q, :t)",
        ExpressionAttributeNames: { "#q": "question" },
        ExpressionAttributeValues: { ":t": text }
      }));
    }
  }

  return { message: "Rating stored", updated: upd.Attributes };
}

// === Fetch ratings summary ===
// Returns per-question breakdown for all questions with ratings
// If adding user-specific feedback later, this logic will need filtering
async function getAllRatings() {
  const data = await docClient.send(new ScanCommand({ TableName: RESPONSES_TABLE }));
  const items = data.Items || [];

  return items.map(item => ({
    questionId: item.questionId,
    question: item.question,
    rating1: item.rating1 || 0,
    rating2: item.rating2 || 0,
    rating3: item.rating3 || 0,
    rating4: item.rating4 || 0,
    rating5: item.rating5 || 0,
  }));
}

// === Utility ===
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
  };
}
function successRes(b) {
  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(b) };
}
function notFound(m) {
  return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ message: m }) };
}
