// ============================================================
// Demor Hair Space — Public Reviews Display (homepage)
// ============================================================

function starsStr(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

async function loadReviews() {
  const summaryEl = document.getElementById("reviews-summary");
  const listEl = document.getElementById("reviews-list");

  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(9);

  if (error || !data || data.length === 0) {
    summaryEl.innerHTML = "";
    listEl.innerHTML = `<p class="muted">No reviews yet — be the first to leave one after your visit!</p>`;
    return;
  }

  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  const roundedAvg = Math.round(avg * 10) / 10;

  summaryEl.innerHTML = `
    <div class="big-rating">${roundedAvg}</div>
    <div>
      <div class="stars">${starsStr(Math.round(avg))}</div>
      <div class="count">Based on ${data.length} review${data.length > 1 ? "s" : ""}</div>
    </div>
  `;

  listEl.innerHTML = data.slice(0, 6).map(r => `
    <div class="review-card">
      <div class="stars">${starsStr(r.rating)}</div>
      ${r.comment ? `<p class="comment">"${r.comment}"</p>` : ""}
      <div class="author">— ${r.customer_name}</div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadReviews);
