// ============================================================
// Demor Hair Space — Admin: Services logic (with photo albums)
// ============================================================

let activeAlbumServiceId = null;
let editingServiceId = null;

async function uploadImageFile(file) {
  const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
  const { error } = await supabaseClient.storage.from("service-photos").upload(filePath, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from("service-photos").getPublicUrl(filePath);
  return data.publicUrl;
}

async function loadServices() {
  const tbody = document.getElementById("services-body");
  const { data, error } = await supabaseClient
    .from("services")
    .select("*, service_images(id, image_url, sort_order)")
    .order("display_order", { ascending: true, nullsFirst: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6">Couldn't load services.</td></tr>`;
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No services yet — add one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((s, index) => {
    const images = (s.service_images || []).sort((a, b) => a.sort_order - b.sort_order);
    const cover = images[0]?.image_url;
    const isTop3 = index < 3;
    return `
    <tr data-id="${s.id}" data-order="${s.display_order ?? index}" data-price="${s.price}" data-desc="${(s.description || "").replace(/"/g, '&quot;')}">
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn-sm" data-action="move-up" ${index === 0 ? "disabled" : ""} title="Move up">↑</button>
          <button class="btn-sm" data-action="move-down" ${index === data.length - 1 ? "disabled" : ""} title="Move down">↓</button>
          ${isTop3 ? `<span class="status-pill status-confirmed" title="Shown on homepage">Homepage</span>` : ""}
        </div>
      </td>
      <td>${cover ? `<img src="${cover}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;" />` : "—"}</td>
      <td>${s.name}<br><span style="color:var(--ink-600); font-size:0.8rem;">${s.description || ""}</span></td>
      <td>₦${Number(s.price).toLocaleString()}</td>
      <td>${s.is_active ? "Yes" : "No"}</td>
      <td>
        <button class="btn-sm" data-action="album" data-name="${s.name}">Photos (${images.length})</button>
        <button class="btn-sm" data-action="edit">Edit</button>
        <button class="btn-sm" data-action="toggle">${s.is_active ? "Deactivate" : "Activate"}</button>
        <button class="btn-sm danger" data-action="delete">Delete</button>
      </td>
    </tr>
  `;
  }).join("");
}

async function swapDisplayOrder(rowA, rowB) {
  const idA = rowA.dataset.id, idB = rowB.dataset.id;
  const orderA = Number(rowA.dataset.order), orderB = Number(rowB.dataset.order);
  await supabaseClient.from("services").update({ display_order: orderB }).eq("id", idA);
  await supabaseClient.from("services").update({ display_order: orderA }).eq("id", idB);
  loadServices();
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

  const addBtn = document.getElementById("add-service-btn");

  // ---------- EDIT MODE: update existing service, nothing is deleted ----------
  if (editingServiceId) {
    addBtn.disabled = true;
    addBtn.textContent = "Saving…";

    const { error } = await supabaseClient
      .from("services")
      .update({ name, price: Number(price), description: desc })
      .eq("id", editingServiceId);

    addBtn.disabled = false;
    addBtn.textContent = "Add Service";

    if (error) {
      errorEl.textContent = "Couldn't save changes. Please try again.";
      errorEl.style.display = "block";
      return;
    }

    exitEditMode();
    loadServices();
    return;
  }

  // ---------- ADD MODE: create a new service ----------
  addBtn.disabled = true;
  addBtn.textContent = "Adding…";

  const { data: maxOrderData } = await supabaseClient
    .from("services").select("display_order")
    .order("display_order", { ascending: false }).limit(1);
  const nextDisplayOrder = (maxOrderData && maxOrderData[0]?.display_order != null)
    ? maxOrderData[0].display_order + 1 : 0;

  const { data: newService, error } = await supabaseClient
    .from("services")
    .insert({ name, price: Number(price), description: desc, is_active: true, display_order: nextDisplayOrder })
    .select().single();

  if (error) {
    errorEl.textContent = "Couldn't add service. Please try again.";
    errorEl.style.display = "block";
    addBtn.disabled = false;
    addBtn.textContent = "Add Service";
    return;
  }

  const files = Array.from(fileInput.files || []);
  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadImageFile(files[i]);
      await supabaseClient.from("service_images").insert({
        service_id: newService.id, image_url: url, sort_order: i,
      });
    } catch (uploadErr) {
      console.error("Photo upload failed:", uploadErr);
    }
  }

  addBtn.disabled = false;
  addBtn.textContent = "Add Service";
  document.getElementById("new-name").value = "";
  document.getElementById("new-price").value = "";
  document.getElementById("new-desc").value = "";
  fileInput.value = "";
  loadServices();
});

