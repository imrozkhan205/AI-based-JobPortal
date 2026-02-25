import axios from "axios";
import FormData from "form-data";
import pool from "../database/db.js";

const BERT_SERVICE_URL =
  process.env.BERT_SERVICE_URL || "http://localhost:5001";

// Simple topic classifier to enforce allowed domains
function detectTopicCategory(message) {
  const text = message.toLowerCase();

  const aptitudeKeywords = [
    "aptitude",
    "logical reasoning",
    "quantitative",
    "quant",
    "probability",
    "permutation",
    "combination",
    "puzzle",
    "data interpretation",
    "numerical ability",
  ];

  const interviewKeywords = [
    "interview",
    "hr round",
    "technical round",
    "behavioral",
    "tell me about yourself",
    "interview tips",
    "interview question",
  ];

  const jobPrepKeywords = [
    "job preparation",
    "job search",
    "how to get a job",
    "campus placement",
    "placement preparation",
    "job ready",
    "resume",
    "cv",
    "cover letter",
    "portfolio",
  ];

  const topCompaniesKeywords = [
    "top companies",
    "best companies",
    "faang",
    "fang",
    "google",
    "microsoft",
    "amazon",
    "meta",
    "apple",
    "tcs",
    "infosys",
    "wipro",
    "accenture",
    "big tech",
  ];

  const skillDevKeywords = [
    "roadmap",
    "learning path",
    "skill development",
    "skills required",
    "how to become",
    "what should i learn",
    "upskill",
    "course",
    "certification",
  ];

  const containsAny = (keywords) =>
    keywords.some((kw) => text.includes(kw.toLowerCase()));

  if (containsAny(aptitudeKeywords)) return "aptitude";
  if (containsAny(interviewKeywords)) return "interview_preparation";
  if (containsAny(jobPrepKeywords)) return "job_preparation";
  if (containsAny(topCompaniesKeywords)) return "top_companies";
  if (containsAny(skillDevKeywords)) return "skill_development";

  // Heuristic fallbacks based on generic words
  if (text.includes("interview")) return "interview_preparation";
  if (text.includes("company")) return "top_companies";
  if (text.includes("skill") || text.includes("learn"))
    return "skill_development";
  if (text.includes("job") || text.includes("placement"))
    return "job_preparation";

  return null;
}

async function extractDocumentText(file) {
  if (!file) return null;

  if (!BERT_SERVICE_URL) {
    return null;
  }

  const formData = new FormData();
  formData.append("resume", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  try {
    const response = await axios.post(
      `${BERT_SERVICE_URL}/extract-resume`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    if (!response.data.success || !response.data.resumeText) {
      return null;
    }

    return response.data.resumeText;
  } catch (error) {
    console.error("❌ Error extracting document text for chatbot:", error.message);
    return null;
  }
}

async function generateAnswerWithOpenAI({ message, topicCategory, docText }) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
  if (!GROQ_API_KEY) {
    return null;
  }

  const systemPrompt =
    "You are a focused job preparation assistant for jobseekers. " +
    "You must ONLY answer questions related to: aptitude, interview preparation, job preparation, top companies and job-based skill/learning paths. " +
    "If the user asks about anything outside these topics (personal life, general chit-chat, politics, health, etc.), you must politely refuse and remind them of the allowed topics.";

  const contextSnippet =
    docText && docText.length > 2000 ? docText.slice(0, 2000) : docText;

  const messages = [
    { role: "system", content: systemPrompt },
    topicCategory
      ? {
          role: "system",
          content: `User's question has been classified as: ${topicCategory}. Answer with that context in mind.`,
        }
      : null,
    contextSnippet
      ? {
          role: "system",
          content:
            "The user has shared the following document content. Use it only if it is relevant to their question:\n\n" +
            contextSnippet,
        }
      : null,
    { role: "user", content: message },
  ].filter(Boolean);

  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const response = await axios.post(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
    messages,
    temperature: 0.4,
    max_tokens: 600,
  },
  {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  }
);

    const choice = response.data.choices?.[0];
    const content = choice?.message?.content?.trim();
    return content || null;
  } catch (error) {
  console.error("❌ Error calling Groq for chatbot:", error.message);
  if (error.response?.data) {
    console.error("❌ Groq error response:", error.response.data);
  }
  return null;
}
}

