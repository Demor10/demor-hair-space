// ============================================================
// Demor Hair Space — Admin: Services logic
// ============================================================

async function loadServices() {
  const tbody = document.getElementById("services-body");
  const { data, error } = await supabaseClient
    .from("services")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Couldn't load services.</td></tr>`;
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No services yet — add one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(s => `
    <tr data-id="${s.id}">
      <td>${s.image_url ? `<img src="${s.image_url}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;" />` : "—"}</td>
      <td>${s.name}<br><span style="color:var(--ink-600); font-size:0.8rem;">${s.description || ""}</span></td>
      <td>₦${Number(s.price).toLocaleString()}</td>
      <td>${s.is_active ? "Yes" : "No"}</td>
      <td>
        <button class="btn-sm" data-action="toggle">${s.is_active ? "Deactivate" : "Activate"}</button>
        <button class="btn-sm danger" data-action="delete">Delete</button>
      </td>
    </tr>
  `).join("");
}

document.getElementById("add-service-btn").addEventListener("click", async () => {
  const name = document.getElementById("new-name").value.trim();
  const price = document.getElementById("new-price").value;
  const desc = document.getElementById("new-desc").value.trim();
  const fileInput = document.getElementById("new-image");
  const errorEl = document.getElementById("add-error");
  errorEl.style.display = "none";

  if (!name || !price) {
    errorEl.textContent = "Name and price are required.";
    errorEl.style.display = "block";
    return;
  }

  let imageUrl = null;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const filePath = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseClient
      .storage.from("service-photos").upload(filePath, file);
    if (uploadError) {
      errorEl.textContent = "Couldn't upload photo. Check that the 'service-photos' storage bucket exists.";
      errorEl.style.display = "block";
      return;
    }
    const { data: urlData } = supabaseClient.storage.from("service-photos").getPublicUrl(filePath);
    imageUrl = urlData.publicUrl;
  }

  const { error } = await supabaseClient.from("services").insert({
    name, price: Number(price), description: desc, image_url: imageUrl, is_active: true,
  });

  if (error) {
    errorEl.textContent = "Couldn't add service. Please try again.";
    errorEl.style.display = "block";
    return;
  }

  document.getElementById("new-name").value = "";
  document.getElementById("new-price").value = "";
  document.getElementById("new-desc").value = "";
  fileInput.value = "";
  loadServices();
});

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const row = e.target.closest("tr");
  const id = row.dataset.id;

  if (action === "toggle") {
    const isActiveNow = row.children[3].textContent.trim() === "Yes";
    await supabaseClient.from("services").update({ is_active: !isActiveNow }).eq("id", id);
    loadServices();
  }
  if (action === "delete") {
    if (!confirm("Delete this service? This can't be undone.")) return;
    await supabaseClient.from("services").delete().eq("id", id);
    loadServices();
  }
});

document.addEventListener("DOMContentLoaded", loadServices);
