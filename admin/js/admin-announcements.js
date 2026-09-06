// ============================================================
// Demor Hair Space — Admin: Announcements
// ============================================================

async function loadAnnouncements() {
  const list = document.getElementById("announcements-list");
  const { data, error } = await supabaseClient
    .from("announcements").select("*").order("created_at", { ascending: false });

  if (error || !data) { list.innerHTML = "Couldn't load announcements."; return; }
  if (data.length === 0) { list.innerHTML = `<p class="muted">No announcements yet.</p>`; return; }

  list.innerHTML = data.map(a => `
    <div class="admin-card" style="margin-bottom:12px; display:flex; align-items:center; gap:14px;" data-id="${a.id}">
      ${a.image_url ? `<img src="${a.image_url}" style="width:48px;height:48px;object-fit:cover;border-radius:50%;" />` : ""}
      <div style="flex:1;">
        <p style="margin:0;">${a.message}</p>
        <span class="status-pill ${a.is_active ? 'status-confirmed' : 'status-cancelled'}">${a.is_active ? "Active" : "Hidden"}</span>
      </div>
      <button class="btn-sm" data-action="toggle">${a.is_active ? "Hide" : "Show"}</button>
      <button class="btn-sm danger" data-action="delete">Delete</button>
    </div>
  `).join("");
}

document.getElementById("add-announcement-btn").addEventListener("click", async () => {
  const message = document.getElementById("new-message").value.trim();
  const fileInput = document.getElementById("new-image");
  const errorEl = document.getElementById("add-error");
  errorEl.style.display = "none";

  if (!message) {
    errorEl.textContent = "Please write a message.";
    errorEl.style.display = "block";
    return;
  }

  const btn = document.getElementById("add-announcement-btn");
  btn.disabled = true;
  btn.textContent = "Posting…";

  let imageUrl = null;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const filePath = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseClient.storage.from("service-photos").upload(filePath, file);
    if (!uploadError) {
      const { data: urlData } = supabaseClient.storage.from("service-photos").getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }
  }

  const { error } = await supabaseClient.from("announcements").insert({
    message, image_url: imageUrl, is_active: true,
  });

  btn.disabled = false;
  btn.textContent = "Post Announcement";

  if (error) {
    errorEl.textContent = "Couldn't post announcement. Please try again.";
    errorEl.style.display = "block";
    return;
  }

  document.getElementById("new-message").value = "";
  fileInput.value = "";
  loadAnnouncements();
});

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const id = e.target.closest("[data-id]").dataset.id;

  if (action === "toggle") {
    const card = e.target.closest("[data-id]");
    const isActiveNow = card.querySelector(".status-pill").textContent.trim() === "Active";
    await supabaseClient.from("announcements").update({ is_active: !isActiveNow }).eq("id", id);
  }
  if (action === "delete") {
    if (!confirm("Delete this announcement?")) return;
    await supabaseClient.from("announcements").delete().eq("id", id);
  }
  loadAnnouncements();
});

document.addEventListener("DOMContentLoaded", loadAnnouncements);