function generateFallbackAnswer({ message, topicCategory, docText }) {
  const intro =
    "I don't have access to an external AI model right now, " +
    "but here are some structured, practical suggestions based on your question.";

  switch (topicCategory) {
    case "aptitude":
      return (
        intro +
        "\n\n" +
        "- Focus on core areas: quantitative aptitude (percentages, ratios, time & work, time-speed-distance), logical reasoning, and data interpretation.\n" +
        "- Start with basic theory for each chapter, then solve 20–30 questions per topic from standard books or platforms.\n" +
        "- Time yourself: practice sectional tests (30–45 mins) to improve speed and accuracy.\n" +
        "- Analyse every mock: note which chapters you are weak in and revisit them with more practice.\n" +
        "- Use previous year placement papers of your target companies to understand exact difficulty level."
      );
    case "interview_preparation":
      return (
        intro +
        "\n\n" +
        "- Build a strong fundamentals list: prepare short explanations for your projects, strengths, weaknesses, and key concepts from your domain.\n" +
        "- For HR rounds, prepare stories using the STAR method (Situation, Task, Action, Result) for common questions like leadership, conflict, failures, and achievements.\n" +
        "- For technical rounds, list down core topics for your role (e.g., DSA + OOPs + DB + OS for SDE) and revise with 2–3 problems per topic.\n" +
        "- Do 3–5 mock interviews with friends/seniors or online platforms to get used to speaking out loud.\n" +
        "- After every interview, write down the questions asked and your weak points and correct them before the next one."
      );
    case "job_preparation":
      return (
        intro +
        "\n\n" +
        "- Define your target role clearly (e.g., SDE, Data Analyst, Frontend Engineer, etc.).\n" +
        "- Align your resume: showcase 2–3 solid projects, relevant skills, internships, and measurable impact (numbers, improvements, results).\n" +
        "- Allocate your weekly time into: skill-building (50%), projects (25%), applications + networking (25%).\n" +
        "- Apply smartly: customise your resume slightly for each role and write short, targeted cover letters.\n" +
        "- Use LinkedIn and alumni networks to get referrals and understand what different companies expect from freshers/experienced candidates."
      );
    case "top_companies":
      return (
        intro +
        "\n\n" +
        "- Identify top companies for your role using filters on LinkedIn, Glassdoor and AmbitionBox (domain, location, role title).\n" +
        "- For product / big-tech roles, focus on companies known for strong engineering culture and growth: e.g., large product firms, well-funded startups, and global MNCs.\n" +
        "- For service / IT roles, look at stable firms with strong training programs and clear career ladders.\n" +
        "- Always check company reviews: work-life balance, learning, pay, and culture before shortlisting.\n" +
        "- Create a tiered list (dream, target, backup companies) and align your preparation level accordingly."
      );
    case "skill_development":
      return (
        intro +
        "\n\n" +
        "- Start from the job description of your target role and extract 5–7 core skills (tools, languages, frameworks, domain concepts).\n" +
        "- For each skill, follow this pattern: (1) fundamentals course, (2) 1–2 guided mini-projects, (3) 1–2 real or portfolio projects.\n" +
        "- Build a 8–12 week roadmap where each week has clear learning goals and output (notes, code, project milestone).\n" +
        "- Continuously update your resume and LinkedIn as soon as you finish realistic projects or certifications.\n" +
        "- If you share your target role and current skill level, I can help outline a more detailed learning path."
      );
    default:
      return (
        "I'm designed to help only with aptitude, interview preparation, job preparation, top companies, and job-based skill development. " +
        "Please rephrase your question around one of these areas."
      );
  }
}

export const askChatbot = async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res
        .status(401)
        .json({ message: "Authentication required for chatbot." });
    }

    const clerkId = req.user.sub;

    const [userRows] = await pool.query(
      "SELECT id, role FROM users WHERE clerk_id = ?",
      [clerkId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRows[0];

    if (user.role !== "jobseeker") {
      return res.status(403).json({
        message:
          "This chatbot is only available for jobseekers. Switch to jobseeker role to use it.",
      });
    }

    const rawMessage = req.body.message;
    const message =
      typeof rawMessage === "string" ? rawMessage.trim() : String(rawMessage || "").trim();

    if (!message) {
      return res
        .status(400)
        .json({ message: "Please provide a question for the chatbot." });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        message: "Question too long. Please keep it under 2000 characters.",
      });
    }

    const topicCategory = detectTopicCategory(message);

    if (!topicCategory) {
      return res.status(400).json({
        message:
          "I can only answer questions related to aptitude, job preparation, interview preparation, top companies, and job-based skill development. " +
          "Please ask something in these areas.",
        allowedTopics: [
          "aptitude",
          "job preparation",
          "interview preparation",
          "top companies",
          "job-based skill development",
        ],
      });
    }

    const file = req.file || null;
    let documentText = null;

    if (file) {
      documentText = await extractDocumentText(file);
    }

    let answer = await generateAnswerWithOpenAI({
      message,
      topicCategory,
      docText: documentText,
    });

    if (!answer) {
      answer = generateFallbackAnswer({
        message,
        topicCategory,
        docText: documentText,
      });
    }

    return res.status(200).json({
      answer,
      topicCategory,
      usedDocument: Boolean(documentText),
      fileName: file?.originalname || null,
    });
  } catch (error) {
    console.error("❌ Error in chatbot controller:", error);
    return res.status(500).json({
      message: "Internal server error while processing chatbot request.",
      error: error.message,
    });
  }
};

