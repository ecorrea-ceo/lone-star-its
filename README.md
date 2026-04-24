# 💻 HC IT Pros

**HC IT Pros** is an Austin, TX–based IT services company providing affordable and reliable technology solutions for small businesses such as restaurants, auto shops, and local offices.

This website advertises services, pricing plans, and company information — with each section built as a separate HTML file for easy updates. It includes a **Claude AI-powered live chat widget** backed by a **Cloudflare Worker proxy**.

---

## 🌐 Live Site

[https://elspaniard97.github.io/hc-it-pros/](https://elspaniard97.github.io/hc-it-pros/)

---

## 🧱 Project Structure

```
hc-it-pros/
│
├── index.html          # Home page — mission, values, goals
├── services.html       # IT services offered
├── pricing.html        # Pricing tiers (Basic, Standard, Premium)
├── about.html          # Company background and founder info
├── contact.html        # Contact form (Formspree integration)
├── thankyou.html       # Post-form submission confirmation
├── style.css           # Shared styling across all pages
├── main.js             # Dark mode, hamburger menu, Claude AI chat widget
└── README.md           # Project documentation
```

---

## 🚀 Features

- **Clean, modern design** with responsive layout
- **Dark mode toggle** — persists across sessions via localStorage
- **Mobile hamburger menu** — collapses navigation on small screens
- **Claude AI live chat widget** — powered by Claude Haiku via Cloudflare Worker
- **Animated typing indicator** — three bouncing dots while AI responds
- **Lead capture** — AI asks for name/email when visitors show buying intent
- **Rate limiting** — 20 messages per IP per 10 minutes (built into Worker)
- **Formspree contact form** — submissions go directly to email
- **Professional pricing section** — Basic ($300/mo), Standard ($500/mo), Premium ($1,000/mo)

---

## 🤖 Claude AI Chat Widget

The chat widget in the bottom-right corner of every page is powered by **Claude Haiku** (Anthropic) via a **Cloudflare Worker proxy**.

### How it works

```
Website visitor types message
        ↓
main.js sends POST request to Cloudflare Worker
        ↓
Worker validates origin (CORS) + rate limits by IP
        ↓
Worker calls Anthropic API with full conversation history
        ↓
Claude Haiku responds as HC IT Pros support assistant
        ↓
Reply displayed in chat widget with typing animation
```

### Architecture

| Component | Details |
|---|---|
| **Frontend** | `main.js` — sends conversation history to Worker, renders responses |
| **Proxy** | Cloudflare Worker at `hc-it-pros.saints-correa23.workers.dev` |
| **AI Model** | `claude-haiku-4-5-20251001` — fast and cost-efficient |
| **API Key** | Stored as encrypted secret `Claude_API_Token` on the Worker — never exposed in browser |
| **CORS** | Worker only accepts requests from `https://elspaniard97.github.io` |

### Cloudflare Worker setup

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → open `hc-it-pros` worker
2. The worker code handles CORS, rate limiting, and proxying to the Anthropic API
3. The API key is stored under **Settings → Variables and Secrets** as `Claude_API_Token` (encrypted)

### Updating the AI system prompt

To change how the chat assistant behaves, edit the `system` prompt inside the Cloudflare Worker code:
- Go to **Workers & Pages** → `hc-it-pros` → **Edit code**
- Find the `system:` field inside the `claudeRes` fetch call
- Update pricing, services, or tone instructions
- Click **Save and Deploy**

---

## 🧩 Technologies Used

| Category | Tools |
|---|---|
| **Languages** | HTML5, CSS3, Vanilla JavaScript |
| **Fonts** | [Google Fonts – Poppins](https://fonts.google.com/specimen/Poppins) |
| **Hosting** | GitHub Pages |
| **AI** | [Anthropic Claude Haiku](https://www.anthropic.com) |
| **Proxy / Serverless** | [Cloudflare Workers](https://workers.cloudflare.com) |
| **Contact Forms** | [Formspree](https://formspree.io) |

---

## 🧰 How to Edit and Deploy

### 1. Clone the repository
```bash
git clone https://github.com/ElSpaniard97/hc-it-pros.git
cd hc-it-pros
```

### 2. Edit pages
Each page is independent:
- `index.html` → Homepage, mission, values
- `services.html` → Add or edit IT services
- `pricing.html` → Update plan pricing or features
- `about.html` → Modify company or founder info
- `contact.html` → Update the form or contact details

### 3. Update the Worker URL (if redeploying)
In `main.js` line 7, set your Cloudflare Worker URL:
```js
const WORKER_URL = 'https://hc-it-pros.saints-correa23.workers.dev';
```

### 4. Deploy to GitHub Pages
```bash
git add .
git commit -m "Your update message"
git push origin main
```
GitHub Pages auto-deploys from the `main` branch root within ~60 seconds.

---

## 💼 Pricing Plans

| Plan | Price | Key Features |
|---|---|---|
| **Basic Support** | $300/mo | Remote support, asset management, basic security, $35/visit |
| **Standard Support** | $500/mo | All Basic + higher priority, $50/visit |
| **Premium Support** | $1,000/mo | All features, unlimited visits, website support, 1-hr response |

---

## 🧑‍💻 Author

**Ezekiel Correa**
IT Asset Management Lead Technician | CompTIA A+ | Network+
Austin, TX

GitHub: [@ElSpaniard97](https://github.com/ElSpaniard97)

---

## 📜 License

This project is open for educational or personal use.
Attribution to HC IT Pros is appreciated if reused publicly.
