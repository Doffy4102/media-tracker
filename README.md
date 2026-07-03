# Media Tracker

Track anime, manga, movies, TV series, and books in one place. Powered by TMDB, Jikan (MyAnimeList), and Google Books APIs.

## Features

- **Multi-media dashboard** — filter by type (anime, manga, movies, TV, books) and sort by score, title, year, date added, or progress
- **Search & add** — search TMDB, Jikan, or Google Books, preview details with a confirmation panel, then add to your list with a chosen status
- **Track progress** — episodes watched, chapters read, or pages read with total counts auto-fetched from source APIs
- **External scores** — see TMDB ratings, MyAnimeList scores, or Google Books ratings on every card
- **Watch sources** — streaming, rental, and purchase providers from TMDB for movies and TV shows
- **User auth** — email/password signup and login with JWT session cookies
- **Dark mode** — toggleable theme with system preference detection, persisted to localStorage
- **Teal/cyan palette** — vibrant OKLCH-based color scheme for both light and dark modes

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Database** — PostgreSQL via Prisma ORM
- **Auth** — JWT session cookies (jose + bcryptjs)
- **UI** — Base UI, Tailwind CSS v4, Lucide icons
- **APIs** — TMDB, Jikan (MyAnimeList), Google Books

## Prerequisites

- Node.js 20+
- API keys (see below)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd media-tracker
npm install
```

### 2. Set up environment variables

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `TMDB_API_KEY` | TMDB API key ([get one here](https://www.themoviedb.org/settings/api)) |
| `AUTH_SECRET` | 32-byte hex string for JWT signing (run `openssl rand -hex 32`) |

Optional variables:

| Variable | Description |
|----------|-------------|
| `GOOGLE_BOOKS_API_KEY` | Google Books API key (free, [enable here](https://console.cloud.google.com/apis/library/books.googleapis.com)) |

### 3. Set up a PostgreSQL database

You need a Postgres instance. Options:

- **Local:** `createdb media_tracker` if you have Postgres installed
- **Free cloud:** [Neon](https://neon.tech) (0.5GB storage, generous free tier)

Once you have a connection string, add it to `.env`:

```
DATABASE_URL="postgresql://user:password@host:5432/media_tracker"
```

### 4. Sync the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on the home page — click **Open Dashboard** to sign up and start tracking.

## Deploy to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Create a Neon database

Go to [neon.tech](https://neon.tech), sign up, create a project, and copy the connection string.

### 3. Connect Vercel to your repo

- Go to [vercel.com](https://vercel.com), click **Add New → Project**
- Import your GitHub repo
- Under **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `TMDB_API_KEY` | Your TMDB API key |
| `AUTH_SECRET` | Your 32-byte hex secret |
| `GOOGLE_BOOKS_API_KEY` | (optional) Your Google Books API key |

### 4. Deploy

Click **Deploy**. Vercel will detect Next.js, build, and run `prisma generate` automatically. After the first deploy, run the database sync:

```bash
npx vercel env pull
npx prisma db push
```

Or via SSH after deploy — Vercel's CLI handles this. Once deployed, your app is live at `your-project.vercel.app`.

## Project Structure

```
src/
├── app/
│   ├── actions/        # Server actions (auth)
│   ├── api/            # REST API routes (media, search, auth)
│   ├── auth/           # Login/register pages
│   ├── dashboard/      # Main dashboard page
│   └── media/[id]/     # Media detail page
├── components/
│   ├── ui/             # Base UI primitives (button, dialog, select, etc.)
│   ├── AuthModal.tsx   # Register/login modal
│   ├── AuthStatus.tsx  # Nav bar auth state
│   ├── MediaCard.tsx   # Dashboard media card
│   ├── RatingStars.tsx # Star rating component
│   ├── SearchDialog.tsx# Search + confirmation dialog
│   └── ThemeToggle.tsx # Dark/light mode toggle
├── lib/
│   ├── api/            # External API clients (tmdb, jikan, books)
│   ├── dal.ts          # Data access layer (session verification)
│   ├── session.ts      # JWT encryption/decryption
│   ├── types.ts        # Shared types
│   └── constants.ts    # Labels, options
└── generated/prisma/   # Prisma client (auto-generated)
```

## License

MIT
