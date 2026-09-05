// ============================================================
// Demor Hair Space — Services page logic (with photo albums)
// ============================================================

async function loadServices() {
  const grid = document.getElementById("services-grid");
  const emptyMsg = document.getElementById("services-empty");

  const { data, error } = await supabaseClient
    .from("services")
    .select("*, service_images(image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    grid.innerHTML = `<p style="color:#900;">Couldn't load services right now. Please try again shortly.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    emptyMsg.style.display = "block";
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
        ${images.length > 1 ? `<p class="desc" style="color:var(--gold-700);">+${images.length - 1} more photo${images.length - 1 > 1 ? "s" : ""}</p>` : ""}
      </div>
    </a>
  `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", loadServices);
