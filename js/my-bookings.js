// ============================================================
// Demor Hair Space — My Bookings (customer self-service)
// ============================================================

const SLOT_MINUTES = 45;
let lookupEmail = null;
let lookupPhone = null;
let activeRescheduleBooking = null;
let reschedSelectedSlot = null;

// ---------- Helpers (shared logic with book.js) ----------
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}
function formatDisplayTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}
function minutesUntil(dateStr, timeStr) {
  const appt = new Date(`${dateStr}T${timeStr}`);
  return (appt - new Date()) / 60000;
}

// ---------- Lookup ----------
document.getElementById("lookup-btn").addEventListener("click", async () => {
  const email = document.getElementById("lookup-email").value.trim();
  const phone = document.getElementById("lookup-phone").value.trim();
  const errorEl = document.getElementById("lookup-error");
  errorEl.style.display = "none";

  if (!email || !phone) {
    errorEl.textContent = "Please enter both your email and phone number.";
    errorEl.style.display = "block";
    return;
  }

  lookupEmail = email;
  lookupPhone = phone;

  const { data, error } = await supabaseClient.rpc("find_my_bookings", {
    p_email: email, p_phone: phone,
  });

  if (error) {
    errorEl.textContent = "Something went wrong looking up your bookings. Please try again.";
    errorEl.style.display = "block";
    console.error(error);
    return;
  }

  renderResults(data || []);
});

function renderResults(bookings) {
  const container = document.getElementById("results-container");
  if (bookings.length === 0) {
    container.innerHTML = `<div class="booking-step"><p class="muted">No bookings found for that email and phone number.</p></div>`;
    return;
  }

  container.innerHTML = bookings.map(b => {
    const mins = minutesUntil(b.appointment_date, b.start_time);
    const canManage = mins >= 30 && b.status !== "cancelled" && b.status !== "completed";
    return `
      <div class="booking-step" data-id="${b.id}">
        <div style="display:flex; gap:16px; align-items:flex-start;">
          ${b.selected_image_url ? `<img src="${b.selected_image_url}" style="width:90px;height:90px;object-fit:cover;border-radius:6px;flex-shrink:0;" />` : ""}
          <div>
            <h3 style="margin-top:0;">${formatDisplayTime(b.start_time)} — ${b.appointment_date}</h3>
            <p class="muted">
              ₦${Number(b.price_charged).toLocaleString()} ·
              <span class="status-pill status-${b.status}">${b.status.replace("_"," ")}</span>
            </p>
          </div>
        </div>
        ${canManage ? `
          <button class="btn-sm" data-action="reschedule">Reschedule</button>
          <button class="btn-sm danger" data-action="cancel">Cancel Booking</button>
        ` : b.status === "cancelled" || b.status === "completed" ? "" : `
          <p class="muted" style="color:#b00020;">Less than 30 minutes to your appointment — please call or WhatsApp us directly for changes.</p>
        `}
      </div>
    `;
  }).join("");
}

// ---------- Cancel ----------
document.addEventListener("click", async (e) => {
  if (e.target.dataset.action === "cancel") {
    if (!confirm("Cancel this booking? This can't be undone.")) return;
    const id = e.target.closest("[data-id]").dataset.id;
    const { error } = await supabaseClient.rpc("cancel_my_booking", {
      p_booking_id: id, p_email: lookupEmail, p_phone: lookupPhone,
    });
    if (error) {
      alert(error.message || "Couldn't cancel this booking.");
      return;
    }
    document.getElementById("lookup-btn").click();
  }

  if (e.target.dataset.action === "reschedule") {
    activeRescheduleBooking = e.target.closest("[data-id]").dataset.id;
    reschedSelectedSlot = null;
    document.getElementById("reschedule-panel").style.display = "block";
    document.getElementById("reschedule-panel").scrollIntoView({ behavior: "smooth" });
  }
});

