# Lone Star ITS / lone-star-its

**Lone Star ITS** is a veteran family-owned and operated managed technology services website for small businesses that need reliable IT support, secure connectivity, cybersecurity basics, backups, cloud/email setup, website support, and practical human service desk coverage.

Primary domain: https://lonestar-its.com/

GitHub Pages fallback URL after repo rename: https://ecorrea-ceo.github.io/lone-star-its/

---

## Project Structure

```
lone-star-its/
├── index.html          # Homepage — hero, mission, brand pillars, goals
├── services.html       # Managed technology services offered
├── pricing.html        # Pricing tiers and web design/management
├── about.html          # Company background and ownership messaging
├── contact.html        # Contact form (submits via Cloudflare Worker to HubSpot + Jira Service Management)
├── thankyou.html       # Post-form confirmation page
├── privacy.html        # Practical privacy notice
├── terms.html          # Website terms and service disclaimers
├── security.html       # Security practices and responsible disclosure notes
├── style.css           # Shared Lone Star ITS visual system
├── main.js             # Dark mode, hamburger menu, AI chat widget
├── worker.js           # Cloudflare Worker chat proxy and security headers
├── wrangler.jsonc      # Cloudflare Worker config
├── robots.txt          # Search crawler instructions
├── sitemap.xml         # Search engine URL discovery
├── CNAME               # GitHub Pages custom domain
├── logo.png            # Lone Star ITS full brand logo
├── logo-mark.png       # Lone Star ITS star mark for favicon/header
└── README.md           # Project documentation
```

---

## Features

- Responsive static website built with HTML, CSS, and vanilla JavaScript
- Lone Star ITS visual identity: navy + teal + silver palette, Texas star/circuit-inspired branding, clean corporate IT styling
- Dark mode toggle persisted via `localStorage`
- Accessible mobile hamburger menu with managed `aria-expanded` state
- Contact form with a bot-trap field, submitted via a Cloudflare Worker that creates a Jira Service Management ticket (project `LSAR`) and logs the lead in HubSpot
- Floating website assistant UI backed by the same Cloudflare Worker, proxying to the Anthropic API for general website questions only
- Chat widget protected by Cloudflare Turnstile and a Worker-side request-size guard; both `/api/chat` and `/api/contact` are rate-limited
- Page-level security headers via meta tags, plus real HTTP security headers when served through the Cloudflare Worker
- `LocalBusiness`/`ProfessionalService` structured data (JSON-LD) on the homepage, plus canonical links and Twitter Card tags across pages
- Skip-to-content link and a labeled chat input for keyboard/screen-reader users
- GitHub Pages-friendly structure with no build step
- SEO discovery support through `robots.txt` and `sitemap.xml`
- Custom domain support through `CNAME`: `lonestar-its.com`

---

## Managed Technology Services Content

Current site messaging focuses on:

- Managed IT Support
- Network Setup & Security
- Backup & Recovery
- Cybersecurity & Audits
- Cloud, Email & Websites
- Web Design & Management
- Device Lifecycle Management

Brand pillars used across the homepage:

- Reliable
- Connected
- Secure
- Supported

---

## Domain Setup

GitHub Pages is configured for the apex domain:

```text
lonestar-its.com
```

Recommended DNS records at Squarespace:

```text
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   ecorrea-ceo.github.io
```

Security best practice: once DNS resolves, enforce HTTPS in GitHub Pages and keep the domain verified in GitHub account settings to prevent takeover risk.

---

## AI Chat Widget Notes

The chat widget points to the Cloudflare Worker endpoint and is positioned as a general website assistant, not as the service desk. Public service-desk messaging says support conversations are handled by real people from the Lone Star ITS team, with no foreign-country outsourcing and no AI chat bots replacing support technicians.

Endpoint:

```js
const WORKER_URL = 'https://lone-star-its.saints-correa23.workers.dev/api/chat';
```

The Worker should be deployed with the configured name in `wrangler.jsonc`:

```json
"name": "lone-star-its"
```