function enterEditMode(row) {
  editingServiceId = row.dataset.id;
  document.getElementById("new-name").value = row.querySelector("td:nth-child(3)").childNodes[0].textContent.trim();
  document.getElementById("new-price").value = row.dataset.price;
  document.getElementById("new-desc").value = row.dataset.desc;
  document.getElementById("form-heading").textContent = "Edit style";
  document.getElementById("add-service-btn").textContent = "Save Changes";
  document.getElementById("cancel-edit-btn").style.display = "inline-flex";
  document.getElementById("form-heading").scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitEditMode() {
  editingServiceId = null;
  document.getElementById("new-name").value = "";
  document.getElementById("new-price").value = "";
  document.getElementById("new-desc").value = "";
  document.getElementById("new-image").value = "";
  document.getElementById("form-heading").textContent = "Add a new style";
  document.getElementById("add-service-btn").textContent = "Add Service";
  document.getElementById("cancel-edit-btn").style.display = "none";
}

document.getElementById("cancel-edit-btn").addEventListener("click", exitEditMode);

async function openAlbum(serviceId, serviceName) {
  activeAlbumServiceId = serviceId;
  document.getElementById("album-panel").style.display = "block";
  document.getElementById("album-title").textContent = `Photos — ${serviceName}`;
  await renderAlbumGrid();
  document.getElementById("album-panel").scrollIntoView({ behavior: "smooth" });
}

async function renderAlbumGrid() {
  const grid = document.getElementById("album-grid");
  grid.innerHTML = "Loading…";
  const { data, error } = await supabaseClient
    .from("service_images")
    .select("*")
    .eq("service_id", activeAlbumServiceId)
    .order("sort_order", { ascending: true });

  if (error || !data) { grid.innerHTML = "Couldn't load photos."; return; }
  if (data.length === 0) { grid.innerHTML = "<p class='muted'>No photos yet.</p>"; return; }

  grid.innerHTML = data.map((img, index) => `
    <div style="position:relative;" data-img-id="${img.id}" data-sort="${img.sort_order}">
      <img src="${img.image_url}" style="width:100px;height:100px;object-fit:cover;border-radius:4px; ${index === 0 ? 'outline:3px solid var(--gold-500);' : ''}" />
      ${index === 0 ? `<span style="position:absolute; bottom:2px; left:2px; background:var(--gold-500); color:var(--navy-950); font-size:0.65rem; padding:1px 6px; border-radius:3px; font-weight:600;">Cover</span>` : ""}
      <button data-action="delete-image" style="position:absolute; top:-8px; right:-8px; background:#a32323; color:#fff; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer; font-size:0.75rem;">✕</button>
      <div style="display:flex; justify-content:center; gap:4px; margin-top:4px;">
        <button class="btn-sm" data-action="photo-move-left" ${index === 0 ? "disabled" : ""} style="padding:2px 8px; font-size:0.7rem;">←</button>
        <button class="btn-sm" data-action="photo-move-right" ${index === data.length - 1 ? "disabled" : ""} style="padding:2px 8px; font-size:0.7rem;">→</button>
      </div>
    </div>
  `).join("");
}

async function swapPhotoOrder(elA, elB) {
  const idA = elA.dataset.imgId, idB = elB.dataset.imgId;
  const orderA = Number(elA.dataset.sort), orderB = Number(elB.dataset.sort);
  await supabaseClient.from("service_images").update({ sort_order: orderB }).eq("id", idA);
  await supabaseClient.from("service_images").update({ sort_order: orderA }).eq("id", idB);
  renderAlbumGrid();
  loadServices();
}

document.getElementById("album-add-input").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  const statusEl = document.getElementById("album-status");
  if (files.length === 0) return;

  statusEl.textContent = `Uploading ${files.length} photo${files.length > 1 ? "s" : ""}…`;

  const { data: existing } = await supabaseClient
    .from("service_images").select("sort_order")
    .eq("service_id", activeAlbumServiceId)
    .order("sort_order", { ascending: false }).limit(1);
  let nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    try {
      const url = await uploadImageFile(file);
      const { error: insertError } = await supabaseClient.from("service_images").insert({
        service_id: activeAlbumServiceId, image_url: url, sort_order: nextOrder++,
      });
      if (insertError) throw insertError;
      successCount++;
    } catch (err) {
      console.error("Photo upload failed:", err);
      failCount++;
    }
  }

  statusEl.textContent = failCount === 0
    ? `Uploaded ${successCount} photo${successCount > 1 ? "s" : ""} successfully.`
    : `Uploaded ${successCount}, but ${failCount} failed. Check your internet connection and try again, or check the browser console for details.`;

  e.target.value = "";
  renderAlbumGrid();
  loadServices();
});

document.getElementById("album-close-btn").addEventListener("click", () => {
  document.getElementById("album-panel").style.display = "none";
  activeAlbumServiceId = null;
});

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  if (action === "move-up" || action === "move-down") {
    const row = e.target.closest("tr");
    const targetRow = action === "move-up" ? row.previousElementSibling : row.nextElementSibling;
    if (targetRow) swapDisplayOrder(row, targetRow);
    return;
  }

  if (action === "edit") {
    const row = e.target.closest("tr");
    enterEditMode(row);
    return;
  }

  if (action === "album") {
    const row = e.target.closest("tr");
    openAlbum(row.dataset.id, e.target.dataset.name);
    return;
  }

  if (action === "photo-move-left" || action === "photo-move-right") {
    const el = e.target.closest("[data-img-id]");
    const target = action === "photo-move-left" ? el.previousElementSibling : el.nextElementSibling;
    if (target) swapPhotoOrder(el, target);
    return;
  }

  if (action === "delete-image") {
    const wrapper = e.target.closest("[data-img-id]");
    const imgId = wrapper.dataset.imgId;
    await supabaseClient.from("service_images").delete().eq("id", imgId);
    renderAlbumGrid();
    loadServices();
    return;
  }

  const row = e.target.closest("tr");
  if (!row || !row.dataset.id) return;
  const id = row.dataset.id;

  if (action === "toggle") {
    const isActiveNow = row.children[3].textContent.trim() === "Yes";
    await supabaseClient.from("services").update({ is_active: !isActiveNow }).eq("id", id);
    loadServices();
  }
  if (action === "delete") {
    if (!confirm("Delete this service and all its photos? This can't be undone.")) return;
    await supabaseClient.from("services").delete().eq("id", id);
    loadServices();
  }
});

document.addEventListener("DOMContentLoaded", loadServices);
