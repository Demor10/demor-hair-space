// ============================================================
// Demor Hair Space — Admin: Customer Stories moderation
// ============================================================

function storyCard(s, isPending) {
  const date = new Date(s.created_at).toLocaleDateString();
  return `
    <div class="admin-card" style="margin-bottom:12px;" data-id="${s.id}">
      <p style="font-style:italic; margin:0 0 8px;">"${s.story_text}"</p>
      <p class="muted" style="margin:0 0 12px;">— ${s.customer_name} · ${date}</p>
      ${isPending
        ? `<button class="btn-sm" data-action="approve">Approve</button><button class="btn-sm danger" data-action="reject">Reject</button>`
        : `<button class="btn-sm danger" data-action="unpublish">Remove from homepage</button>`}
    </div>
  `;
}

async function loadStories() {
  const pendingEl = document.getElementById("pending-list");
  const approvedEl = document.getElementById("approved-list");

  const { data: pending } = await supabaseClient
    .from("customer_stories").select("*")
    .eq("is_approved", false).order("created_at", { ascending: false });

  const { data: approved } = await supabaseClient
    .from("customer_stories").select("*")
    .eq("is_approved", true).order("created_at", { ascending: false });

  pendingEl.innerHTML = (pending && pending.length > 0)
    ? pending.map(s => storyCard(s, true)).join("")
    : `<p class="muted">No stories waiting for review.</p>`;

  approvedEl.innerHTML = (approved && approved.length > 0)
    ? approved.map(s => storyCard(s, false)).join("")
    : `<p class="muted">No approved stories yet.</p>`;
}

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const id = e.target.closest("[data-id]").dataset.id;

  if (action === "approve") {
    await supabaseClient.from("customer_stories").update({ is_approved: true }).eq("id", id);
  }
  if (action === "reject" || action === "unpublish") {
    if (!confirm("Delete this story permanently?")) return;
    await supabaseClient.from("customer_stories").delete().eq("id", id);
  }
  loadStories();
});

document.addEventListener("DOMContentLoaded", loadStories);
