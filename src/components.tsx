import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Instagram,
  Linkedin,
  Menu,
  Moon,
  Search,
  Send,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { subscribe } from "./lib/api";
import type { Article } from "./types";

export function SiteHeader({ dark, onTheme, bookmarks }: { dark: boolean; onTheme: () => void; bookmarks: string[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
      setSearchOpen(false);
      setQuery("");
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner wrap">
        <Link to="/" className="wordmark" aria-label="Signalframe home">
          <span className="wordmark-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>signalframe<span className="wordmark-dot">.</span></span>
        </Link>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
          <NavLink to="/latest">Latest</NavLink>
          <NavLink to="/trending">Trending</NavLink>
          <NavLink to="/categories">Explore</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setSearchOpen((open) => !open)} aria-label={searchOpen ? "Close search" : "Search"}>
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <button className="icon-button theme-toggle" onClick={onTheme} aria-label={`Switch to ${dark ? "light" : "dark"} theme`}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link className="saved-link" to="/saved"><Bookmark size={15} /> <span>Saved</span><span className="saved-count">{bookmarks.length}</span></Link>
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {searchOpen && (
          <motion.form className="search-popover wrap" onSubmit={submitSearch} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Search size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="quick-search">Search stories</label>
            <input id="quick-search" autoFocus placeholder="Search ideas, people, technology..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <button type="submit" className="button button-dark">Search <ArrowRight size={15} /></button>
          </motion.form>
        )}
      </AnimatePresence>
    </header>
  );
}

export function PageIntro({ eyebrow, title, copy, children }: { eyebrow: string; title: ReactNode; copy: string; children?: ReactNode }) {
  return (
    <section className="page-intro">
      <span className="eyebrow"><span className="live-dot" />{eyebrow}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
      {children}
    </section>
  );
}

export function SectionTitle({ eyebrow, title, link, to = "/latest" }: { eyebrow?: string; title: string; link?: string; to?: string }) {
  return (
    <div className="section-title">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
      {link && <Link className="text-link" to={to}>{link}<ArrowUpRight size={15} /></Link>}
    </div>
  );
}

