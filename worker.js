const ALLOWED_ORIGINS = new Set([
  'https://lonestar-its.com',
  'https://www.lonestar-its.com',
  'https://elspaniard97.github.io',
  'https://elspaniard97.github.io/lone-star-its',
  'https://lone-star-its.saints-correa23.workers.dev',
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) || origin === ''
    ? (origin || 'https://lonestar-its.com')
    : 'https://lonestar-its.com';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
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
  return env.ANTHROPIC_API_KEY || env.CLAUDE_API_TOKEN || env.Claude_API_Token || env.CLAUDE_API_KEY;
}

function fallbackReply(messages) {
  const latest = messages[messages.length - 1]?.content?.toLowerCase() || '';

  if (latest.includes('price') || latest.includes('pricing') || latest.includes('plan') || latest.includes('cost')) {
    return 'Lone Star ITS offers Basic Support at $300/month, Standard Support at $500/month, and Premium Support at $1,500/month. The best fit depends on your users, devices, sites, and security needs. Please use the Contact page to request a consultation.';
  }

  if (latest.includes('service') || latest.includes('offer') || latest.includes('support')) {
    return 'Lone Star ITS provides managed IT support, human service desk coverage, network setup and security, cybersecurity audits, backup and recovery, cloud/email/web support, and device lifecycle management for small businesses. Service desk support is handled by people from the Lone Star ITS team, not offshore call centers or AI chat bots.';
  }

  if (latest.includes('area') || latest.includes('location') || latest.includes('where')) {
    return 'Lone Star ITS supports small businesses with practical managed technology services. For onsite availability and service-area questions, please use the Contact page so the team can confirm coverage.';
  }

  if (latest.includes('contact') || latest.includes('call') || latest.includes('email') || latest.includes('quote')) {
    return 'The fastest next step is to use the Contact page with a short note about your business, number of users/devices, and what you need help with. Lone Star ITS will follow up from there.';
  }

  if (latest.includes('veteran') || latest.includes('family')) {
    return 'Lone Star ITS is a veteran family-owned and operated managed technology services company focused on reliable, connected, secure, and supported IT for small businesses.';
  }

  return 'I can help with general website questions about Lone Star ITS services, pricing, service-area questions, and next steps. Lone Star ITS is veteran family owned and operated, and service desk support is handled by real people from the team. What would you like to know?';
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

async function handleChat(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  }

  if (!isAllowedSource(request)) {
    return jsonResponse(request, { error: 'Forbidden' }, 403);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return jsonResponse(request, { error: 'Invalid JSON request body.' }, 400);
  }

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

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 450,
      temperature: 0.3,
      system: `You are Lone Star ITS's website assistant for general pre-sales and website questions only. Lone Star ITS is a veteran family-owned and operated managed technology services company for small businesses. Service desk support is handled by real people from the Lone Star ITS team, not outsourced to foreign countries and not replaced by AI chat bots. Be concise, professional, and helpful. Explain services clearly, encourage visitors with buying intent or support needs to use the Contact page, and never invent unavailable contact details. Services include managed IT support, human service desk coverage, network setup and security, backup and recovery, cybersecurity audits, cloud/email/websites, and device lifecycle management. Plans are Basic Support at $300/month, Standard Support at $500/month, and Premium Support at $1,500/month.`,
      messages,
    }),
  });

  const data = await anthropicRes.json().catch(() => ({}));
  if (!anthropicRes.ok) {
    console.error('Anthropic upstream error', anthropicRes.status, data?.error?.message);
    return jsonResponse(request, {
      error: 'The website assistant is temporarily unavailable. Please use the Contact page.',
    }, 502);
  }

  const reply = data.content
    ?.filter((part) => part.type === 'text')
    ?.map((part) => part.text)
    ?.join('\n')
    ?.trim();

  return jsonResponse(request, {
    reply: reply || 'Sorry, I could not generate a response. Please use the Contact page and we will follow up.',
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' || url.pathname === '/api/chat' || (url.pathname === '/' && request.method === 'POST')) {
      return handleChat(request, env);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
