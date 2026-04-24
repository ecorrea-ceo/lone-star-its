/* ============================================================
   HC IT Pros — main.js
   Dark Mode | Hamburger Menu | Live Chat Widget
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* -------- Dark Mode -------- */
  const toggle = document.getElementById('dark-mode-toggle');
  const saved = localStorage.getItem('darkMode');

  if (saved === 'true') {
    document.body.classList.add('dark-mode');
    if (toggle) toggle.textContent = '☀️ Light';
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      toggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
      localStorage.setItem('darkMode', isDark);
    });
  }

  /* -------- Hamburger Menu -------- */
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      nav.classList.toggle('open');
    });

    // Close nav when a link is clicked
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        nav.classList.remove('open');
      });
    });
  }

  /* -------- Live Chat Widget -------- */
  const chatToggle = document.getElementById('chat-toggle');
  const chatBox = document.getElementById('chat-box');
  const chatClose = document.getElementById('chat-close');
  const chatSend = document.getElementById('chat-send');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const quickReplies = document.querySelectorAll('.quick-reply');

  const responses = {
    'pricing':    "Our plans start at $300/mo (Basic), $500/mo (Standard), and $1,000/mo (Premium). Each plan includes different levels of support and on-site visits. Check out our Pricing page for full details!",
    'services':   "We offer Managed IT Support, Network Setup & Security, Backup & Recovery, Cybersecurity Audits, Website & Email Setup, and Device Management. Visit our Services page to learn more!",
    'contact':    "You can reach us through the Contact page on our website. We'll get back to you as soon as possible — usually within a few hours!",
    'hours':      "We provide support during normal business hours, with priority response times depending on your plan. Premium clients receive 1-hour response times!",
    'area':       "We serve small businesses across the Texas Hill Country and Central Texas region, including Rockdale and surrounding areas.",
    'default':    "Thanks for reaching out to HC IT Pros! For detailed inquiries, please use our Contact page and we'll get back to you shortly. 😊"
  };

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.classList.add('chat-msg', type);
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getBotResponse(input) {
    const lower = input.toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('pricing')) return responses.pricing;
    if (lower.includes('service') || lower.includes('offer') || lower.includes('do you')) return responses.services;
    if (lower.includes('contact') || lower.includes('email') || lower.includes('reach') || lower.includes('phone')) return responses.contact;
    if (lower.includes('hour') || lower.includes('open') || lower.includes('available') || lower.includes('response')) return responses.hours;
    if (lower.includes('area') || lower.includes('location') || lower.includes('serve') || lower.includes('texas') || lower.includes('hill country')) return responses.area;
    return responses.default;
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    chatInput.value = '';
    setTimeout(() => addMessage(getBotResponse(text), 'bot'), 600);
  }

  if (chatToggle) {
    chatToggle.addEventListener('click', () => {
      chatBox.classList.toggle('open');
      chatToggle.textContent = chatBox.classList.contains('open') ? '✕' : '💬';
    });
  }

  if (chatClose) {
    chatClose.addEventListener('click', () => {
      chatBox.classList.remove('open');
      chatToggle.textContent = '💬';
    });
  }

  if (chatSend) chatSend.addEventListener('click', handleSend);

  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSend();
    });
  }

  quickReplies.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent;
      addMessage(text, 'user');
      setTimeout(() => addMessage(getBotResponse(text), 'bot'), 600);
    });
  });

});
