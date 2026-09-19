// ============================================================
// Demor Hair Space — Mobile Bottom Navigation
// ============================================================

(function () {
  const path = window.location.pathname.split("/").pop() || "index.html";

  const moreItems = [
    { href: "my-bookings.html", label: "My Bookings" },
    { href: "blog.html", label: "Clippers' Blog" },
    { href: "about.html", label: "About Us" },
    { href: "index.html#contact", label: "Contact" },
    { href: "terms.html", label: "Terms & Booking Policy" },
  ];
  const morePaths = ["my-bookings.html", "blog.html", "about.html", "terms.html"];
  const isMoreActive = morePaths.includes(path);

  const items = [
    { href: "index.html", label: "Home", match: ["index.html", ""],
      icon: `<svg viewBox="0 0 24 24"><path d="M4 11.5L12 4l8 7.5" /><path d="M6 10v9a1 1 0 001 1h4v-6h2v6h4a1 1 0 001-1v-9" /></svg>` },
    { href: "services.html", label: "Services", match: ["services.html"],
      icon: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg>` },
    { href: "services.html", label: "Book", match: [], isCenter: true,
      icon: `<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>` },
    { href: "gallery.html", label: "Gallery", match: ["gallery.html"],
      icon: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5-4 4-2-2-5 5"/></svg>` },
    { href: "#more", label: "More", isMore: true, isActive: isMoreActive,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>` },
  ];

  const nav = document.createElement("div");
  nav.id = "mobile-bottom-nav";
  nav.innerHTML = items.map(item => {
    if (item.isCenter) {
      const isActive = item.match.includes(path);
      return `<a href="${item.href}" class="mbn-item mbn-book ${isActive ? "active" : ""}">
        <span class="mbn-circle">${item.icon}</span>
        <span>${item.label}</span>
      </a>`;
    }
    if (item.isMore) {
      return `<button id="mbn-more-btn" class="mbn-item ${item.isActive ? "active" : ""}">
        ${item.icon}
        <span>${item.label}</span>
      </button>`;
    }
    const isActive = item.match.includes(path);
    return `<a href="${item.href}" class="mbn-item ${isActive ? "active" : ""}">
      ${item.icon}
      <span>${item.label}</span>
    </a>`;
  }).join("");

  document.body.appendChild(nav);

  // ---------- "More" bottom sheet ----------
  const sheet = document.createElement("div");
  sheet.id = "mbn-more-sheet";
  sheet.innerHTML = `
    <div id="mbn-more-backdrop"></div>
    <div id="mbn-more-panel">
      <div id="mbn-more-handle"></div>
      ${moreItems.map(mi => `<a href="${mi.href}" class="mbn-more-link ${morePaths.includes(mi.href.split("#")[0]) && mi.href.split("#")[0] === path ? "active" : ""}">${mi.label}</a>`).join("")}
    </div>
  `;
  document.body.appendChild(sheet);

  function openMore() { sheet.classList.add("open"); }
  function closeMore() { sheet.classList.remove("open"); }

  document.getElementById("mbn-more-btn").addEventListener("click", openMore);
  document.getElementById("mbn-more-backdrop").addEventListener("click", closeMore);
})();
