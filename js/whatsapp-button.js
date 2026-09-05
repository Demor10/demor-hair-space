// ============================================================
// Demor Hair Space — WhatsApp Quick Contact Button
// ============================================================

(function () {
  const WHATSAPP_NUMBER = "2349029122629"; // international format, no + or leading 0
  const message = encodeURIComponent("Hi Demor Hair Space, I'd like to ask about...");

  const btn = document.createElement("a");
  btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  btn.target = "_blank";
  btn.rel = "noopener";
  btn.id = "whatsapp-float-btn";
  btn.setAttribute("aria-label", "Chat with us on WhatsApp");
  btn.innerHTML = `
    <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff">
      <path d="M16.001 3C9.11 3 3.5 8.61 3.5 15.5c0 2.34.63 4.53 1.73 6.42L3 29l7.27-2.19a12.44 12.44 0 0 0 5.73 1.4h.01c6.89 0 12.5-5.61 12.5-12.5S22.89 3 16.001 3zm0 22.75h-.01a10.24 10.24 0 0 1-5.22-1.43l-.37-.22-3.88 1.17 1.19-3.78-.24-.39a10.2 10.2 0 0 1-1.56-5.4c0-5.66 4.61-10.27 10.28-10.27 2.75 0 5.33 1.07 7.27 3.01a10.2 10.2 0 0 1 3.01 7.27c0 5.67-4.61 10.28-10.27 10.28zm5.63-7.7c-.31-.15-1.82-.9-2.1-1s-.49-.15-.69.15-.79 1-.97 1.2-.36.23-.66.08a8.18 8.18 0 0 1-2.41-1.49 9.04 9.04 0 0 1-1.67-2.08c-.17-.3 0-.46.13-.61.14-.14.31-.36.46-.54.15-.18.2-.31.31-.51.1-.2.05-.38-.02-.53s-.69-1.66-.94-2.28c-.25-.6-.5-.52-.69-.53h-.59a1.14 1.14 0 0 0-.82.38 3.45 3.45 0 0 0-1.08 2.57c0 1.51 1.1 2.97 1.26 3.18.15.2 2.17 3.32 5.27 4.65a17.7 17.7 0 0 0 1.76.65 4.24 4.24 0 0 0 1.94.12c.59-.09 1.82-.74 2.08-1.46.26-.71.26-1.32.18-1.45s-.28-.2-.59-.35z"/>
    </svg>
  `;
  document.body.appendChild(btn);

  const style = document.createElement("style");
  style.textContent = `
    #whatsapp-float-btn {
      position: fixed;
      bottom: 24px;
      left: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #25D366;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      z-index: 998;
      text-decoration: none;
    }
    #whatsapp-float-btn:hover { background: #1ebe5a; }
    @media (max-width: 480px) {
      #whatsapp-float-btn { left: 16px; width: 50px; height: 50px; }
    }
  `;
  document.head.appendChild(style);
})();
