/* ============================================================
   Lone Star ITS — main.js
   Dark Mode | Hamburger Menu | Contact Form | AI Chat Widget
   ============================================================ */

// Cloudflare Worker endpoint for the Lone Star ITS chat assistant.
const WORKER_URL = 'https://lone-star-its.saints-correa23.workers.dev/api/chat';
const TURNSTILE_SITE_KEY = '0x4AAAAAADT2dLLZ47ngexJ8';

// HubSpot Forms Submission API — contact form on contact.html.
const HUBSPOT_PORTAL_ID = '246524006';
const HUBSPOT_FORM_GUID = '0ffda371-1758-4181-bb55-cb3451bde6b3';
const HUBSPOT_SUBMIT_URL = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`;

document.addEventListener('DOMContentLoaded', () => {

  /* -------- Dark Mode -------- */
  const toggle = document.getElementById('dark-mode-toggle');
  const saved  = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const startDark = saved === null ? prefersDark : saved === 'true';

  if (startDark) {
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
    hamburger.setAttribute('aria-controls', nav.id || 'main-nav');
    hamburger.setAttribute('aria-expanded', 'false');

    function setMenuOpen(isOpen) {
      hamburger.classList.toggle('open', isOpen);
      nav.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    }

    hamburger.addEventListener('click', () => {
      setMenuOpen(!nav.classList.contains('open'));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenuOpen(false));
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

  /* -------- Contact Form Submission (HubSpot) -------- */
  const contactForm = document.getElementById('contact-form');
  const formStatus  = document.getElementById('form-status');

  if (contactForm) {
    const setFormStatus = (text, type) => {
      if (!formStatus) return;
      formStatus.textContent = text;
      formStatus.dataset.state = type || '';
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const honeypot = contactForm.elements['_gotcha'];
      if (honeypot && honeypot.value) {
        // Likely a bot — silently send to the success page.
        window.location.href = 'thankyou.html';
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      setFormStatus('Sending…', 'pending');

      const payload = {
        submittedAt: Date.now(),
        fields: [
          { objectTypeId: '0-1', name: 'firstname',       value: contactForm.elements['name'].value.trim() },
          { objectTypeId: '0-1', name: 'email',           value: contactForm.elements['email'].value.trim() },
          { objectTypeId: '0-1', name: 'plan_or_service', value: contactForm.elements['plan'].value },
          { objectTypeId: '0-1', name: 'message',         value: contactForm.elements['message'].value.trim() }
        ],
        context: {
          pageUri:  window.location.href,
          pageName: document.title
        }
      };

      try {
        const res = await fetch(HUBSPOT_SUBMIT_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload)
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error('HubSpot submission failed:', res.status, errBody);
          throw new Error('Submission failed');
        }

        window.location.href = 'thankyou.html';
      } catch (err) {
        console.error('Contact form error:', err);
        setFormStatus(
          "Sorry — we couldn't send your message. Please email support@lonestar-its.com or try again in a moment.",
          'error'
        );
        if (submitBtn) submitBtn.disabled = false;
      }
    });
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

  chatToggle.setAttribute('aria-controls', chatBox.id || 'chat-box');
  chatToggle.setAttribute('aria-expanded', 'false');

  function setChatOpen(isOpen) {
    chatBox.classList.toggle('open', isOpen);
    chatToggle.textContent = isOpen ? 'X' : 'Chat';
    chatToggle.setAttribute('aria-expanded', String(isOpen));
    chatToggle.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');

    if (isOpen) {
      chatInput.focus();
      renderTurnstileWidget();
    }
  }

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
    setChatOpen(!chatBox.classList.contains('open'));
  });

  if (chatClose) {
    chatClose.addEventListener('click', () => setChatOpen(false));
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