const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================================
   HOME / STATUS
================================ */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    app: "SIYAFUNDA O'level AI",
    message: "Backend is running successfully."
  });
});

/* ================================
   SMART CHATBOT
================================ */

app.post("/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Please provide a message."
      });
    }

    const response = await client.responses.create({
      model: MODEL,
      instructions: `
You are SIYAFUNDA O'level AI, a friendly Zimbabwean
O'Level study assistant.

Help learners with:
- Mathematics
- Biology
- Chemistry
- Physics
- Combined Science
- Geography
- History
- Commerce
- Shona
- Ndebele
- English
- French

Give simple, accurate, step-by-step explanations.
Use O'Level-level language.
For calculations, show the working.
Do not pretend to know something if you are unsure.
`,
      input: message
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    res.status(500).json({
      error: "The AI could not answer right now."
    });
  }
});

/* ================================
   UNLIMITED QUESTION GENERATOR
================================ */

app.post("/generate-question", async (req, res) => {
  try {
    const subject = String(req.body.subject || "General Science");
    const topic = String(req.body.topic || "General O'Level");
    const difficulty = String(req.body.difficulty || "medium");

    const prompt = `
Create ONE original Zimbabwe O'Level practice question.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Return ONLY valid JSON in this exact format:

{
  "question": "question text",
  "options": ["A", "B", "C", "D"],
  "answer": "A",
  "explanation": "short explanation"
}

Rules:
- Make the question educational and accurate.
- Make exactly four options.
- The answer must be one of A, B, C or D.
- Make the explanation easy to understand.
`;

    const response = await client.responses.create({
      model: MODEL,
      input: prompt
    });

    const text = response.output_text.trim();

    let questionData;

    try {
      questionData = JSON.parse(text);
    } catch {
      const cleaned = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      questionData = JSON.parse(cleaned);
    }

    res.json(questionData);

  } catch (error) {
    console.error("QUESTION ERROR:", error);

    res.status(500).json({
      error: "Could not generate a question."
    });
  }
});

/* ================================
   CHECK ANSWER
================================ */

app.post("/check-answer", async (req, res) => {
  try {
    const question = String(req.body.question || "");
    const answer = String(req.body.answer || "");

    if (!question || !answer) {
      return res.status(400).json({
        error: "Question and answer are required."
      });
    }

    const prompt = `
You are checking an O'Level learner's answer.

Question:
${question}

Learner's answer:
${answer}

Determine whether the answer is correct.

Return ONLY valid JSON:

{
  "correct": true,
  "answer": "the correct answer",
  "explanation": "simple explanation"
}
`;

    const response = await client.responses.create({
      model: MODEL,
      input: prompt
    });

    const text = response.output_text.trim();

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      const cleaned = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      result = JSON.parse(cleaned);
    }

    res.json(result);

  } catch (error) {
    console.error("CHECK ANSWER ERROR:", error);

    res.status(500).json({
      error: "Could not check the answer."
    });
  }
});

/* ================================
   EXPLAIN CORRECT ANSWER
================================ */

app.post("/explain", async (req, res) => {
  try {
    const question = String(req.body.question || "");
    const answer = String(req.body.answer || "");

    if (!question || !answer) {
      return res.status(400).json({
        error: "Question and answer are required."
      });
    }

    const prompt = `
Explain this O'Level question to a learner.

Question:
${question}

Correct answer:
${answer}

Give:
1. The correct answer.
2. Step-by-step working where needed.
3. A simple explanation of why it is correct.
4. A short exam tip.

Use simple learner-friendly language.
`;

    const response = await client.responses.create({
      model: MODEL,
      input: prompt
    });

    res.json({
      explanation: response.output_text
    });

  } catch (error) {
    console.error("EXPLANATION ERROR:", error);

    res.status(500).json({
      error: "Could not explain the answer."
    });
  }
});

/* ================================
   START SERVER
================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SIYAFUNDA AI backend running on port ${PORT}`);
});
