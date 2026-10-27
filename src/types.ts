export type Article = {
  id: string;
  title: string;
  dek: string;
  category: string;
  author: string;
  source: string;
  sourceUrl?: string;
  readTime: string;
  image: string;
  imageAlt: string;
  publishedAt: string | null;
  live: boolean;
  content: string[];
};

export type NewsResponse = {
  articles: Article[];
  liveConfigured: boolean;
};
