<br />
<div align="center">

  <img id="banner" src="assets/BannerImage.png" alt="Banner">
  <br/>
  <br/>
  <img id="logo" src="assets/logo.jpeg" alt="Logo" height="185">
  <h3 align="center">ChronoCraft</h3>
  <p align="center">
    Crafting Data into Stories, One Timeline at a Time
    <br />
    <a href="https://youtu.be/CsF0szB0zlw">Demo [YT Video]</a>
    <br />
    <a href="https://taikai.network/hackbox/hackathons/hawkhacks/projects/clwczw3d10ckuz901uiepeat7/idea">Hackathon Post [TaiKai]</a>
  </p>
</div>

---

## ☝️ What is ChronoCraft ☝️

ChronoCraft is an innovative timeline visualization application that transforms historical inquiries and chronological topics into interactive, captivating visual narratives. Powered directly by **Google Gemini AI** (with structured schema generation) and rendered via **Knight Lab TimelineJS**, ChronoCraft enables researchers, students, educators, and history buffs to explore the flow of time seamlessly.

The application runs as a **100% static, client-side web application** deployable on **GitHub Pages**. All retrieved timelines and queries are cached locally in your browser's **IndexedDB**, allowing you to revisit and re-display past timelines on-demand from the sidebar with zero latency and zero repeated API costs.

## 💡 Inspiration 💡

The resource that became our core inspiration was the ["Timeline of Poets & Scientists" infographic Instagram post](https://www.instagram.com/p/C636c9PgOZM) designed by [Mohammad Rasoulipour](https://www.instagram.com/mo.rasoulipour/) that Amin shared with the group. This inspired us to work on a history visualization project where ChronoCraft tackles the challenge of identifying, analyzing, and illustrating chronological data with intuitive, accessible storytelling.

## ⚙️ Features ⚙️

- ⚡ **Google Gemini AI Powered**: Queries Google Gemini with strict JSON schema enforcement to generate historically accurate, structured event chronologies with dates, headlines, and descriptions.
- 🔀 **Pluggable LLM Architecture**: Built-in support for Google Gemini as default, with immediate option to switch to OpenAI (`gpt-4o` / `gpt-4o-mini`).
- 💾 **Browser-Native Caching (IndexedDB)**: Every generated timeline is automatically saved in your browser's local cache.
- 📂 **Interactive History Sidebar**: Re-display any past query instantly from the sidebar with one click without re-querying the API. Filter and star your favorite timelines.
- 🌐 **100% Serverless & Static**: Deployed directly via GitHub Pages with automated CI/CD and custom domain support.
- 🔒 **Private & Secure**: API keys are saved exclusively in your browser's local storage and are never sent to intermediate servers.
- 📊 **Knight Lab TimelineJS Visualization**: Smooth zoom, panning, media embed support, and chronological navigation.
- 📸 **Export & Sharing**: Download timelines as JSON or high-resolution images.

## 🛠️ Built With 🛠️

- **Framework**: [Next.js](https://nextjs.org/) (Static Export)
- **UI & Styling**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **AI Engines**: [Google Gemini API](https://ai.google.dev/) (Primary with JSON Schema) & [OpenAI API](https://platform.openai.com/)
- **Timeline Engine**: [Knight Lab TimelineJS](https://timeline.knightlab.com/)
- **Storage Layer**: Browser-native IndexedDB & LocalStorage
- **Deployment**: [GitHub Pages](https://pages.github.com/) via GitHub Actions

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ or 20+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free) or OpenAI API Key

### Environment Configuration

You can pre-configure your API key in an environment file so queries work immediately without entering keys into the UI:

```bash
# In the frontend directory:
cp .env.example .env.local

# Edit .env.local and insert your Gemini API Key:
# NEXT_PUBLIC_GEMINI_API_KEY=your_actual_key_here
```

### Installation

```bash
# Clone the repository
git clone https://github.com/mamin-mojtahed/ChronoCraft.git
cd ChronoCraft

# Install frontend dependencies
cd frontend
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

If you haven't set `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local`, you can also click on **Settings (gear icon)** in the top navigation bar to input your key directly into the browser's secure local storage. Once entered, search for any topic to generate your timeline!

---

## 🌐 Deploying to Vercel (Recommended for Secret API Keys)

Deploying on **[Vercel](https://vercel.com)** allows you to store your Google Gemini or OpenAI API keys as **private server secrets**, meaning visitors can generate timelines on your live site without needing their own key and without exposing your secret key in client JavaScript.

### Step-by-Step Vercel Setup:

1. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and import your ChronoCraft GitHub repository.
   - If prompted for **Root Directory**, select `frontend` (or leave as root; the included `vercel.json` automatically detects Next.js).
2. **Add Environment Variables**:
   In your Vercel Project Settings > **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your secret Google Gemini key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - *(Optional)* `OPENAI_API_KEY`: Your secret OpenAI key from [OpenAI Platform](https://platform.openai.com/api-keys).
   
   > ⚠️ **Important**: Do **not** prefix these with `NEXT_PUBLIC_` on Vercel. Leaving off the prefix keeps them server-side only in Vercel serverless functions.

3. **Deploy**:
   - Click **Deploy**. Vercel will build the Next.js application and deploy the serverless API routes (`/api/generate` and `/api/config`).
   - Your site is live! Visitors can generate timelines immediately, and anyone can still optionally supply their own personal key in the Settings modal if they choose.

---

## 📦 Building for GitHub Pages (Static Hosting)

If you prefer hosting 100% statically on GitHub Pages:

```bash
cd frontend
npm run build:pages
```

This compiles static assets into `frontend/out/`. Note that for purely static hosting without a server backend, visitors must provide their own free Gemini API key via the in-app Settings modal or via client `.env.local`.

---

## 💙 About the Team 💙

- **Hossein Molavi** [[Devpost]](https://devpost.com/Thehoos) [[LinkedIn]](https://www.linkedin.com/in/hmolavi/)
- **Amin Mojtahed** [[Devpost]](https://devpost.com/mamin-mojtahed) [[LinkedIn]](https://www.linkedin.com/in/mamin-mojtahed/)
- **Beomsoo Son** [[LinkedIn]](https://www.linkedin.com/in/beomsoo/)
- **Abtin Abbaspour** [[LinkedIn]](https://www.linkedin.com/in/abtin-abbaspour/)
