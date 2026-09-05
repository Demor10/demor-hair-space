// ============================================================
// Demor Hair Space — Homepage: top 3 services preview
// ============================================================

async function loadHomeServices() {
  const grid = document.getElementById("services-grid");

  const { data, error } = await supabaseClient
    .from("services")
    .select("*, service_images(image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) {
    grid.innerHTML = `<p style="color:#900;">Couldn't load services right now.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = `<p style="color:var(--ink-600);">Services coming soon — check back shortly.</p>`;
    return;
  }

  grid.innerHTML = data.map(service => {
    const images = (service.service_images || []).sort((a, b) => a.sort_order - b.sort_order);
    const cover = images[0]?.image_url;
    return `
      <a class="service-card" href="book.html?service=${service.id}">
        <div class="thumb">
          ${cover
            ? `<img src="${cover}" alt="${service.name}" style="width:100%;height:100%;object-fit:cover;" />`
            : `Photo coming soon`}
        </div>
        <div class="body">
          <h3>${service.name}</h3>
          <div class="price">₦${Number(service.price).toLocaleString()}</div>
          <p class="desc">${service.description || ""}</p>
        </div>
      </a>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", loadHomeServices);
