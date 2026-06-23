const ALLOWED_ORIGINS = new Set([
  'https://lonestar-its.com',
  'https://www.lonestar-its.com',
  'https://ecorrea-ceo.github.io',
  'https://ecorrea-ceo.github.io/lone-star-its',
  'https://lone-star-its.saints-correa23.workers.dev',
]);

const MAX_CHAT_REQUEST_BYTES = 32 * 1024;

const HUBSPOT_PORTAL_ID = '246524006';
const HUBSPOT_FORM_GUID = '0ffda371-1758-4181-bb55-cb3451bde6b3';
const HUBSPOT_SUBMIT_URL = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`;
const JIRA_BASE_URL = 'https://lonestar-its.atlassian.net';
const JSM_PROJECT_KEY = 'LSAR';

const ALLOWED_PLANS = new Set([
  'Basic Support',
  'Standard Support',
  'Premium Support',
  'Web Design & Management',
  'Not Sure',
]);

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data:",
  "form-action 'self'",
  "connect-src 'self' https://lone-star-its.saints-correa23.workers.dev",
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

const CHAT_SYSTEM_PROMPT = `You are Lone Star ITS's website assistant for general pre-sales and website questions only. Lone Star ITS is a veteran family-owned and operated managed technology services company for small businesses. Service desk support is handled by real people from the Lone Star ITS team, not outsourced to foreign countries and not replaced by AI chat bots. Be concise, professional, and helpful. Explain services clearly, encourage visitors with buying intent or support needs to use the Contact page, and never invent unavailable contact details. Services include managed IT support, human service desk coverage, network setup and security, backup and recovery, cybersecurity audits, cloud/email/websites, web design and management, and device lifecycle management. Plans are Basic Support at $300/month for up to 10 supported users, Standard Support at $500/month for up to 10 supported users, and Premium Support at $1,500/month for up to 15 supported users. Premium includes unlimited onsite visits, advanced monitoring/security, quarterly technology review, and access to Web Design & Management. Standalone Web Design & Management is $150/month after an initial custom launch quote. Larger teams or out-of-scope needs require a custom quote through the Contact page.`;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) || origin === ''
    ? (origin || 'https://lonestar-its.com')
    : 'https://lonestar-its.com';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => headers.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...SECURITY_HEADERS,
      ...corsHeaders(request),
    },
  });
}

function declaredContentLengthOversized(request) {
  const contentLength = request.headers.get('Content-Length');
  if (!contentLength) return false;
  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > MAX_CHAT_REQUEST_BYTES;
}

async function readBoundedJson(request) {
  if (declaredContentLengthOversized(request)) {
    return { error: { status: 413, message: 'Request body is too large.' } };
  }
  let buffer;
  try {
    buffer = await request.arrayBuffer();
  } catch (_) {
    return { error: { status: 400, message: 'Invalid request body.' } };
  }
  if (buffer.byteLength > MAX_CHAT_REQUEST_BYTES) {
    return { error: { status: 413, message: 'Request body is too large.' } };
  }
  try {
    return { value: JSON.parse(new TextDecoder().decode(buffer)) };
  } catch (_) {
    return { error: { status: 400, message: 'Invalid JSON request body.' } };
  }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').slice(0, 2000),
    }))
    .filter((message) => message.content.trim().length > 0);
}

function getApiKey(env) {
  return env.ANTHROPIC_API_KEY;
}

