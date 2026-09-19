// ============================================================
// Demor Hair Space — Admin: Blog & Tips
// ============================================================

let editingPostId = null;

async function uploadToBucket(file, bucket) {
  const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(filePath, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

function postCard(p) {
  const date = new Date(p.created_at).toLocaleDateString();
  return `
    <div class="admin-card" style="margin-bottom:12px;" data-id="${p.id}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div>
          <h4 style="margin:0 0 4px; font-family:var(--font-display); color:var(--navy-900);">${p.title}</h4>
          <p class="muted" style="margin:0 0 8px;">${date} · <span class="status-pill ${p.is_published ? 'status-confirmed' : 'status-cancelled'}">${p.is_published ? "Published" : "Hidden"}</span></p>
        </div>
        ${p.image_url ? `<img src="${p.image_url}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;" />` : ""}
      </div>
      <p style="font-size:0.9rem; color:var(--ink-600); margin:8px 0;">${p.body.slice(0, 140)}${p.body.length > 140 ? "…" : ""}</p>
      ${p.video_url ? `<p class="muted">🎬 Includes video</p>` : ""}
      <button class="btn-sm" data-action="edit-post">Edit</button>
      <button class="btn-sm" data-action="toggle-post">${p.is_published ? "Hide" : "Publish"}</button>
      <button class="btn-sm danger" data-action="delete-post">Delete</button>
    </div>
  `;
}

async function loadPosts() {
  const list = document.getElementById("posts-list");
  const { data, error } = await supabaseClient
    .from("blog_posts").select("*").order("created_at", { ascending: false });

  if (error || !data) { list.innerHTML = "Couldn't load posts."; return; }
  if (data.length === 0) { list.innerHTML = `<p class="muted">No posts yet — write your first one above.</p>`; return; }

  list.innerHTML = data.map(postCard).join("");
  window._blogPostsCache = data;
}

document.getElementById("save-post-btn").addEventListener("click", async () => {
  const title = document.getElementById("post-title").value.trim();
  const body = document.getElementById("post-body").value.trim();
  const imageFile = document.getElementById("post-image").files[0];
  const videoFile = document.getElementById("post-video").files[0];
  const statusEl = document.getElementById("post-status");
  statusEl.style.display = "block";
  statusEl.style.color = "";

  if (!title || !body) {
    statusEl.style.color = "#b00020";
    statusEl.textContent = "Please add a title and some content.";
    return;
  }

  const btn = document.getElementById("save-post-btn");
  btn.disabled = true;
  btn.textContent = editingPostId ? "Saving…" : "Publishing…";

  try {
    let imageUrl = null, videoUrl = null;
    if (imageFile) {
      statusEl.textContent = "Uploading image…";
      imageUrl = await uploadToBucket(imageFile, "service-photos");
    }
    if (videoFile) {
      statusEl.textContent = "Uploading video… this may take a moment.";
      videoUrl = await uploadToBucket(videoFile, "hero-videos");
    }

    if (editingPostId) {
      const updates = { title, body };
      if (imageUrl) updates.image_url = imageUrl;
      if (videoUrl) updates.video_url = videoUrl;
      const { error } = await supabaseClient.from("blog_posts").update(updates).eq("id", editingPostId);
      if (error) throw error;
      statusEl.style.color = "#1e7a43";
      statusEl.textContent = "Post updated.";
    } else {
      const { error } = await supabaseClient.from("blog_posts").insert({
        title, body, image_url: imageUrl, video_url: videoUrl, is_published: true,
      });
      if (error) throw error;
      statusEl.style.color = "#1e7a43";
      statusEl.textContent = "Post published!";
    }

    exitEditMode();
    loadPosts();
  } catch (err) {
    statusEl.style.color = "#b00020";
    statusEl.textContent = "Something went wrong. Please try again.";
    console.error(err);
  }

  btn.disabled = false;
  btn.textContent = editingPostId ? "Save Changes" : "Publish Post";
});

function exitEditMode() {
  editingPostId = null;
  document.getElementById("post-title").value = "";
  document.getElementById("post-body").value = "";
  document.getElementById("post-image").value = "";
  document.getElementById("post-video").value = "";
  document.getElementById("form-heading").textContent = "New post";
  document.getElementById("save-post-btn").textContent = "Publish Post";
  document.getElementById("cancel-post-edit-btn").style.display = "none";
}

document.getElementById("cancel-post-edit-btn").addEventListener("click", exitEditMode);

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const card = e.target.closest("[data-id]");
  const id = card.dataset.id;

  if (action === "edit-post") {
    const post = (window._blogPostsCache || []).find(p => p.id === id);
    if (!post) return;
    editingPostId = id;
    document.getElementById("post-title").value = post.title;
    document.getElementById("post-body").value = post.body;
    document.getElementById("form-heading").textContent = "Edit post";
    document.getElementById("save-post-btn").textContent = "Save Changes";
    document.getElementById("cancel-post-edit-btn").style.display = "inline-flex";
    document.getElementById("form-heading").scrollIntoView({ behavior: "smooth" });
  }

  if (action === "toggle-post") {
    const post = (window._blogPostsCache || []).find(p => p.id === id);
    await supabaseClient.from("blog_posts").update({ is_published: !post.is_published }).eq("id", id);
    loadPosts();
  }

  if (action === "delete-post") {
    if (!confirm("Delete this post permanently?")) return;
    await supabaseClient.from("blog_posts").delete().eq("id", id);
    loadPosts();
  }
});

document.addEventListener("DOMContentLoaded", loadPosts);
