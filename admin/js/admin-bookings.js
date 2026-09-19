// ============================================================
// Demor Hair Space — Admin: Bookings logic
// ============================================================

let cancelTargetId = null;

function formatDisplayTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

async function loadBookings() {
  const tbody = document.getElementById("bookings-body");
  const filterDate = document.getElementById("filter-date").value;

  let query = supabaseClient
    .from("bookings")
    .select("*, services(name)")
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filterDate) query = query.eq("appointment_date", filterDate);

  const { data, error } = await query;

  if (error) {
    tbody.innerHTML = `<tr><td colspan="8">Couldn't load bookings.</td></tr>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No bookings found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(b => `
    <tr data-id="${b.id}">
      <td>${b.appointment_date}</td>
      <td>${formatDisplayTime(b.start_time)}${b.is_extended_hours ? " (ext.)" : ""}<br>
        <span class="status-pill ${b.location_type === 'home' ? 'status-pending_payment' : 'status-completed'}">${b.location_type === 'home' ? 'Home Service' : 'Store'}</span>
      </td>
      <td>${b.customer_name}<br><span style="color:var(--ink-600); font-size:0.8rem;">${b.customer_phone}</span></td>
      <td>${b.services?.name || "—"}${b.selected_image_url ? `<br><img src="${b.selected_image_url}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;margin-top:4px;" />` : ""}</td>
      <td>₦${Number(b.price_charged).toLocaleString()}</td>
      <td>
        ${b.payment_method === "online_transfer" ? "Online transfer" : "In person"}
        ${b.payment_proof_url ? `<br><a href="${b.payment_proof_url}" target="_blank" style="font-size:0.8rem;">View proof</a>` : ""}
      </td>
      <td>
        <span class="status-pill status-${b.status}">${b.status.replace("_", " ")}</span>
        ${b.status === "cancelled" && b.cancellation_reason ? `<div class="muted" style="max-width:160px; margin-top:4px;">"${b.cancellation_reason}"</div>` : ""}
      </td>
      <td>
        ${b.status === "pending_payment" ? `<button class="btn-sm" data-action="confirm">Confirm</button>` : ""}
        ${b.status === "confirmed" ? `<button class="btn-sm" data-action="complete">Mark Done</button>` : ""}
        ${b.status !== "cancelled" ? `<button class="btn-sm danger" data-action="cancel">Cancel</button>` : ""}
      </td>
    </tr>
  `).join("");
}

document.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const row = e.target.closest("tr");
  const id = row.dataset.id;

  if (action === "cancel") {
    cancelTargetId = id;
    document.getElementById("cancel-reason-input").value = "";
    document.getElementById("cancel-modal-overlay").classList.add("open");
    return;
  }

  const statusMap = { confirm: "confirmed", complete: "completed" };
  const newStatus = statusMap[action];
  if (!newStatus) return;

  const { error } = await supabaseClient.from("bookings").update({ status: newStatus }).eq("id", id);
  if (error) {
    alert("Couldn't update booking. Please try again.");
    console.error(error);
    return;
  }
  loadBookings();
});

document.getElementById("cancel-dismiss-btn").addEventListener("click", () => {
  document.getElementById("cancel-modal-overlay").classList.remove("open");
  cancelTargetId = null;
});
document.getElementById("cancel-modal-close").addEventListener("click", () => {
  document.getElementById("cancel-modal-overlay").classList.remove("open");
  cancelTargetId = null;
});
document.getElementById("cancel-modal-overlay").addEventListener("click", (e) => {
  if (e.target.id === "cancel-modal-overlay") {
    e.target.classList.remove("open");
    cancelTargetId = null;
  }
});

document.getElementById("cancel-confirm-btn").addEventListener("click", async () => {
  if (!cancelTargetId) return;
  const reason = document.getElementById("cancel-reason-input").value.trim();

  const btn = document.getElementById("cancel-confirm-btn");
  btn.disabled = true;
  btn.textContent = "Cancelling…";

  const { error } = await supabaseClient.from("bookings").update({
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason || null,
  }).eq("id", cancelTargetId);

  btn.disabled = false;
  btn.textContent = "Confirm Cancellation";

  if (error) {
    alert("Couldn't cancel this booking. Please try again.");
    console.error(error);
    return;
  }

  document.getElementById("cancel-modal-overlay").classList.remove("open");
  cancelTargetId = null;
  loadBookings();
});

document.getElementById("filter-date").addEventListener("change", loadBookings);
document.addEventListener("DOMContentLoaded", loadBookings);