function fallbackReply(messages) {
  const latest = messages[messages.length - 1]?.content?.toLowerCase() || '';

  if (latest.includes('price') || latest.includes('pricing') || latest.includes('plan') || latest.includes('cost')) {
    return 'Lone Star ITS pricing: Basic Support $300/month for up to 10 supported users, Standard Support $500/month for up to 10 supported users, and Premium Support $1,500/month for up to 15 supported users. Standalone Web Design & Management is $150/month after the initial custom launch quote. Larger teams or out-of-scope needs require a custom quote through the Contact page.';
  }

  if (latest.includes('web') && (latest.includes('design') || latest.includes('site') || latest.includes('management'))) {
    return 'Lone Star ITS offers standalone Web Design & Management at $150/month after launch, with an initial custom quote. Premium Support clients get access to Web Design & Management. Use the Contact page to request a custom quote.';
  }

  if (latest.includes('service') || latest.includes('offer') || latest.includes('support')) {
    return 'Lone Star ITS provides managed IT support, human service desk coverage, network setup and security, cybersecurity audits, backup and recovery, cloud/email/web support, web design and management, and device lifecycle management for small businesses. Service desk support is handled by people from our team, not offshore call centers or AI chat bots.';
  }

  if (latest.includes('area') || latest.includes('location') || latest.includes('where') || latest.includes('rockdale') || latest.includes('texas')) {
    return 'Lone Star ITS is based in Rockdale, Texas. For service-area and onsite availability questions, use the Contact page so our team can confirm coverage for your business.';
  }

  if (latest.includes('hour') || latest.includes('open') || latest.includes('available')) {
    return 'For current hours, availability, and after-hours coverage details, please use the Contact page or call 254-317-9258. Service desk conversations are handled by real people on our team.';
  }

  if (latest.includes('phone') || latest.includes('call') || latest.includes('number')) {
    return 'You can reach Lone Star ITS by phone at 254-317-9258 or by email at support@lonestar-its.com. The Contact page is also a fast way to send your request.';
  }

  if (latest.includes('email') || latest.includes('reach')) {
    return 'Email Lone Star ITS at support@lonestar-its.com or call 254-317-9258. You can also use the Contact page to send a request with details.';
  }

  if (latest.includes('address') || latest.includes('mailing')) {
    return 'Lone Star ITS is based at 214 Ackerman St., Rockdale, TX 76567. For onsite scheduling or business correspondence, use the Contact page first.';
  }

  if (latest.includes('contact') || latest.includes('quote') || latest.includes('consult')) {
    return 'Lone Star ITS contact: Customer Service — support@lonestar-its.com — 254-317-9258 — 214 Ackerman St., Rockdale, TX 76567. The Contact page is the fastest way to send your request with details.';
  }

  if (latest.includes('veteran') || latest.includes('family') || latest.includes('owner')) {
    return 'Lone Star ITS is a veteran family-owned and operated managed technology services company focused on reliable, connected, secure, and supported IT for small businesses in Texas.';
  }

  if (latest.includes('security') || latest.includes('cybersecurity') || latest.includes('hacker') || latest.includes('breach')) {
    return 'Lone Star ITS handles network security, cybersecurity audits, backups, and recovery planning for small businesses. For specific concerns or an incident, use the Contact page or call 254-317-9258.';
  }

  if (latest.includes('backup') || latest.includes('recovery') || latest.includes('disaster')) {
    return 'Lone Star ITS includes backup and recovery planning as part of managed support, with structured recovery procedures. Use the Contact page to discuss backup needs and recovery objectives.';
  }

  if (latest.includes('cloud') || latest.includes('365') || latest.includes('google workspace') || latest.includes('email setup')) {
    return 'Lone Star ITS supports cloud, email, and website services including Microsoft 365 and Google Workspace setup. Use the Contact page to discuss your environment.';
  }

  if (latest.includes('hi') || latest.includes('hello') || latest.includes('hey')) {
    return 'Hi! I am the Lone Star ITS website assistant. Ask about services, pricing, service area, or contact info, and I will point you in the right direction. For real support, you will work with people from our team.';
  }

  return 'I can help with basic questions about Lone Star ITS services, pricing, service area, or how to get in touch. Reach the team at support@lonestar-its.com or 254-317-9258, or use the Contact page. What would you like to know?';
}

async function verifyTurnstile(token, env, request) {
  if (!env.TURNSTILE_SECRET) {
    console.error('TURNSTILE_SECRET not configured; rejecting chat request');
    return false;
  }
  if (!token || typeof token !== 'string') return false;

  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET);
  formData.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) formData.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) {
      console.error('Turnstile verify failed', data['error-codes']);
    }
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verify exception', err);
    return false;
  }
}

