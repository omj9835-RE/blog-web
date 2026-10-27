import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArticleBody,
  EmptyState,
  FeaturedStory,
  LoadingCards,
  Newsletter,
  PageIntro,
  Pagination,
  SearchHero,
  SectionTitle,
  SiteFooter,
  SiteHeader,
  StoryCard,
  TopicFilter,
} from "./components";
import { categories, demoArticles } from "./data/articles";
import { getNews, sendContact } from "./lib/api";
import type { Article } from "./types";

const pageSize = 4;

function useLocalValue<T>(key: string, initialValue: T): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const update = useCallback((next: T | ((current: T) => T)) => {
    setValue((current) => {
      const value = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Keep the current-session preference even when browser storage is unavailable.
      }
      return value;
    });
  }, [key]);

  return [value, update];
}

function AppFrame({ children, dark, onTheme, bookmarks }: { children: ReactNode; dark: boolean; onTheme: () => void; bookmarks: string[] }) {
  const location = useLocation();
  return (
    <div className={`app-shell ${dark ? "theme-dark" : "theme-light"}`}>
      <SiteHeader dark={dark} onTheme={onTheme} bookmarks={bookmarks} />
      <AnimatePresence mode="wait">
        <motion.main key={location.pathname + location.search} className="page-main" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }}>
          {children}
        </motion.main>
      </AnimatePresence>
      <SiteFooter />
    </div>
  );
}

function HomePage({ articles, savedIds, toggleSaved, loading, liveConfigured, liveError }: SharedProps) {
  const featured = articles[0] ?? demoArticles[0];
  const supporting = articles.filter((article) => article.id !== featured.id).slice(0, 3);
  return (
    <>
      <div className="wrap home-page">
        <div className="edition-strip"><span>INDEPENDENT THINKING / INTELLIGENT TECHNOLOGY</span><span className="edition-right"><span className="live-dot" />{liveConfigured ? "LIVE NEWS ENABLED" : "EDITORIAL DEMO EDITION"}<span className="edition-date">VOL. 01 — NO. 01</span></span></div>
        {!liveConfigured && <div className="demo-banner"><Sparkles size={14} /><span><strong>Demo edition.</strong> Sample stories are synthetic, not current news.</span><Link to="/about">How this works <ArrowUpRight size={13} /></Link></div>}
        {liveError && <div className="inline-alert" role="status">{liveError} Showing clearly labeled demo stories instead.</div>}
        {loading ? <div className="hero-loading"><div className="skeleton skeleton-image" /><LoadingCards /></div> : <div className="hero-grid"><FeaturedStory article={featured} /><aside className="hero-side"><span className="eyebrow">{liveConfigured ? "ON THE RADAR" : "A FEW IDEAS TO START"}</span>{supporting.map((article, index) => <Link className="side-story" to={`/article/${article.id}`} key={article.id}><span className="side-story-number">0{index + 2}</span><div><span className="side-category">{article.category}</span><h3>{article.title}</h3><span className="side-read">{article.readTime} <ArrowUpRight size={12} /></span></div></Link>)}<Link to="/latest" className="text-link">Explore all stories <ArrowRight size={14} /></Link></aside></div>}
        <div className="home-section"><SectionTitle eyebrow="THE LATEST" title="Fresh perspectives" link="All stories" /><div className="story-grid">{articles.slice(0, 3).map((article, index) => <StoryCard key={article.id} article={article} index={index} saved={savedIds.includes(article.id)} onToggle={toggleSaved} />)}</div></div>
        <div className="manifesto-band"><span className="manifesto-asterisk">✳</span><div><span className="eyebrow">A BETTER KIND OF TECH JOURNALISM</span><p>The future doesn’t need more noise.<br /><span>It needs better questions.</span></p></div><Link to="/about" className="manifesto-link">Our point of view <ArrowUpRight size={15} /></Link></div>
      </div>
      <Newsletter />
    </>
  );
}

type SharedProps = {
  articles: Article[];
  savedIds: string[];
  toggleSaved: (id: string) => void;
  loading: boolean;
  liveConfigured: boolean;
  liveError: string;
};

