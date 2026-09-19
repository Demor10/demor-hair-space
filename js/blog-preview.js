// ============================================================
// Demor Hair Space — Homepage: Blog & Tips preview
// ============================================================

async function loadBlogPreview() {
  const grid = document.getElementById("blog-preview-grid");

  const { data, error } = await supabaseClient
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    grid.innerHTML = `<p class="muted">Couldn't load posts right now.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = `<p class="muted">No posts yet — check back soon.</p>`;
    return;
  }

  grid.innerHTML = data.map(p => `
    <a class="service-card" href="blog.html">
      <div class="thumb">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;" />`
          : p.video_url ? `🎬 Video Post` : `Blog Post`}
      </div>
      <div class="body">
        <h3>${p.title}</h3>
        <p class="desc">${p.body.slice(0, 90)}${p.body.length > 90 ? "…" : ""}</p>
      </div>
    </a>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadBlogPreview);
