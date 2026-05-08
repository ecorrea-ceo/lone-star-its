/* ============================================================
   AnchorLink Tech — main.js
   Dark Mode | Hamburger Menu | AI Chat Widget
   ============================================================ */

// Cloudflare Worker endpoint for the AnchorLink Tech chat assistant.
const WORKER_URL = 'https://hc-it-pros.saints-correa23.workers.dev/api/chat';

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

  /* -------- Claude AI Chat Widget -------- */
  const chatToggle   = document.getElementById('chat-toggle');
  const chatBox      = document.getElementById('chat-box');
  const chatClose    = document.getElementById('chat-close');
  const chatSend     = document.getElementById('chat-send');
  const chatInput    = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const quickReplies = document.querySelectorAll('.quick-reply');

  // Conversation history sent to Claude (role: user | assistant)
  const conversationHistory = [];

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
    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    setInputLocked(true);
    showTypingIndicator();

    try {
      const res = await fetch(WORKER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: conversationHistory }),
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
  if (chatToggle) {
    chatToggle.addEventListener('click', () => {
      chatBox.classList.toggle('open');
      chatToggle.textContent = chatBox.classList.contains('open') ? 'X' : 'Chat';
      if (chatBox.classList.contains('open')) chatInput.focus();
    });
  }

  if (chatClose) {
    chatClose.addEventListener('click', () => {
      chatBox.classList.remove('open');
      chatToggle.textContent = 'Chat';
    });
  }

  /* -- Send button & Enter key -- */
  if (chatSend) chatSend.addEventListener('click', handleSend);

  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

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