function StoryListing({ articles, savedIds, toggleSaved, loading, title, description, eyebrow, curated = false, initialTopic = "All stories" }: SharedProps & { title: string; description: string; eyebrow: string; curated?: boolean; initialTopic?: string }) {
  const [topic, setTopic] = useState(initialTopic);
  const [page, setPage] = useState(1);
  useEffect(() => {
    setTopic(initialTopic);
    setPage(1);
  }, [initialTopic]);
  const filtered = useMemo(() => {
    const selected = topic === "All stories" ? articles : articles.filter((article) => article.category === topic);
    return curated && selected.every((article) => article.live) ? [...selected].reverse() : selected;
  }, [articles, topic, curated]);
  const pages = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(pages, 1));
  const pageArticles = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function changeTopic(value: string) {
    setTopic(value);
    setPage(1);
  }
  return (
    <div className="wrap listing-page">
      <PageIntro eyebrow={eyebrow} title={title} copy={description}>
        {curated && <span className="curation-note"><Sparkles size={13} /> An editorial reading list—not a real-time popularity chart.</span>}
      </PageIntro>
      {!loading && <TopicFilter topics={categories} value={topic} onChange={changeTopic} />}
      {loading ? <LoadingCards /> : pageArticles.length ? <><div className="story-grid listing-grid">{pageArticles.map((article, index) => <StoryCard key={article.id} article={article} index={index} saved={savedIds.includes(article.id)} onToggle={toggleSaved} />)}</div><Pagination page={currentPage} pages={pages} onPage={setPage} /></> : <EmptyState title="No stories in this topic yet" copy="Try another topic or come back when the next edition is ready." />}
      <Newsletter />
    </div>
  );
}

function CategoryPage(props: SharedProps) {
  const byCategory = categories.slice(1).map((name, index) => ({
    name,
    count: props.articles.filter((article) => article.category === name).length,
    article: props.articles.find((article) => article.category === name) ?? demoArticles.find((article) => article.category === name),
    number: String(index + 1).padStart(2, "0"),
  }));
  return (
    <div className="wrap listing-page">
      <PageIntro eyebrow="FOLLOW YOUR CURIOSITY" title="Ideas, in focus." copy="Explore the shifts, questions, and people shaping our relationship with artificial intelligence." />
      <div className="category-grid">{byCategory.map(({ name, count, article, number }) => <Link to={`/categories?topic=${encodeURIComponent(name)}`} key={name} className="category-tile"><span className="category-number">{number} / FIELD NOTES</span><span className="category-count">{count || "—"} {count === 1 ? "STORY" : "STORIES"}</span><h2>{name}</h2><p>{article?.dek ?? "A considered look at the questions behind the headlines."}</p><span className="category-explore">Explore topic <ArrowUpRight size={15} /></span>{article && <img src={article.image} alt="" loading="lazy" />}</Link>)}</div>
      <Newsletter />
    </div>
  );
}

