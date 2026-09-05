// ============================================================
// Demor Hair Space — Booking flow logic
// ============================================================

const SLOT_MINUTES = 45;
const params = new URLSearchParams(window.location.search);
const serviceId = params.get("service");

let currentService = null;
let selectedDate = null;
let selectedSlot = null; // { start_time, end_time, is_extended }

// ---------- Helpers ----------
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

// ---------- Load service ----------
async function loadService() {
  if (!serviceId) {
    document.getElementById("service-summary").innerHTML =
      `<p style="color:#b00020;">No service selected. Please <a href="services.html">choose a style</a> first.</p>`;
    return;
  }
  const { data, error } = await supabaseClient
    .from("services")
    .select("*, service_images(image_url, sort_order)")
    .eq("id", serviceId)
    .single();

  if (error || !data) {
    document.getElementById("service-summary").innerHTML =
      `<p style="color:#b00020;">Couldn't find that service. Please <a href="services.html">choose again</a>.</p>`;
    return;
  }
  currentService = data;
  document.getElementById("service-summary").innerHTML = `
    ${data.name}
    <div class="price-line">₦${Number(data.price).toLocaleString()} (standard hours)</div>
  `;

  const images = (data.service_images || []).sort((a, b) => a.sort_order - b.sort_order);
  const galleryEl = document.getElementById("service-gallery");
  galleryEl.innerHTML = images.map(img => `<img src="${img.image_url}" alt="${data.name}" />`).join("");
}

// ---------- Load hours for a given date ----------
async function getHoursForDate(dateStr) {
  const { data: override } = await supabaseClient
    .from("date_overrides")
    .select("*")
    .eq("date", dateStr)
    .maybeSingle();

  if (override) {
    if (!override.is_open) return null; // closed that day
    return {
      open: override.open_time || "07:00:00",
      normalClose: override.normal_close_time || "18:00:00",
      extendedClose: override.close_extended_time || "22:00:00",
    };
  }

  const dow = new Date(dateStr + "T00:00:00").getDay();
  const { data: weekly } = await supabaseClient
    .from("weekly_hours")
    .select("*")
    .eq("day_of_week", dow)
    .maybeSingle();

  if (!weekly || !weekly.is_open) return null;
  return {
    open: weekly.open_time,
    normalClose: weekly.normal_close_time,
    extendedClose: weekly.close_extended_time,
  };
}

// ---------- Generate all possible slots for a date ----------
function generateSlots(hours) {
  const slots = [];
  const openMin = timeToMinutes(hours.open);
  const normalCloseMin = timeToMinutes(hours.normalClose);
  const extendedCloseMin = timeToMinutes(hours.extendedClose);

  let t = openMin;
  while (t + SLOT_MINUTES <= extendedCloseMin) {
    // skip the gap between normal close and 7PM extended start, if any
    const isExtended = t >= normalCloseMin;
    slots.push({
      start: minutesToTime(t),
      end: minutesToTime(t + SLOT_MINUTES),
      isExtended,
    });
    t += SLOT_MINUTES;
  }
  return slots;
}

// ---------- Render slots for selected date ----------
async function renderSlotsForDate(dateStr) {
  const container = document.getElementById("slots-container");
  const msg = document.getElementById("slots-msg");
  container.innerHTML = "";
  msg.textContent = "Loading available times…";

  const hours = await getHoursForDate(dateStr);
  if (!hours) {
    msg.textContent = "Closed on this date. Please pick another day.";
    return;
  }

  const allSlots = generateSlots(hours);

  const { data: existingBookings, error } = await supabaseClient
    .from("bookings")
    .select("start_time")
    .eq("appointment_date", dateStr)
    .neq("status", "cancelled");

  if (error) {
    msg.textContent = "Couldn't check availability. Please try again.";
    return;
  }

  const takenTimes = new Set((existingBookings || []).map(b => b.start_time));
  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  msg.textContent = "";
  container.innerHTML = allSlots.map(slot => {
    const taken = takenTimes.has(slot.start);
    const past = isToday && timeToMinutes(slot.start) <= nowMinutes;
    const disabled = taken || past;
    return `
      <button type="button"
        class="slot-btn ${slot.isExtended ? "extended" : ""}"
        data-start="${slot.start}"
        data-end="${slot.end}"
        data-extended="${slot.isExtended}"
        ${disabled ? "disabled" : ""}>
        ${formatDisplayTime(slot.start)}
      </button>
    `;
  }).join("");

  if (allSlots.length === 0) {
    msg.textContent = "No slots available on this date.";
  }
}