function isAllowedSource(request) {
  const origin = request.headers.get('Origin') || '';
  if (origin) return ALLOWED_ORIGINS.has(origin);
  const referer = request.headers.get('Referer') || '';
  if (!referer) return false;
  try {
    const ref = new URL(referer);
    return ALLOWED_ORIGINS.has(`${ref.protocol}//${ref.host}`);
  } catch (_) {
    return false;
  }
}

async function checkRateLimit(env, request) {
  if (!env.RATE_LIMITER) return true;
  const key = request.headers.get('CF-Connecting-IP') || 'anonymous';
  try {
    const { success } = await env.RATE_LIMITER.limit({ key });
    return success !== false;
  } catch (err) {
    console.error('Rate limit check failed', err?.message || err);
    return true;
  }
}

let cachedServiceDeskId = null;
let cachedRequestTypeId = null;

function basicAuth(env) {
  return btoa(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`);
}

function sanitizeContactInput(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const trim = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name    = trim(payload.name,    200);
  const email   = trim(payload.email,   254);
  const plan    = trim(payload.plan,    200);
  const message = trim(payload.message, 4000);

  if (!name || !email || !plan || !message) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  if (!ALLOWED_PLANS.has(plan)) return null;

  return { name, email, plan, message };
}

async function discoverJsmIds(env) {
  if (cachedServiceDeskId && cachedRequestTypeId) {
    return { serviceDeskId: cachedServiceDeskId, requestTypeId: cachedRequestTypeId };
  }
  const auth = basicAuth(env);
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };

  const sdRes = await fetch(`${JIRA_BASE_URL}/rest/servicedeskapi/servicedesk?limit=50`, { headers });
  if (!sdRes.ok) throw new Error(`Failed to list service desks: ${sdRes.status}`);
  const sdData = await sdRes.json();
  const lsar = (sdData.values || []).find((sd) => sd.projectKey === JSM_PROJECT_KEY);
  if (!lsar) throw new Error(`Service desk for project ${JSM_PROJECT_KEY} not found`);

  const rtRes = await fetch(`${JIRA_BASE_URL}/rest/servicedeskapi/servicedesk/${lsar.id}/requesttype?limit=50`, { headers });
  if (!rtRes.ok) throw new Error(`Failed to list request types: ${rtRes.status}`);
  const rtData = await rtRes.json();
  const requestTypes = rtData.values || [];
  const rt =
    requestTypes.find((t) => /service request|general/i.test(t.name)) ||
    requestTypes[0];
  if (!rt) throw new Error('No request types available in LSAR');

  cachedServiceDeskId = String(lsar.id);
  cachedRequestTypeId = String(rt.id);
  return { serviceDeskId: cachedServiceDeskId, requestTypeId: cachedRequestTypeId };
}

async function submitToHubSpot(fields, request) {
  const payload = {
    submittedAt: Date.now(),
    fields: [
      { objectTypeId: '0-1', name: 'firstname',       value: fields.name },
      { objectTypeId: '0-1', name: 'email',           value: fields.email },
      { objectTypeId: '0-1', name: 'plan_or_service', value: fields.plan },
      { objectTypeId: '0-1', name: 'message',         value: fields.message },
    ],
    context: {
      pageUri:  request.headers.get('Referer') || 'https://lonestar-its.com/contact.html',
      pageName: 'Contact | Lone Star ITS',
    },
  };
  try {
    const res = await fetch(HUBSPOT_SUBMIT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('HubSpot submission failed', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('HubSpot fetch threw', err?.message || err);
  }
}

async function createLsarTicket(fields, env) {
  if (!env.JIRA_EMAIL || !env.JIRA_API_TOKEN) {
    return { ok: false, status: 500, error: 'JSM credentials not configured' };
  }

  let serviceDeskId;
  let requestTypeId;
  try {
    ({ serviceDeskId, requestTypeId } = await discoverJsmIds(env));
  } catch (err) {
    console.error('JSM discovery failed', err?.message || err);
    return { ok: false, status: 502, error: 'JSM discovery failed' };
  }

  const summary = `Website contact: ${fields.name} — ${fields.plan}`.slice(0, 200);
  const description = [
    'New website contact submission.',
    '',
    `From: ${fields.name} <${fields.email}>`,
    `Plan or service of interest: ${fields.plan}`,
    '',
    'Message:',
    fields.message,
    '',
    '— Submitted from https://lonestar-its.com/contact.html',
  ].join('\n');

  const body = {
    serviceDeskId,
    requestTypeId,
    requestFieldValues: { summary, description },
    raiseOnBehalfOf: fields.email,
  };

  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/servicedeskapi/request`, {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${basicAuth(env)}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('JSM request creation failed', res.status, text);
      return { ok: false, status: res.status, error: text || 'JSM ticket creation failed' };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, key: data.issueKey || null };
  } catch (err) {
    console.error('JSM fetch threw', err?.message || err);
    return { ok: false, status: 502, error: 'JSM upstream error' };
  }
}

