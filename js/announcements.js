// ============================================================
// Demor Hair Space — Announcement Banner (homepage)
// ============================================================

async function loadAnnouncements() {
  const banner = document.getElementById("announcement-banner");

  const { data, error } = await supabaseClient
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return;

  const now = new Date();
  const visible = data.filter(a => {
    if (a.show_from && new Date(a.show_from) > now) return false;
    if (a.show_until && new Date(a.show_until) < now) return false;
    return true;
  });

  if (visible.length === 0) return; // banner stays hidden

  banner.classList.add("has-items");

  const itemsHtml = visible.map(a => `
    <div class="announcement-item">
      ${a.image_url ? `<img src="${a.image_url}" alt="" />` : ""}
      <p>${a.message}</p>
      <span class="sep">✦</span>
    </div>
  `).join("");

  // Duplicate the content once so the loop is seamless (scrolls -50%, then resets invisibly)
  banner.innerHTML = `<div class="announcement-marquee-track" id="announcement-track">${itemsHtml}${itemsHtml}</div>`;

  // Set a constant, readable scroll speed regardless of how much text there is
  requestAnimationFrame(() => {
    const track = document.getElementById("announcement-track");
    const singleSetWidth = track.scrollWidth / 2;
    const PIXELS_PER_SECOND = 60; // comfortable reading speed
    const duration = singleSetWidth / PIXELS_PER_SECOND;
    track.style.animationDuration = `${duration}s`;
  });
}

document.addEventListener("DOMContentLoaded", loadAnnouncements);
