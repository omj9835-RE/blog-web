import "dotenv/config";
import express from "express";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT) || 8787;
const dataDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(12).max(4000),
});

const emailSchema = z.object({
  email: z.string().trim().email().max(254),
});

async function saveEntry(filename, record) {
  await mkdir(dataDirectory, { recursive: true });
  await appendFile(path.join(dataDirectory, filename), `${JSON.stringify(record)}\n`, "utf8");
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", liveNewsConfigured: Boolean(process.env.NEWS_API_KEY) });
});

app.get("/api/news", async (request, response) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    response.json({ articles: [], liveConfigured: false });
    return;
  }

  const topic = typeof request.query.topic === "string" ? request.query.topic.trim().slice(0, 80) : "artificial intelligence";
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", topic || "artificial intelligence");
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "24");

  try {
    const newsResponse = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await newsResponse.json();
    if (!newsResponse.ok || payload.status !== "ok") {
      response.status(502).json({ error: "The news provider could not complete the request." });
      return;
    }

    const articles = (payload.articles ?? [])
      .filter((article) => article.title && article.url && article.title !== "[Removed]")
      .map((article, index) => ({
        id: `live-${index}-${Buffer.from(article.url).toString("base64url").slice(0, 24)}`,
        title: article.title,
        dek: article.description || "Open the original report for the full story.",
        category: "AI & Research",
        author: article.author || article.source?.name || "News source",
        source: article.source?.name || "News source",
        sourceUrl: article.url,
        readTime: "Source article",
        image: article.urlToImage || "",
        imageAlt: "",
        publishedAt: article.publishedAt || null,
        live: true,
        content: [],
      }));

    response.json({ articles, liveConfigured: true });
  } catch (error) {
    console.error("News provider request failed:", error instanceof Error ? error.message : "unknown error");
    response.status(502).json({ error: "Live headlines are temporarily unavailable." });
  }
});

app.post("/api/contact", async (request, response) => {
  const parsed = contactSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Please provide a valid name, email, and message." });
    return;
  }

  try {
    await saveEntry("contact-messages.jsonl", {
      ...parsed.data,
      receivedAt: new Date().toISOString(),
    });
    response.status(201).json({ ok: true });
  } catch (error) {
    console.error("Contact message could not be saved:", error instanceof Error ? error.message : "unknown error");
    response.status(500).json({ error: "Your message could not be saved. Please try again." });
  }
});

app.post("/api/newsletter", async (request, response) => {
  const parsed = emailSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  try {
    await saveEntry("newsletter-signups.jsonl", {
      ...parsed.data,
      subscribedAt: new Date().toISOString(),
    });
    response.status(201).json({ ok: true });
  } catch (error) {
    console.error("Newsletter signup could not be saved:", error instanceof Error ? error.message : "unknown error");
    response.status(500).json({ error: "Your signup could not be saved. Please try again." });
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "The request body must be valid JSON." });
    return;
  }
  console.error("Unhandled API error:", error instanceof Error ? error.message : "unknown error");
  response.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(port, () => {
  console.log(`Signalframe API listening on http://localhost:${port}`);
});
