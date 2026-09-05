// ============================================================
// Demor Hair Space — Mobile Nav Toggle
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("nav-toggle-btn");
  const nav = document.querySelector("nav.main-nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  // Close the menu after tapping a link, so it doesn't stay open
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
});
