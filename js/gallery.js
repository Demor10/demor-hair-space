// ============================================================
// Demor Hair Space — Gallery page logic (browse only, no actions)
// ============================================================

async function loadGallery() {
  const container = document.getElementById("gallery-container");

  const { data, error } = await supabaseClient
    .from("services")
    .select("id, name, service_images(image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    container.innerHTML = `<p style="color:#900;">Couldn't load the gallery right now.</p>`;
    console.error(error);
    return;
  }

  const categoriesWithPhotos = (data || []).filter(s => (s.service_images || []).length > 0);

  if (categoriesWithPhotos.length === 0) {
    container.innerHTML = `<p style="color:var(--ink-600);">No photos have been added yet — check back soon.</p>`;
    return;
  }

  container.innerHTML = categoriesWithPhotos.map(service => {
    const images = (service.service_images || []).sort((a, b) => a.sort_order - b.sort_order);
    return `
      <div class="gallery-category">
        <h3>${service.name}</h3>
        <div class="gallery-grid">
          ${images.map(img => `<img src="${img.image_url}" alt="${service.name}" data-full="${img.image_url}" />`).join("")}
        </div>
      </div>
    `;
  }).join("");
}

// ---------- Lightbox ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

document.addEventListener("click", (e) => {
  if (e.target.matches(".gallery-grid img")) {
    lightboxImg.src = e.target.dataset.full;
    lightboxImg.alt = e.target.alt;
    lightbox.classList.add("open");
  }
});

document.getElementById("lightbox-close").addEventListener("click", () => {
  lightbox.classList.remove("open");
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.classList.remove("open");
});

document.addEventListener("DOMContentLoaded", loadGallery);
