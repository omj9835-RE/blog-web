# Signalframe

A responsive editorial experience about artificial intelligence and technology. The default edition uses **clearly labeled synthetic demo stories**; it never presents sample content as current reporting. Optional live headlines are fetched server-side from NewsAPI and link back to their original publishers.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The Express API runs on `http://localhost:8787`; Vite proxies `/api` requests to it.

To build and preview the production frontend:

```bash
npm run build
npm run preview
```

The API can also be started separately with `npm start`.

## Optional live AI and technology news

Create a free/developer NewsAPI account and add the key to `.env`:

```dotenv
NEWS_API_KEY=your_newsapi_key
PORT=8787
```

Restart the API server. The key stays on the server and is not included in the browser bundle. With no key, `/api/news` reports that live news is not configured and the site displays only synthetic stories with an explicit demo notice. If a configured provider request fails, the app shows an error and falls back to the same labeled demo edition. NewsAPI plan limits and availability apply.

## Working features

- Responsive home, latest, trending/editorial picks, topic/category, search, article, saved-story, about, and contact routes.
- Search and topic filters, paginated listings, related stories, native share with clipboard fallback, persistent bookmarks, and a persistent light/dark theme preference.
- Newsletter signup and contact form use validated API endpoints and append submissions to local JSON Lines files in `server/data/`. These are **local storage only**—no email delivery, mailing provider, or production database is connected. Keep this directory private and configure an appropriate storage provider before deployment.
- Route-specific page titles, keyboard-friendly controls, image alt text, loading skeletons, empty states, reduced-motion support, and responsive navigation.

## API endpoints

- `GET /api/health` — API and live-news configuration status.
- `GET /api/news?topic=artificial%20intelligence` — optional NewsAPI headlines.
- `POST /api/contact` — validates and saves a contact message locally.
- `POST /api/newsletter` — validates and saves a signup locally.

The included Express server is suitable for local development. For deployment, serve the frontend and API from a compatible host, configure HTTPS and request protection, and replace local JSONL storage with a managed database and mailing service if you need to process submissions at scale.
