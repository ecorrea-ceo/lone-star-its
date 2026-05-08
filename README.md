# AnchorLink Tech / anchorlink-msp

**AnchorLink Tech** is a managed technology services website for small businesses that need reliable IT support, secure connectivity, cybersecurity basics, backups, cloud/email setup, and practical help desk coverage.

The site has been rebranded from `hc-it-pros` to `anchorlink-msp` and redesigned around the supplied AnchorLink Tech logo image: navy, teal, silver, white space, circuit-line accents, and the tagline **Managed Technology Services**.

---

## Live Site

After the repository is renamed and GitHub Pages redeploys, the expected URL is:

https://elspaniard97.github.io/anchorlink-msp/

Old URL before rename:

https://elspaniard97.github.io/hc-it-pros/

---

## Project Structure

```
anchorlink-msp/
├── index.html          # Homepage — hero, mission, brand pillars, goals
├── services.html       # Managed technology services offered
├── pricing.html        # Pricing tiers: Basic, Standard, Premium
├── about.html          # Company/founder information
├── contact.html        # Contact form via Formspree
├── thankyou.html       # Post-form confirmation page
├── style.css           # Shared AnchorLink visual system
├── main.js             # Dark mode, hamburger menu, AI chat widget
├── logo.png            # AnchorLink Tech brand image
└── README.md           # Project documentation
```

---

## Features

- Responsive static website built with HTML, CSS, and vanilla JavaScript
- AnchorLink Tech visual identity: navy + teal + silver palette, circuit-inspired background details, clean corporate IT styling
- Dark mode toggle persisted via `localStorage`
- Mobile hamburger menu
- Contact form using Formspree
- Floating AI chat widget UI
- Security headers via page-level meta tags
- GitHub Pages-friendly structure with no build step

---

## Managed Technology Services Content

Current site messaging focuses on:

- Managed IT Support
- Network Setup & Security
- Backup & Recovery
- Cybersecurity & Audits
- Cloud, Email & Websites
- Device Lifecycle Management

Brand pillars used across the homepage:

- Reliable
- Connected
- Secure
- Supported

---

## AI Chat Widget Notes

The chat widget still points to the existing Cloudflare Worker endpoint:

```js
const WORKER_URL = 'https://hc-it-pros.saints-correa23.workers.dev';
```

Recommended follow-up after the repo rename:

1. Rename or recreate the Cloudflare Worker as `anchorlink-msp` or `anchorlink-tech`.
2. Update the Worker system prompt from HC IT Pros to AnchorLink Tech.
3. Verify CORS allows `https://elspaniard97.github.io`.
4. Update `main.js` with the new Worker URL if it changes.

---

## Contact Form Notes

The Formspree endpoint remains:

```html
https://formspree.io/f/mqagreqy
```

The hidden subject and redirect URL have been updated for AnchorLink Tech and the expected GitHub Pages path:

```html
New Contact Form Submission - AnchorLink Tech
https://elspaniard97.github.io/anchorlink-msp/thankyou.html
```

---

## How to Edit and Deploy

```bash
git clone https://github.com/ElSpaniard97/anchorlink-msp.git
cd anchorlink-msp
```

Edit pages directly:

- `index.html` — homepage and brand messaging
- `services.html` — services list
- `pricing.html` — plan pricing and features
- `about.html` — founder/company story
- `contact.html` — form copy and hidden fields
- `style.css` — shared visual design
- `main.js` — dark mode, mobile nav, chat behavior

Deploy through GitHub Pages:

```bash
git add .
git commit -m "Rebrand website as AnchorLink Tech"
git push origin main
```

GitHub Pages should rebuild automatically from the `main` branch root.

---

## Pricing Plans

| Plan | Price | Key Features |
|---|---:|---|
| Basic Support | $300/mo | Remote troubleshooting, asset management, basic security, $35/visit |
| Standard Support | $500/mo | All Basic features, priority tickets, enhanced response, $50/visit |
| Premium Support | $1,000/mo | All features, unlimited visits, website support, advanced monitoring/security |

---

## Author

Ezekiel Correa<br>
IT Asset Management Lead Technician | CompTIA A+ | Network+<br>
Austin, TX

GitHub: https://github.com/ElSpaniard97

---

## License

This project is open for educational or personal use. Attribution to AnchorLink Tech is appreciated if reused publicly.