function SearchPage({ articles, savedIds, toggleSaved }: Pick<SharedProps, "articles" | "savedIds" | "toggleSaved">) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const matches = query ? articles.filter((article) => `${article.title} ${article.dek} ${article.category} ${article.author}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : [];
  return <div className="wrap listing-page search-page"><PageIntro eyebrow="FIND YOUR NEXT QUESTION" title="Search the signal." copy="A small library of ideas about AI, technology, and the people behind it." /><SearchHero initial={query} />{query && <div className="search-results-heading"><span className="eyebrow">{matches.length} {matches.length === 1 ? "RESULT" : "RESULTS"} FOR</span><h2>“{query}”</h2></div>}{matches.length ? <div className="story-grid listing-grid">{matches.map((article, index) => <StoryCard key={article.id} article={article} index={index} saved={savedIds.includes(article.id)} onToggle={toggleSaved} />)}</div> : query ? <EmptyState title="Nothing in this edition just yet" copy="Try a different search, or explore a topic to find your next read." /> : <div className="search-suggestions"><span className="eyebrow">A FEW PLACES TO BEGIN</span><div>{["AI & Research", "Responsible AI", "Product & Design"].map((item) => <Link to={`/search?q=${encodeURIComponent(item)}`} key={item}>{item}<ArrowUpRight size={14} /></Link>)}</div></div>}<Newsletter /></div>;
}

function ArticlePage({ articles, savedIds, toggleSaved }: Pick<SharedProps, "articles" | "savedIds" | "toggleSaved">) {
  const { id = "" } = useParams();
  const article = articles.find((item) => item.id === id);
  if (!article) return <div className="wrap listing-page"><EmptyState title="We couldn't find that story" copy="The story may have moved, or it may not be part of this edition." /></div>;
  const related = articles.filter((item) => item.id !== article.id && item.category === article.category).slice(0, 3);
  return <><div className="wrap article-wrap"><ArticleBody article={article} saved={savedIds.includes(article.id)} onToggle={toggleSaved} /><div className="related-stories"><SectionTitle eyebrow="KEEP EXPLORING" title="Related perspectives" link="All stories" />{related.length ? <div className="story-grid">{related.map((item, index) => <StoryCard key={item.id} article={item} index={index} saved={savedIds.includes(item.id)} onToggle={toggleSaved} />)}</div> : <p className="related-empty">More perspectives in this topic are on the way.</p>}</div></div><Newsletter /></>;
}

function SavedPage({ articles, savedIds, toggleSaved }: Pick<SharedProps, "articles" | "savedIds" | "toggleSaved">) {
  const savedStories = articles.filter((article) => savedIds.includes(article.id));
  return <div className="wrap listing-page"><PageIntro eyebrow="YOUR PERSONAL READING LIST" title="Keep the good ones." copy="Stories you’ve saved for a quieter moment. This list stays on this device." />{savedStories.length ? <div className="story-grid listing-grid">{savedStories.map((article, index) => <StoryCard key={article.id} article={article} index={index} saved={true} onToggle={toggleSaved} />)}</div> : <EmptyState title="Your reading list is a blank page" copy="Save a story that catches your eye. It’ll be right here when you need it." />}</div>;
}

function AboutPage() {
  return <div className="wrap editorial-page"><PageIntro eyebrow="WHY SIGNALFRAME" title={<>The future deserves<br /><span>a little more thought.</span></>} copy="An independent, curious field guide to the ideas and technologies changing how we live and work." /><div className="about-visual"><span>✳</span><p>Clear eyes.<br />Open minds.<br /><i>Better questions.</i></p><span className="about-orbit orbit-one" /><span className="about-orbit orbit-two" /></div><div className="editorial-columns"><div><span className="eyebrow">OUR POINT OF VIEW</span><h2>Not every new thing<br />is a better thing.</h2></div><div className="editorial-copy"><p>Signalframe is a small, independent publication about artificial intelligence and the people building a world around it. We’re interested in what the technology can do, what it can’t, and the choices that shape how it meets real life.</p><p>We believe good technology coverage can be curious without being breathless, thoughtful without losing its sense of possibility, and clear about what’s known and what’s still taking shape.</p><p><strong>A note about this demo:</strong> The stories on this site are clearly marked synthetic examples—not reports of real events. Live headlines only appear when an administrator configures a NewsAPI key.</p></div></div><div className="values-grid"><div><span>01</span><h3>Curiosity, with context.</h3><p>Big ideas deserve clear language and more than a passing glance.</p></div><div><span>02</span><h3>Optimism, with its eyes open.</h3><p>We can be excited about possibility while asking what it asks of us.</p></div><div><span>03</span><h3>People, always.</h3><p>Technology matters because of how it touches the lives around it.</p></div></div><div className="about-contact"><span className="eyebrow">A GOOD CONVERSATION STARTS SOMEWHERE</span><h2>Have a question or a point of view?</h2><Link to="/contact" className="button button-dark">Say hello <ArrowRight size={15} /></Link></div></div>;
}

function ContactPage() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await sendContact(values);
      setStatus("done");
      setValues({ name: "", email: "", message: "" });
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "Your message could not be saved. Please try again.");
    }
  }

  return <div className="wrap contact-page"><PageIntro eyebrow="THE INBOX IS OPEN" title={<>Good things start<br /><span>with a conversation.</span></>} copy="A story idea, a thoughtful disagreement, a question about this demo—we’d like to hear it." /><div className="contact-grid"><div className="contact-sidebar"><div className="contact-note"><MessageCircle size={20} /><h2>Say what’s on your mind.</h2><p>Your note is saved to this website’s local server for the site owner to review. It isn’t sent to an external email or mailing service.</p><span className="contact-note-foot">HUMAN REPLIES, WHEN CONNECTED</span></div><Link to="/about" className="contact-about-link"><Compass size={18} /><span>New around here?<strong>Get to know Signalframe</strong></span><ArrowUpRight size={15} /></Link></div><div className="contact-form-panel">{status === "done" ? <div className="contact-success"><span><Check size={23} /></span><h2>Your note is safely saved.</h2><p>Thank you for taking the time to write. A site administrator can review it on the server.</p><button className="button button-outline" onClick={() => setStatus("idle")}>Send another note <ArrowRight size={15} /></button></div> : <form onSubmit={submit}><div className="form-heading"><span className="eyebrow">WRITE US A NOTE</span><span>Fields marked * are required.</span></div><label>Your name *<input required minLength={2} maxLength={80} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="How should we address you?" /></label><label>Email address *<input required type="email" maxLength={254} value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" /></label><label>Your message *<textarea required minLength={12} maxLength={4000} rows={5} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} placeholder="Tell us what you’re thinking..." /></label>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={status === "loading"} className="button button-dark" type="submit">{status === "loading" ? "Saving your note…" : <>Send your note <ArrowRight size={15} /></>}</button><p className="form-privacy"><Mail size={13} /> Your message is stored locally on this server. It is not emailed.</p></form>}</div></div></div>;
}

function NotFound() {
  return <div className="wrap listing-page"><PageIntro eyebrow="A LITTLE OFF THE MAP" title="That page isn't here." copy="The signal may have shifted. Let's get you back to the good stuff." /><EmptyState title="Nothing to see here—yet" copy="Try the latest stories or pick a topic to explore." action="Go to the latest" /></div>;
}

function App() {
  const [dark, setDark] = useLocalValue("signalframe-theme", true);
  const [savedIds, setSavedIds] = useLocalValue<string[]>("signalframe-bookmarks", []);
  const [liveArticles, setLiveArticles] = useState<Article[]>([]);
  const [liveConfigured, setLiveConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveError, setLiveError] = useState("");
  const location = useLocation();
  const hasLiveHeadlines = liveConfigured && liveArticles.length > 0;
  const articles = hasLiveHeadlines ? liveArticles : demoArticles;

  useEffect(() => {
    let active = true;
    getNews()
      .then((response) => {
        if (!active) return;
        setLiveArticles(response.articles);
        setLiveConfigured(response.liveConfigured);
      })
      .catch((error: unknown) => {
        if (active) setLiveError(error instanceof Error ? error.message : "Live news could not be reached.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    const path = location.pathname;
    const topic = new URLSearchParams(location.search).get("topic");
    const story = path.startsWith("/article/") ? articles.find((article) => article.id === path.split("/").at(-1)) : undefined;
    const titles: Record<string, string> = {
      "/": "A clearer view of AI",
      "/latest": "Latest AI & technology news",
      "/trending": "Editor's picks",
      "/categories": topic || "Explore AI & technology topics",
      "/search": "Search stories",
      "/saved": "Your saved stories",
      "/about": "About Signalframe",
      "/contact": "Contact Signalframe",
    };
    const title = story?.title ?? titles[path] ?? "Page not found";
    const description = story?.dek ?? (path === "/"
      ? "Signalframe is an independent field guide to the ideas, people, and technologies shaping artificial intelligence."
      : `Explore ${title.toLocaleLowerCase()} with Signalframe, an independent field guide to artificial intelligence and technology.`);
    document.title = `${title} — Signalframe`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [articles, location.pathname, location.search]);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]);
  }, [setSavedIds]);

  return <AppFrame dark={dark} onTheme={() => setDark((value) => !value)} bookmarks={savedIds}><Routes>
    <Route path="/" element={<HomePage articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} loading={loading} liveConfigured={hasLiveHeadlines} liveError={liveError} />} />
    <Route path="/latest" element={<StoryListing articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} loading={loading} liveConfigured={hasLiveHeadlines} liveError={liveError} title="The latest thinking." description="Fresh perspectives on the technologies shaping what's next. Demo stories are clearly labeled; live headlines are linked to their publisher." eyebrow="A FRESH LOOK AT WHAT'S NEXT" />} />
    <Route path="/trending" element={<StoryListing articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} loading={loading} liveConfigured={hasLiveHeadlines} liveError={liveError} title="Worth a closer look." description="A hand-picked reading list for the ideas we think deserve another minute of your attention." eyebrow="EDITORIAL PICKS" curated />} />
    <Route path="/categories" element={<CategoryRoute articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} />} />
    <Route path="/search" element={<SearchPage articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} />} />
    <Route path="/article/:id" element={<ArticlePage articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} />} />
    <Route path="/saved" element={<SavedPage articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes></AppFrame>;
}

function CategoryRoute({ articles, savedIds, toggleSaved }: Pick<SharedProps, "articles" | "savedIds" | "toggleSaved">) {
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic");
  if (topic) {
    return <StoryListing articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} loading={false} liveConfigured={false} liveError="" title={topic} description={`Explore our ${topic.toLocaleLowerCase()} stories and perspectives.`} eyebrow="EXPLORE A TOPIC" initialTopic={topic} />;
  }
  return <CategoryPage articles={articles} savedIds={savedIds} toggleSaved={toggleSaved} loading={false} liveConfigured={false} liveError="" />;
}

export default App;