// ---------- Slot selection ----------
document.addEventListener("click", (e) => {
  if (e.target.matches(".slot-btn") && !e.target.disabled) {
    document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedSlot = {
      start_time: e.target.dataset.start,
      end_time: e.target.dataset.end,
      is_extended: e.target.dataset.extended === "true",
    };
    document.getElementById("step-details").style.display = "block";
    document.getElementById("step-payment").style.display = "block";
    document.getElementById("confirm-btn").style.display = "inline-flex";
    updateAmount();
  }
});

function updateAmount() {
  if (!currentService || !selectedSlot) return;
  const base = Number(currentService.price);
  const amount = selectedSlot.is_extended ? Math.round(base * 1.2) : base;
  document.getElementById("amount-to-pay").textContent = `₦${amount.toLocaleString()}`;
}

// ---------- Payment method toggle ----------
document.addEventListener("change", (e) => {
  if (e.target.name === "payment") {
    document.getElementById("transfer-details").style.display =
      e.target.value === "online_transfer" ? "block" : "none";
  }
});

// ---------- Date input ----------
document.getElementById("date-input").addEventListener("change", (e) => {
  selectedDate = e.target.value;
  selectedSlot = null;
  document.getElementById("step-details").style.display = "none";
  document.getElementById("step-payment").style.display = "none";
  document.getElementById("confirm-btn").style.display = "none";
  renderSlotsForDate(selectedDate);
});

// set min date to today
const dateInput = document.getElementById("date-input");
dateInput.min = new Date().toISOString().slice(0, 10);

// ---------- Submit booking ----------
document.getElementById("confirm-btn").addEventListener("click", async () => {
  const errorEl = document.getElementById("submit-error");
  errorEl.style.display = "none";

  const name = document.getElementById("customer-name").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

  if (!name || !email || !phone) {
    errorEl.textContent = "Please fill in your name, email, and phone number.";
    errorEl.style.display = "block";
    return;
  }
  if (!selectedDate || !selectedSlot) {
    errorEl.textContent = "Please select a date and time.";
    errorEl.style.display = "block";
    return;
  }

  const base = Number(currentService.price);
  const priceCharged = selectedSlot.is_extended ? Math.round(base * 1.2) : base;

  let proofUrl = null;
  if (paymentMethod === "online_transfer") {
    const fileInput = document.getElementById("payment-proof");
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const filePath = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage.from("payment-proofs")
        .upload(filePath, file);
      if (uploadError) {
        errorEl.textContent = "Couldn't upload payment proof. You can still submit and send it via WhatsApp instead.";
        errorEl.style.display = "block";
      } else {
        const { data: publicUrlData } = supabaseClient
          .storage.from("payment-proofs").getPublicUrl(filePath);
        proofUrl = publicUrlData.publicUrl;
      }
    }
  }

  const confirmBtn = document.getElementById("confirm-btn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Booking…";

  const { data, error } = await supabaseClient.from("bookings").insert({
    service_id: currentService.id,
    customer_name: name,
    customer_email: email,
    customer_phone: phone,
    appointment_date: selectedDate,
    start_time: selectedSlot.start_time,
    end_time: selectedSlot.end_time,
    is_extended_hours: selectedSlot.is_extended,
    price_charged: priceCharged,
    payment_method: paymentMethod,
    payment_proof_url: proofUrl,
    status: paymentMethod === "online_transfer" ? "pending_payment" : "confirmed",
  }).select().single();

  confirmBtn.disabled = false;
  confirmBtn.textContent = "Confirm Booking";

  if (error) {
    if (error.code === "23505") {
      errorEl.textContent = "That time slot was just taken by someone else. Please pick another.";
      renderSlotsForDate(selectedDate);
    } else {
      errorEl.textContent = "Something went wrong submitting your booking. Please try again.";
      console.error(error);
    }
    errorEl.style.display = "block";
    return;
  }

  document.querySelectorAll(".booking-step").forEach(el => el.style.display = "none");
  document.getElementById("confirm-btn").style.display = "none";
  document.getElementById("success-box").style.display = "block";
  document.getElementById("success-msg").textContent = paymentMethod === "online_transfer"
    ? `Your booking for ${formatDisplayTime(selectedSlot.start_time)} on ${selectedDate} is pending payment confirmation. We'll email ${email} once it's verified.`
    : `Your booking for ${formatDisplayTime(selectedSlot.start_time)} on ${selectedDate} is confirmed. See you then!`;
});

loadService();
