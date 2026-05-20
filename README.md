# Lone Star ITS / lone-star-its

**Lone Star ITS** is a veteran family-owned and operated managed technology services website for small businesses that need reliable IT support, secure connectivity, cybersecurity basics, backups, cloud/email setup, website support, and practical human service desk coverage.

Primary domain: https://lonestar-its.com/

GitHub Pages fallback URL after repo rename: https://elspaniard97.github.io/lone-star-its/

---

## Project Structure

```
lone-star-its/
├── index.html          # Homepage — hero, mission, brand pillars, goals
├── services.html       # Managed technology services offered
├── pricing.html        # Pricing tiers and web design/management
├── about.html          # Company background and ownership messaging
├── contact.html        # Contact form via Formspree
├── thankyou.html       # Post-form confirmation page
├── privacy.html        # Practical privacy notice
├── terms.html          # Website terms and service disclaimers
├── security.html       # Security practices and responsible disclosure notes
├── style.css           # Shared Lone Star ITS visual system
├── main.js             # Dark mode, hamburger menu, AI chat widget
├── worker.js           # Cloudflare Worker chat proxy
├── wrangler.jsonc      # Cloudflare Worker config
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
- Mobile hamburger menu
- Contact form using Formspree with a bot-trap field and privacy/terms notice
- Floating website assistant UI backed by a Cloudflare Worker proxy for general website questions only
- Page-level security headers via meta tags
- GitHub Pages-friendly structure with no build step
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
CNAME www   ElSpaniard97.github.io
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

Do not commit API keys, tokens, passwords, private keys, or client credentials to this repository.

---

## Contact Form Notes

The Formspree endpoint remains:

```html
https://formspree.io/f/mqagreqy
```

The hidden subject and redirect URL are configured as:

```html
New Contact Form Submission - Lone Star ITS
https://lonestar-its.com/thankyou.html
```

Legal/security notes:

- The form tells visitors not to submit credentials or other sensitive secrets.
- `privacy.html`, `terms.html`, and `security.html` are practical starting pages, not a substitute for attorney review.
- Any service promises should be captured in a signed proposal, statement of work, managed-services agreement, or SLA.

---

## How to Edit and Deploy

```bash
git clone https://github.com/ElSpaniard97/lone-star-its.git
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
- `worker.js` — chat assistant backend/fallback behavior

Deploy through GitHub Pages:

```bash
git add .
git commit -m "Rebrand website as Lone Star ITS"
git push origin main
```

GitHub Pages should rebuild automatically from the `main` branch root.

---

## Pricing Plans

| Plan | Price | Key Features |
|---|---:|---|
| Basic Support | $300/mo | Remote troubleshooting, asset management, basic security, $35/visit, up to 10 users |
| Standard Support | $500/mo | All Basic features, priority tickets, enhanced response, $50/visit, up to 10 users |
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

GitHub: https://github.com/ElSpaniard97