// ---------- Reschedule: date/slot picking (mirrors book.js logic) ----------
async function getHoursForDate(dateStr) {
  const { data: override } = await supabaseClient
    .from("date_overrides").select("*").eq("date", dateStr).maybeSingle();

  if (override) {
    if (!override.is_open) return null;
    return {
      open: override.open_time || "07:00:00",
      normalClose: override.normal_close_time || "18:00:00",
      extendedClose: override.close_extended_time || "22:00:00",
    };
  }

  const dow = new Date(dateStr + "T00:00:00").getDay();
  const { data: weekly } = await supabaseClient
    .from("weekly_hours").select("*").eq("day_of_week", dow).maybeSingle();

  if (!weekly || !weekly.is_open) return null;
  return { open: weekly.open_time, normalClose: weekly.normal_close_time, extendedClose: weekly.close_extended_time };
}

function generateSlots(hours) {
  const slots = [];
  const openMin = timeToMinutes(hours.open);
  const normalCloseMin = timeToMinutes(hours.normalClose);
  const extendedCloseMin = timeToMinutes(hours.extendedClose);
  let t = openMin;
  while (t + SLOT_MINUTES <= extendedCloseMin) {
    slots.push({ start: minutesToTime(t), end: minutesToTime(t + SLOT_MINUTES), isExtended: t >= normalCloseMin });
    t += SLOT_MINUTES;
  }
  return slots;
}

async function renderReschedSlots(dateStr) {
  const container = document.getElementById("resched-slots-container");
  const msg = document.getElementById("resched-slots-msg");
  container.innerHTML = "";
  msg.textContent = "Loading available times…";

  const hours = await getHoursForDate(dateStr);
  if (!hours) { msg.textContent = "Closed on this date. Please pick another day."; return; }

  const allSlots = generateSlots(hours);
  const { data: taken } = await supabaseClient
    .from("public_booked_slots").select("start_time").eq("appointment_date", dateStr);
  const takenTimes = new Set((taken || []).map(t => t.start_time));

  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  msg.textContent = "";
  container.innerHTML = allSlots.map(slot => {
    const disabled = takenTimes.has(slot.start) || (isToday && timeToMinutes(slot.start) <= nowMinutes);
    return `
      <button type="button" class="slot-btn ${slot.isExtended ? "extended" : ""}"
        data-start="${slot.start}" data-end="${slot.end}" data-extended="${slot.isExtended}"
        ${disabled ? "disabled" : ""}>${formatDisplayTime(slot.start)}</button>
    `;
  }).join("");

  if (allSlots.length === 0) msg.textContent = "No slots available on this date.";
}

document.getElementById("resched-date-input").min = new Date().toISOString().slice(0, 10);
document.getElementById("resched-date-input").addEventListener("change", (e) => {
  reschedSelectedSlot = null;
  document.getElementById("resched-confirm-btn").style.display = "none";
  renderReschedSlots(e.target.value);
});

document.addEventListener("click", (e) => {
  if (e.target.matches("#resched-slots-container .slot-btn") && !e.target.disabled) {
    document.querySelectorAll("#resched-slots-container .slot-btn").forEach(b => b.classList.remove("selected"));
    e.target.classList.add("selected");
    reschedSelectedSlot = {
      start: e.target.dataset.start, end: e.target.dataset.end,
      isExtended: e.target.dataset.extended === "true",
    };
    document.getElementById("resched-confirm-btn").style.display = "inline-flex";
  }
});

document.getElementById("resched-confirm-btn").addEventListener("click", async () => {
  const dateStr = document.getElementById("resched-date-input").value;
  if (!dateStr || !reschedSelectedSlot) return;

  const { error } = await supabaseClient.rpc("reschedule_my_booking", {
    p_booking_id: activeRescheduleBooking,
    p_email: lookupEmail,
    p_phone: lookupPhone,
    p_new_date: dateStr,
    p_new_start: reschedSelectedSlot.start,
    p_new_end: reschedSelectedSlot.end,
    p_is_extended: reschedSelectedSlot.isExtended,
  });

  if (error) {
    alert(error.message || "Couldn't reschedule. That slot may have just been taken — please try another.");
    renderReschedSlots(dateStr);
    return;
  }

  document.getElementById("reschedule-panel").style.display = "none";
  document.getElementById("lookup-btn").click();
});

document.getElementById("resched-cancel-btn").addEventListener("click", () => {
  document.getElementById("reschedule-panel").style.display = "none";
  activeRescheduleBooking = null;
});
