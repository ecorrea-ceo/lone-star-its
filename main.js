/* ============================================================
   Lone Star ITS — main.js
   Dark Mode | Hamburger Menu | Contact Prefill | AI Chat Widget
   ============================================================ */

// Cloudflare Worker endpoint for the Lone Star ITS chat assistant.
const WORKER_URL = 'https://lone-star-its.saints-correa23.workers.dev/api/chat';
const TURNSTILE_SITE_KEY = '0x4AAAAAADT2dLLZ47ngexJ8';

document.addEventListener('DOMContentLoaded', () => {

  /* -------- Dark Mode -------- */
  const toggle = document.getElementById('dark-mode-toggle');
  const saved  = localStorage.getItem('darkMode');

  if (saved === 'true') {
    document.body.classList.add('dark-mode');
    if (toggle) toggle.textContent = 'Light';
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      toggle.textContent = isDark ? 'Light' : 'Dark';
      localStorage.setItem('darkMode', isDark);
    });
  }

  /* -------- Hamburger Menu -------- */
  const hamburger = document.getElementById('hamburger');
  const nav       = document.getElementById('main-nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      nav.classList.toggle('open');
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        nav.classList.remove('open');
      });
    });
  }

  /* -------- Contact Form Plan Prefill -------- */
  const planSelect = document.getElementById('plan');

  if (planSelect) {
    const params = new URLSearchParams(window.location.search);
    const requestedPlan = params.get('plan');

    if (requestedPlan) {
      const matchingOption = Array.from(planSelect.options).find(option => option.value === requestedPlan);
      if (matchingOption) planSelect.value = requestedPlan;
    }
  }

  /* -------- Claude AI Chat Widget -------- */
  const chatToggle   = document.getElementById('chat-toggle');
  const chatBox      = document.getElementById('chat-box');
  const chatClose    = document.getElementById('chat-close');
  const chatSend     = document.getElementById('chat-send');
  const chatInput    = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const quickReplies = document.querySelectorAll('.quick-reply');

  if (!chatToggle || !chatBox || !chatInput || !chatSend || !chatMessages) return;

  // Conversation history sent to Claude (role: user | assistant)
  const conversationHistory = [];

  // Turnstile state
  let turnstileToken = null;
  let turnstileWidgetId = null;
  let turnstileLoadPromise = null;

  function loadTurnstileApi() {
    if (turnstileLoadPromise) return turnstileLoadPromise;
    turnstileLoadPromise = new Promise((resolve, reject) => {
      window.onTurnstileApiReady = () => resolve();
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileApiReady&render=explicit';
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Turnstile script failed to load'));
      document.head.appendChild(script);
    });
    return turnstileLoadPromise;
  }

  async function renderTurnstileWidget() {
    if (turnstileWidgetId !== null) return;
    try {
      await loadTurnstileApi();
    } catch (err) {
      console.error(err);
      return;
    }
    let container = document.getElementById('turnstile-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'turnstile-container';
      const inputRow = document.getElementById('chat-input-row');
      if (inputRow && inputRow.parentNode) {
        inputRow.parentNode.insertBefore(container, inputRow);
      }
    }
    turnstileWidgetId = window.turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => { turnstileToken = token; },
      'expired-callback': () => { turnstileToken = null; },
      'error-callback': () => { turnstileToken = null; },
    });
  }

  function resetTurnstileWidget() {
    turnstileToken = null;
    if (window.turnstile && turnstileWidgetId !== null) {
      try { window.turnstile.reset(turnstileWidgetId); } catch (_) {}
    }
  }

  /* -- UI helpers -- */
  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.classList.add('chat-msg', type);
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  function setInputLocked(locked) {
    chatInput.disabled = locked;
    chatSend.disabled  = locked;
    quickReplies.forEach(btn => btn.disabled = locked);
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('chat-msg', 'bot', 'typing-indicator');
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  /* -- Call Cloudflare Worker proxy -- */
  async function getAIResponse(userMessage) {
    if (!turnstileToken) {
      return "Please wait a moment for the verification check to finish, then try again.";
    }

    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    setInputLocked(true);
    showTypingIndicator();

    const tokenForRequest = turnstileToken;
    // Each Turnstile token is single-use server-side, so reset to issue a fresh one.
    resetTurnstileWidget();

    try {
      const res = await fetch(WORKER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: conversationHistory, turnstileToken: tokenForRequest }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      const reply = data.reply;

      // Add assistant reply to history
      conversationHistory.push({ role: 'assistant', content: reply });

      return reply;

    } catch (err) {
      console.error('Chat error:', err);
      // Remove the failed user message from history so it doesn't corrupt context
      conversationHistory.pop();
      return "Sorry, I'm having trouble connecting right now. Please use our Contact page or try again in a moment!";
    } finally {
      removeTypingIndicator();
      setInputLocked(false);
      chatInput.focus();
    }
  }

  /* -- Send handler -- */
  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text || chatInput.disabled) return;

    chatInput.value = '';
    addMessage(text, 'user');

    const reply = await getAIResponse(text);
    addMessage(reply, 'bot');
  }

  /* -- Toggle open/close -- */
  chatToggle.addEventListener('click', () => {
    chatBox.classList.toggle('open');
    chatToggle.textContent = chatBox.classList.contains('open') ? 'X' : 'Chat';
    if (chatBox.classList.contains('open')) {
      chatInput.focus();
      renderTurnstileWidget();
    }
  });

  if (chatClose) {
    chatClose.addEventListener('click', () => {
      chatBox.classList.remove('open');
      chatToggle.textContent = 'Chat';
    });
  }

  /* -- Send button & Enter key -- */
  chatSend.addEventListener('click', handleSend);

  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  /* -- Quick reply buttons -- */
  quickReplies.forEach(btn => {
    btn.addEventListener('click', () => {
      if (chatInput.disabled) return;
      const text = btn.textContent;
      chatInput.value = '';
      addMessage(text, 'user');
      getAIResponse(text).then(reply => addMessage(reply, 'bot'));
    });
  });

});
