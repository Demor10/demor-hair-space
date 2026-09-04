// ============================================================
// Demor Hair Space — Services page logic
// ============================================================

async function loadServices() {
  const grid = document.getElementById("services-grid");
  const emptyMsg = document.getElementById("services-empty");

  const { data, error } = await supabaseClient
    .from("services")
    .select("*")
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

  grid.innerHTML = data.map(service => `
    <a class="service-card" href="book.html?service=${service.id}">
      <div class="thumb">
        ${service.image_url
          ? `<img src="${service.image_url}" alt="${service.name}" style="width:100%;height:100%;object-fit:cover;" />`
          : `Photo coming soon`}
      </div>
      <div class="body">
        <h3>${service.name}</h3>
        <div class="price">₦${Number(service.price).toLocaleString()}</div>
        <p class="desc">${service.description || ""}</p>
      </div>
    </a>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadServices);
