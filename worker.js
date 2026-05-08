const ALLOWED_ORIGINS = new Set([
  'https://elspaniard97.github.io',
  'https://elspaniard97.github.io/anchorlink-msp',
  'https://hc-it-pros.saints-correa23.workers.dev',
  'https://anchorlink-msp.saints-correa23.workers.dev',
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) || origin === ''
    ? (origin || 'https://elspaniard97.github.io')
    : 'https://elspaniard97.github.io';

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

  if (latest.includes('price') || latest.includes('plan') || latest.includes('cost')) {
    return 'AnchorLink Tech offers Basic Support at $300/month, Standard Support at $500/month, and Premium Support at $1,000/month. The best fit depends on your users, devices, sites, and security needs. Please use the Contact page to request a consultation.';
  }

  if (latest.includes('service') || latest.includes('offer') || latest.includes('support')) {
    return 'AnchorLink Tech provides managed IT support, network setup and security, cybersecurity audits, backup and recovery, cloud/email/web support, and device lifecycle management for small businesses.';
  }

  if (latest.includes('area') || latest.includes('location') || latest.includes('where')) {
    return 'AnchorLink Tech supports small businesses with practical managed technology services. For onsite availability and service-area questions, please use the Contact page so the team can confirm coverage.';
  }

  if (latest.includes('contact') || latest.includes('call') || latest.includes('email') || latest.includes('quote')) {
    return 'The fastest next step is to use the Contact page with a short note about your business, number of users/devices, and what you need help with. AnchorLink Tech will follow up from there.';
  }

  if (latest.includes('veteran') || latest.includes('family')) {
    return 'AnchorLink Tech is a family- and veteran-owned managed technology services company focused on reliable, connected, secure, and supported IT for small businesses.';
  }

  return 'I can help with AnchorLink Tech services, pricing, service-area questions, and next steps. AnchorLink Tech is a family- and veteran-owned managed technology services company for small businesses. What would you like to know?';
}

async function handleChat(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return jsonResponse(request, { error: 'Invalid JSON request body.' }, 400);
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
      system: `You are AnchorLink Tech's website assistant. AnchorLink Tech is a family- and veteran-owned managed technology services company for small businesses. Be concise, professional, and helpful. Explain services clearly, encourage visitors with buying intent to use the Contact page, and never invent unavailable contact details. Services include managed IT support, network setup and security, backup and recovery, cybersecurity audits, cloud/email/websites, and device lifecycle management. Plans are Basic Support at $300/month, Standard Support at $500/month, and Premium Support at $1,000/month.`,
      messages,
    }),
  });

  const data = await anthropicRes.json().catch(() => ({}));
  if (!anthropicRes.ok) {
    return jsonResponse(request, {
      error: data.error?.message || `Anthropic request failed with status ${anthropicRes.status}`,
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
