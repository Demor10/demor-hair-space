// ============================================================
// Demor Hair Space — Admin: Reviews moderation
// ============================================================

function starsDisplay(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function reviewCard(r, isPending) {
  const date = new Date(r.created_at).toLocaleDateString();
  return `
    <div class="admin-card" style="margin-bottom:12px;" data-id="${r.id}">
      <p style="color:var(--gold-700); margin:0 0 6px; font-size:1.1rem;">${starsDisplay(r.rating)}</p>
      ${r.comment ? `<p style="font-style:italic; margin:0 0 8px;">"${r.comment}"</p>` : `<p class="muted" style="margin:0 0 8px;">No written comment.</p>`}
      <p class="muted" style="margin:0 0 12px;">— ${r.customer_name} · ${date}</p>
      ${isPending
        ? `<button class="btn-sm" data-action="approve">Approve</button><button class="btn-sm danger" data-action="reject">Reject</button>`
        : `<button class="btn-sm danger" data-action="unpublish">Remove from site</button>`}
    </div>
  `;
}

async function loadReviews() {
  const pendingEl = document.getElementById("pending-list");
  const approvedEl = document.getElementById("approved-list");

  const { data: pending } = await supabaseClient
    .from("reviews").select("*")
    .eq("is_approved", false).order("created_at", { ascending: false });

  const { data: approved } = await supabaseClient
    .from("reviews").select("*")
    .eq("is_approved", true).order("created_at", { ascending: false });

  pendingEl.innerHTML = (pending && pending.length > 0)
    ? pending.map(r => reviewCard(r, true)).join("")
    : `<p class="muted">No reviews waiting for approval.</p>`;

  approvedEl.innerHTML = (approved && approved.length > 0)
    ? approved.map(r => reviewCard(r, false)).join("")
    : `<p class="muted">No approved reviews yet.</p>`;
}

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const id = e.target.closest("[data-id]").dataset.id;

  if (action === "approve") {
    await supabaseClient.from("reviews").update({ is_approved: true }).eq("id", id);
  }
  if (action === "reject" || action === "unpublish") {
    if (!confirm("Delete this review permanently?")) return;
    await supabaseClient.from("reviews").delete().eq("id", id);
  }
  loadReviews();
});

document.addEventListener("DOMContentLoaded", loadReviews);