Required Worker secret, if using Anthropic responses instead of fallback responses:

```bash
wrangler secret put ANTHROPIC_API_KEY
```

The chat endpoint is gated by Cloudflare Turnstile. The Worker rejects requests without a valid Turnstile token, which guards the Anthropic budget against scripted abuse. Set the Turnstile secret before deploying:

```bash
wrangler secret put TURNSTILE_SECRET
```

The Worker also rejects oversized chat request bodies before JSON parsing. For stronger abuse control, add a Cloudflare WAF or rate-limiting rule for `/api/chat` in the Cloudflare dashboard.

The matching site key is embedded in `main.js` as `TURNSTILE_SITE_KEY` and is safe to commit. Configure the Turnstile widget in the Cloudflare dashboard with hostnames `lonestar-its.com`, `www.lonestar-its.com`, and `ecorrea-ceo.github.io`.

Do not commit API keys, tokens, passwords, private keys, or client credentials to this repository.

---

## Contact Form Notes

The contact form posts JSON to the Cloudflare Worker's `/api/contact` endpoint:

```js
const CONTACT_URL = 'https://lone-star-its.saints-correa23.workers.dev/api/contact';
```

The Worker validates the submission, then (a) creates a request in Jira Service Management under the `LSAR` project's service desk, and (b) logs the lead as a HubSpot form submission (portal `246524006`). The client is redirected to `thankyou.html` only after the JSM ticket is created successfully; the HubSpot log runs in the background and does not block the redirect.

Required Worker secrets for the contact flow:

```bash
wrangler secret put JIRA_EMAIL
wrangler secret put JIRA_API_TOKEN
```

Legal/security notes:

- The form tells visitors not to submit credentials or other sensitive secrets.
- `privacy.html`, `terms.html`, and `security.html` are practical starting pages, not a substitute for attorney review.
- Any service promises should be captured in a signed proposal, statement of work, managed-services agreement, or SLA.

---

## How to Edit and Deploy

```bash
git clone https://github.com/ecorrea-ceo/lone-star-its.git
cd lone-star-its
python3 -m http.server 4180
```

Then open:

```text
http://localhost:4180/
```

Edit pages directly:

- `index.html` — homepage and brand messaging
- `services.html` — services list
- `pricing.html` — plan pricing and features
- `about.html` — company background, veteran family-owned messaging, no-offshore-outsourcing promise, and human service desk positioning
- `contact.html` — form copy and hidden fields
- `privacy.html`, `terms.html`, `security.html` — legal/security website notices
- `style.css` — shared visual design
- `main.js` — dark mode, mobile nav, chat behavior
- `worker.js` — chat assistant backend/fallback behavior, security headers, and request guards
- `robots.txt`, `sitemap.xml` — search discovery files

Deploy through GitHub Pages:

```bash
git add .
git commit -m "Rebrand website as Lone Star ITS"
git push origin main
```

GitHub Pages should rebuild automatically from the `main` branch root.

Deploy the Cloudflare Worker when `worker.js` or `wrangler.jsonc` changes:

```bash
wrangler deploy
```

---

## Pricing Plans

| Plan | Price | Key Features |
|---|---:|---|
| Basic Support | $300/mo | Remote troubleshooting, asset management, basic security, $50/visit, up to 10 users |
| Standard Support | $500/mo | All Basic features, priority tickets, enhanced response, $35/visit, up to 10 users |
| Premium Support | $1,500/mo | All features, unlimited visits, website support, advanced monitoring/security, up to 15 users |
| Web Design & Management | $150/mo after launch | Responsive website design, hosting/form guidance, content updates, checks; initial launch custom quote |

---

## Legal Notice

This repository contains website content and practical legal/security starter notices for Lone Star ITS. Those materials are not legal advice and should be reviewed by qualified counsel before commercial launch, regulated-industry use, or use outside the intended jurisdiction.

---

## Author

Ezekiel Correa<br>
IT Asset Management Lead Technician | CompTIA A+ | Network+<br>
Austin, TX

GitHub: https://github.com/ecorrea-ceo