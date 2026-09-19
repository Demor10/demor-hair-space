// ============================================================
// Demor Hair Space — Blog & Tips feed
// ============================================================

async function loadBlogFeed() {
  const feed = document.getElementById("blog-feed");

  const { data, error } = await supabaseClient
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    feed.innerHTML = `<p style="color:#900;">Couldn't load posts right now.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    feed.innerHTML = `<p style="color:var(--ink-600);">No posts yet — check back soon for product reviews and haircut tips.</p>`;
    return;
  }

  feed.innerHTML = data.map(p => `
    <article class="blog-post">
      <h3>${p.title}</h3>
      <div class="post-date">${new Date(p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div>
      ${p.image_url ? `<img src="${p.image_url}" alt="${p.title}" />` : ""}
      ${p.video_url ? `<video src="${p.video_url}" controls></video>` : ""}
      <div class="post-body">${p.body}</div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadBlogFeed);
