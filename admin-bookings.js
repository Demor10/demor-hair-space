// ============================================================
// Demor Hair Space — Admin: Bookings logic
// ============================================================

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
      <td>${formatDisplayTime(b.start_time)}${b.is_extended_hours ? " (ext.)" : ""}</td>
      <td>${b.customer_name}<br><span style="color:var(--ink-600); font-size:0.8rem;">${b.customer_phone}</span></td>
      <td>${b.services?.name || "—"}${b.selected_image_url ? `<br><img src="${b.selected_image_url}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;margin-top:4px;" />` : ""}</td>
      <td>₦${Number(b.price_charged).toLocaleString()}</td>
      <td>
        ${b.payment_method === "online_transfer" ? "Online transfer" : "In person"}
        ${b.payment_proof_url ? `<br><a href="${b.payment_proof_url}" target="_blank" style="font-size:0.8rem;">View proof</a>` : ""}
      </td>
      <td><span class="status-pill status-${b.status}">${b.status.replace("_", " ")}</span></td>
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

  const statusMap = { confirm: "confirmed", complete: "completed", cancel: "cancelled" };
  const newStatus = statusMap[action];

  const updates = { status: newStatus };
  if (newStatus === "cancelled") updates.cancelled_at = new Date().toISOString();

  const { error } = await supabaseClient.from("bookings").update(updates).eq("id", id);
  if (error) {
    alert("Couldn't update booking. Please try again.");
    console.error(error);
    return;
  }
  loadBookings();
});

document.getElementById("filter-date").addEventListener("change", loadBookings);
document.addEventListener("DOMContentLoaded", loadBookings);
