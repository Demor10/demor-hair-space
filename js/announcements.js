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

  if (error || !data || data.length === 0) return; // banner stays hidden

  banner.classList.add("has-items");
  banner.innerHTML = `<div class="announcement-track" id="announcement-track">
    ${data.map(a => `
      <div class="announcement-slide">
        ${a.image_url ? `<img src="${a.image_url}" alt="" />` : ""}
        <p>${a.message}</p>
      </div>
    `).join("")}
  </div>`;

  if (data.length > 1) {
    let current = 0;
    const track = document.getElementById("announcement-track");
    setInterval(() => {
      current = (current + 1) % data.length;
      track.style.transform = `translateX(-${current * 100}%)`;
    }, 5000);
  }
}

document.addEventListener("DOMContentLoaded", loadAnnouncements);
