import type { Article, NewsResponse } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Something went wrong. Please try again.");
  }
  return payload as T;
}

export function getNews(topic?: string): Promise<NewsResponse> {
  const query = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return request<NewsResponse>(`/api/news${query}`);
}

export function sendContact(values: { name: string; email: string; message: string }): Promise<{ ok: boolean }> {
  return request("/api/contact", { method: "POST", body: JSON.stringify(values) });
}

export function subscribe(email: string): Promise<{ ok: boolean }> {
  return request("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
}

export function getStory(id: string, articles: Article[]): Article | undefined {
  return articles.find((article) => article.id === id);
}
