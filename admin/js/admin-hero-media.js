// ============================================================
// Demor Hair Space — Admin: Homepage Video Playlist
// ============================================================

async function loadVideoList() {
  const list = document.getElementById("video-list");
  const { data, error } = await supabaseClient
    .from("hero_videos").select("*").order("sort_order", { ascending: true });

  if (error || !data) { list.innerHTML = "Couldn't load videos."; return; }
  if (data.length === 0) { list.innerHTML = `<p class="muted">No videos yet — the homepage will show its normal background until you add one.</p>`; return; }

  list.innerHTML = data.map((v, index) => `
    <div class="admin-card" style="margin-bottom:12px; display:flex; align-items:center; gap:14px;" data-id="${v.id}" data-order="${v.sort_order}">
      <video src="${v.video_url}" style="width:110px; height:64px; object-fit:cover; border-radius:4px; background:#000;" muted></video>
      <div style="flex:1;">
        <span class="status-pill ${v.is_active ? 'status-confirmed' : 'status-cancelled'}">${v.is_active ? "Active" : "Hidden"}</span>
      </div>
      <button class="btn-sm" data-action="move-up" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="btn-sm" data-action="move-down" ${index === data.length - 1 ? "disabled" : ""}>↓</button>
      <button class="btn-sm" data-action="toggle">${v.is_active ? "Hide" : "Show"}</button>
      <button class="btn-sm danger" data-action="delete">Delete</button>
    </div>
  `).join("");
}

document.getElementById("new-video").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  const statusEl = document.getElementById("upload-status");
  if (files.length === 0) return;

  statusEl.textContent = `Uploading ${files.length} video${files.length > 1 ? "s" : ""}… this may take a moment.`;

  const { data: existing } = await supabaseClient
    .from("hero_videos").select("sort_order")
    .order("sort_order", { ascending: false }).limit(1);
  let nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  let successCount = 0, failCount = 0;

  for (const file of files) {
    try {
      const filePath = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabaseClient.storage.from("hero-videos").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseClient.storage.from("hero-videos").getPublicUrl(filePath);
      const { error: insertError } = await supabaseClient.from("hero_videos").insert({
        video_url: urlData.publicUrl, sort_order: nextOrder++, is_active: true,
      });
      if (insertError) throw insertError;
      successCount++;
    } catch (err) {
      console.error(err);
      failCount++;
    }
  }

  statusEl.textContent = failCount === 0
    ? `Uploaded ${successCount} video${successCount > 1 ? "s" : ""} successfully.`
    : `Uploaded ${successCount}, ${failCount} failed. Check the 'hero-videos' storage bucket exists with upload permissions.`;

  e.target.value = "";
  loadVideoList();
});

async function swapOrder(elA, elB) {
  const idA = elA.dataset.id, idB = elB.dataset.id;
  const orderA = Number(elA.dataset.order), orderB = Number(elB.dataset.order);
  await supabaseClient.from("hero_videos").update({ sort_order: orderB }).eq("id", idA);
  await supabaseClient.from("hero_videos").update({ sort_order: orderA }).eq("id", idB);
  loadVideoList();
}

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const card = e.target.closest("[data-id]");
  const id = card.dataset.id;

  if (action === "move-up" || action === "move-down") {
    const target = action === "move-up" ? card.previousElementSibling : card.nextElementSibling;
    if (target) swapOrder(card, target);
    return;
  }
  if (action === "toggle") {
    const isActiveNow = card.querySelector(".status-pill").textContent.trim() === "Active";
    await supabaseClient.from("hero_videos").update({ is_active: !isActiveNow }).eq("id", id);
    loadVideoList();
  }
  if (action === "delete") {
    if (!confirm("Delete this video?")) return;
    await supabaseClient.from("hero_videos").delete().eq("id", id);
    loadVideoList();
  }
});

document.addEventListener("DOMContentLoaded", loadVideoList);