async function handleContact(request, env, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, ...corsHeaders(request) } });
  }
  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  }
  if (!isAllowedSource(request)) {
    return jsonResponse(request, { error: 'Forbidden' }, 403);
  }
  if (!(await checkRateLimit(env, request))) {
    return jsonResponse(request, { error: 'Too many requests. Please wait a moment and try again.' }, 429);
  }

  const parsed = await readBoundedJson(request);
  if (parsed.error) {
    return jsonResponse(request, { error: parsed.error.message }, parsed.error.status);
  }

  const fields = sanitizeContactInput(parsed.value);
  if (!fields) {
    return jsonResponse(request, { error: 'Required fields missing or invalid.' }, 400);
  }

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(submitToHubSpot(fields, request));
  } else {
    submitToHubSpot(fields, request).catch(() => {});
  }

  const result = await createLsarTicket(fields, env);
  if (!result.ok) {
    return jsonResponse(
      request,
      { error: "Sorry — we couldn't open a support ticket. Please email support@lonestar-its.com or try again in a moment." },
      502,
    );
  }
  return jsonResponse(request, { ok: true, key: result.key });
}

async function handleChat(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, ...corsHeaders(request) } });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  }

  if (!isAllowedSource(request)) {
    return jsonResponse(request, { error: 'Forbidden' }, 403);
  }

  if (!(await checkRateLimit(env, request))) {
    return jsonResponse(request, { error: 'Too many requests. Please wait a moment and try again.' }, 429);
  }

  const parsed = await readBoundedJson(request);
  if (parsed.error) {
    return jsonResponse(request, { error: parsed.error.message }, parsed.error.status);
  }
  const payload = parsed.value;

  const verified = await verifyTurnstile(payload.turnstileToken, env, request);
  if (!verified) {
    return jsonResponse(request, { error: 'Bot verification failed. Please refresh the page and try again.' }, 403);
  }

  const messages = sanitizeMessages(payload.messages);
  if (messages.length === 0) {
    return jsonResponse(request, { error: 'At least one user message is required.' }, 400);
  }

  const apiKey = getApiKey(env);
  if (!apiKey) {
    return jsonResponse(request, { reply: fallbackReply(messages) });
  }

  let anthropicRes;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 450,
        temperature: 0.3,
        system: [
          {
            type: 'text',
            text: CHAT_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages,
      }),
    });
  } catch (err) {
    console.error('Anthropic fetch threw', err?.message || err);
    return jsonResponse(request, { reply: fallbackReply(messages) });
  }

  const data = await anthropicRes.json().catch(() => ({}));
  if (!anthropicRes.ok) {
    console.error('Anthropic upstream error', anthropicRes.status, data?.error?.message);
    return jsonResponse(request, { reply: fallbackReply(messages) });
  }

  const reply = data.content
    ?.filter((part) => part.type === 'text')
    ?.map((part) => part.text)
    ?.join('\n')
    ?.trim();

  return jsonResponse(request, {
    reply: reply || fallbackReply(messages),
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      return handleContact(request, env, ctx);
    }

    if (request.method === 'OPTIONS' || url.pathname === '/api/chat' || (url.pathname === '/' && request.method === 'POST')) {
      return handleChat(request, env);
    }

    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      return withSecurityHeaders(response);
    }

    return withSecurityHeaders(new Response('Not found', { status: 404 }));
  },
};