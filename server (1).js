// server.js
// Small Express backend that proxies NL -> SQL requests to Claude.
// Keeps the Anthropic API key on the server, never in frontend code.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const UNSAFE_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|PRAGMA|ATTACH|DETACH|VACUUM)\b/i;

function buildSystemPrompt(schema) {
  return `You are an expert AI-powered Natural Language to SQL Assistant.
Convert the user's natural language question into a valid, optimized, executable SQLite SQL query based ONLY on the schema below. The user's question may be written in ANY human language (Tamil, Hindi, English, etc). Understand the intent regardless of language, but ALWAYS write the SQL itself using standard English SQL keywords and the exact table/column names from the schema. Write the "explanation" field in the SAME language the user asked the question in, if you can identify it; otherwise use English.

SCHEMA:
${schema}

RULES:
- Only generate SELECT statements. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, REPLACE, or PRAGMA.
- Never invent tables or columns that are not in the schema above.
- If the question is ambiguous, leave "sql" empty and fill "clarification" with a short clarifying question (in the user's language).
- If the question requires a table/column that does not exist in the schema, leave "sql" empty and set "error" to a short message.
- Use JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, aggregate functions, subqueries, window functions etc. as appropriate.
- queryType must be one of: Filter, Aggregate, Join, Group By, Search, Ranking, Report.
- confidence must be one of: High, Medium, Low.

Respond with ONLY raw JSON, no markdown fences, no preamble, matching exactly this shape:
{"sql": "string or empty", "explanation": "string", "queryType": "string or empty", "confidence": "High|Medium|Low", "clarification": "string or empty", "error": "string or empty"}`;
}

app.post("/api/generate-sql", async (req, res) => {
  const { question, schema } = req.body || {};

  if (!question || !schema) {
    return res.status(400).json({ error: "question and schema are required" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Add it to your .env file." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: buildSystemPrompt(schema),
        messages: [{ role: "user", content: question }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Anthropic API error" });
    }

    const rawText = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    const cleaned = rawText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = { sql: "", explanation: rawText, queryType: "", confidence: "Low", clarification: "", error: "" };
    }

    let sql = (parsed.sql || "").trim();
    let blocked = false;
    if (sql && (UNSAFE_KEYWORDS.test(sql) || !/^\s*SELECT\b/i.test(sql))) {
      blocked = true;
      parsed.error = "Blocked: only read-only SELECT queries are allowed.";
      sql = "";
    }

    res.json({
      sql,
      explanation: parsed.explanation || "",
      queryType: parsed.queryType || "",
      confidence: parsed.confidence || "",
      clarification: parsed.clarification || "",
      error: parsed.error || "",
      blocked,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach the AI model. Try again." });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`Bhasha SQL backend running on http://localhost:${PORT}`));