export function StoryCard({ article, saved, onToggle, index = 0 }: { article: Article; saved: boolean; onToggle: (id: string) => void; index?: number }) {
  return (
    <motion.article className="story-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.42, delay: Math.min(index * 0.055, 0.22) }}>
      <Link to={`/article/${article.id}`} className="story-image-wrap">
        <img className="story-image" src={article.image} alt={article.imageAlt} loading="lazy" />
        <span className="image-category">{article.category}</span>
        {!article.live && <span className="image-demo-label">DEMO</span>}
      </Link>
      <div className="story-body">
        <div className="story-meta"><span>{article.live ? article.source : "Signalframe Studio"}</span><span className="meta-separator">/</span><span>{article.live && article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Synthetic demo"}</span></div>
        <h3><Link to={`/article/${article.id}`}>{article.title}</Link></h3>
        <p>{article.dek}</p>
        <div className="story-footer"><span><Clock3 size={13} />{article.readTime}</span><button className={`bookmark-button ${saved ? "is-saved" : ""}`} onClick={() => onToggle(article.id)} aria-label={saved ? `Remove ${article.title} from saved stories` : `Save ${article.title}`} aria-pressed={saved}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button></div>
      </div>
    </motion.article>
  );
}

export function FeaturedStory({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.id}`} className="featured-story">
      <img src={article.image} alt={article.imageAlt} fetchPriority="high" />
      <div className="featured-shade" />
      <div className="featured-copy">
        <span className="featured-kicker"><span className="live-dot" />{article.live ? "FROM THE NEWSROOM" : "THE SIGNAL / SYNTHETIC DEMO"}</span>
        <span className="featured-category">{article.category}</span>
        <h2>{article.title}</h2>
        <p>{article.dek}</p>
        <span className="featured-cta">Read the story <ArrowUpRight size={17} /></span>
      </div>
      <span className="featured-index">01 <span>/ 04</span></span>
    </Link>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await subscribe(email);
      setStatus("done");
      setEmail("");
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "Your signup could not be saved. Please try again.");
    }
  }

  return (
    <section className="newsletter">
      <div className="newsletter-mark"><span className="wordmark-symbol"><span /><span /><span /><span /></span><span className="eyebrow">THE SIGNAL, IN YOUR INBOX</span></div>
      <div className="newsletter-copy"><h2>A little more signal.<br /><span>A lot less noise.</span></h2><p>A thoughtful note on AI, technology, and everything in between. When we're ready to send one, you'll be first to know.</p></div>
      <div className="newsletter-form-wrap">
        {status === "done" ? <div className="success-message"><Check size={18} /> Your signup was saved. Thanks for being here.</div> : (
          <form className="newsletter-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
            <input id="newsletter-email" required type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} />
            <button type="submit" aria-label="Subscribe to the newsletter" disabled={status === "loading"}>{status === "loading" ? "Saving…" : <>Join us <ArrowRight size={15} /></>}</button>
          </form>
        )}
        {error && <p className="form-error">{error}</p>}
        <span className="form-note">Saved on this site · No mailing service connected yet</span>
      </div>
      <ArrowDownRight className="newsletter-arrow" size={76} strokeWidth={0.8} aria-hidden="true" />
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about"><Link to="/" className="wordmark"><span className="wordmark-symbol"><span /><span /><span /><span /></span><span>signalframe<span className="wordmark-dot">.</span></span></Link><p>A clearer view of artificial intelligence.<br />Independent by nature. Curious by design.</p><div className="social-links"><a href="https://www.linkedin.com/" aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin size={16} /></a><a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={16} /></a></div></div>
        <div className="footer-column"><span className="eyebrow">DISCOVER</span><Link to="/latest">Latest stories</Link><Link to="/trending">Trending</Link><Link to="/categories">Topics</Link><Link to="/saved">Reading list</Link></div>
        <div className="footer-column"><span className="eyebrow">SIGNALFRAME</span><Link to="/about">Our point of view</Link><Link to="/contact">Get in touch</Link><a href="https://newsapi.org/" target="_blank" rel="noreferrer">News data partner <ExternalLink size={12} /></a></div>
        <div className="footer-note"><span className="eyebrow">A NOTE ON THIS EDITION</span><p>Demo stories are synthetic and clearly labeled. Live headlines appear only when a NewsAPI key is configured.</p><Link className="text-link" to="/about">How we work <ArrowUpRight size={14} /></Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Signalframe Studio</span><span>Made for people who stay curious.</span><Link to="/contact">Privacy & contact</Link></div>
    </footer>
  );
}

export function ArticleBody({ article, saved, onToggle }: { article: Article; saved: boolean; onToggle: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title, text: article.dek, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="article-layout">
      <div className="article-main">
        <Link to="/latest" className="back-link"><ArrowLeft size={15} /> Back to stories</Link>
        <span className="eyebrow article-eyebrow"><span className="live-dot" />{article.live ? "LIVE HEADLINE" : "SYNTHETIC DEMO STORY"}</span>
        <div className="article-category">{article.category}</div>
        <h1>{article.title}</h1>
        <p className="article-dek">{article.dek}</p>
        <div className="article-byline"><div className="author-avatar">{article.author.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><strong>{article.author}</strong><span>{article.live ? article.source : "Signalframe Studio"}{article.publishedAt ? ` · ${new Date(article.publishedAt).toLocaleDateString()}` : " · Fictional editorial"}</span></div><span className="byline-read"><Clock3 size={14} />{article.readTime}</span></div>
        <div className="article-actions"><button onClick={() => onToggle(article.id)} className={`button button-outline ${saved ? "is-saved" : ""}`}><Bookmark size={15} fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : "Save story"}</button><button onClick={() => void share()} className="button button-outline"><Copy size={15} />{copied ? "Link copied" : "Share story"}</button></div>
        <figure className="article-cover"><img src={article.image} alt={article.imageAlt} /><figcaption>{article.live ? `Image via ${article.source}` : "Illustrative image · Synthetic demo story"}</figcaption></figure>
        {!article.live && <div className="synthetic-notice"><span>✳</span><p><strong>A note from the editors.</strong> This is a fictional, AI-generated demo article. It does not report real events or current news.</p></div>}
        {article.live && article.sourceUrl && <div className="source-notice"><p>This live headline links to its original publisher. Read the full report at the source.</p><a href={article.sourceUrl} target="_blank" rel="noreferrer">Read original report <ExternalLink size={14} /></a></div>}
        <div className="article-content">{(article.content.length ? article.content : [article.dek, "This headline is provided by its original publisher. Follow the source link above to read the complete story."]).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <div className="article-endmark">✳</div>
      </div>
      <aside className="article-aside"><span className="eyebrow">IN THIS STORY</span><p>{article.category}</p><div className="aside-rule" /><span className="eyebrow">SHARE THE SIGNAL</span><button className="aside-share" onClick={() => void share()}>{copied ? "Link copied" : "Copy story link"}{copied ? <Check size={15} /> : <Copy size={15} />}</button><div className="aside-note"><span>✳</span><p>{article.live ? "Live headline. Always verify details with the original publisher." : "Synthetic demo. Created to explore ideas, not to report events."}</p></div></aside>
    </article>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages <= 1) return null;
  return <nav className="pagination" aria-label="Pagination"><button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page"><ArrowLeft size={16} /></button>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} className={page === number ? "is-current" : ""} onClick={() => onPage(number)} aria-current={page === number ? "page" : undefined}>{number}</button>)}<button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages} aria-label="Next page"><ArrowRight size={16} /></button></nav>;
}

export function LoadingCards() {
  return <div className="story-grid" aria-label="Loading stories">{Array.from({ length: 3 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton skeleton-image" /><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line medium" /></div>)}</div>;
}

export function EmptyState({ title, copy, to = "/latest", action = "Explore latest stories" }: { title: string; copy: string; to?: string; action?: string }) {
  return <div className="empty-state"><span className="empty-icon"><Search size={22} /></span><h2>{title}</h2><p>{copy}</p><Link to={to} className="button button-dark">{action}<ArrowRight size={15} /></Link></div>;
}

export function TopicFilter({ topics, value, onChange }: { topics: string[]; value: string; onChange: (topic: string) => void }) {
  return <div className="topic-filter" aria-label="Filter by topic">{topics.map((topic) => <button key={topic} className={topic === value ? "is-active" : ""} onClick={() => onChange(topic)} aria-pressed={topic === value}>{topic}</button>)}</div>;
}

export function SearchHero({ initial = "" }: { initial?: string }) {
  const [query, setQuery] = useState(initial);
  const navigate = useNavigate();
  useEffect(() => setQuery(initial), [initial]);
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/search?q=${encodeURIComponent(value)}`);
  }
  return <form className="page-search" onSubmit={submit}><label className="sr-only" htmlFor="page-search-input">Search stories</label><Search size={19} /><input id="page-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “responsible AI” or “design”" /><button className="button button-dark" type="submit">Search <Send size={14} /></button></form>;
}
