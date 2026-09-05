// ============================================================
// Demor Hair Space — Chatbot Widget
// ============================================================
// Include this on any page (after supabase-client.js) to add a
// floating chat bubble that talks to the AI router edge function.

(function () {
  const conversation = [
    { role: "assistant", content: "Hi! I'm here to help you find the right style and book an appointment. What are you looking for today?" }
  ];

  // Inject widget HTML
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <button id="chat-bubble-btn" aria-label="Chat with us">💬</button>
    <div id="chat-panel">
      <div id="chat-header">
        <span>Demor Assistant</span>
        <button id="chat-close-btn">✕</button>
      </div>
      <div id="chat-messages"></div>
      <div id="chat-input-row">
        <input type="text" id="chat-input" placeholder="Ask about styles, hours, booking…" />
        <button id="chat-send-btn">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const panel = document.getElementById("chat-panel");
  const messagesEl = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");

  function renderMessages() {
    messagesEl.innerHTML = conversation.map(m =>
      `<div class="chat-msg ${m.role}">${m.content}</div>`
    ).join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  renderMessages();

  document.getElementById("chat-bubble-btn").addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  });
  document.getElementById("chat-close-btn").addEventListener("click", () => {
    panel.classList.remove("open");
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    conversation.push({ role: "user", content: text });
    renderMessages();

    const typingEl = document.createElement("div");
    typingEl.className = "chat-msg typing";
    typingEl.textContent = "Typing…";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ messages: conversation.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      typingEl.remove();

      if (!res.ok || data.error) {
        conversation.push({ role: "assistant", content: data.error || "Sorry, something went wrong. Please try again or reach us on WhatsApp." });
      } else {
        conversation.push({ role: "assistant", content: data.reply });
      }
    } catch (err) {
      typingEl.remove();
      conversation.push({ role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again shortly." });
      console.error(err);
    }
    renderMessages();
  }

  document.getElementById("chat-send-btn").addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
})();
