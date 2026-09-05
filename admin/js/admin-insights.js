// ============================================================
// Demor Hair Space — Admin: AI Scheduling Insights
// ============================================================

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function hourBlockLabel(startTime) {
  const h = parseInt(startTime.split(":")[0], 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

async function gatherBookingStats() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const sinceDate = ninetyDaysAgo.toISOString().slice(0, 10);

  const { data: bookings, error } = await supabaseClient
    .from("bookings")
    .select("appointment_date, start_time, status, is_extended_hours")
    .gte("appointment_date", sinceDate);

  if (error) throw error;

  const byDayOfWeek = Array(7).fill(0);
  const byHourBlock = {};
  let extendedCount = 0;
  let cancelledCount = 0;
  let totalCount = bookings.length;

  bookings.forEach(b => {
    const dow = new Date(b.appointment_date + "T00:00:00").getDay();
    byDayOfWeek[dow]++;

    const label = hourBlockLabel(b.start_time);
    byHourBlock[label] = (byHourBlock[label] || 0) + 1;

    if (b.is_extended_hours) extendedCount++;
    if (b.status === "cancelled") cancelledCount++;
  });

  const { data: weeklyHours } = await supabaseClient
    .from("weekly_hours")
    .select("*")
    .order("day_of_week", { ascending: true });

  return {
    totalCount,
    sinceDate,
    byDayOfWeek: byDayOfWeek.map((count, i) => ({ day: DAY_NAMES[i], count })),
    byHourBlock,
    extendedCount,
    cancelledCount,
    currentWeeklyHours: (weeklyHours || []).map(d => ({
      day: DAY_NAMES[d.day_of_week],
      open: d.is_open,
      hours: d.is_open ? `${d.open_time?.slice(0,5)}–${d.close_extended_time?.slice(0,5)}` : "closed",
    })),
  };
}

function renderStatsSummary(stats) {
  const el = document.getElementById("stats-summary");
  const dayLines = stats.byDayOfWeek.map(d => `${d.day}: ${d.count}`).join(" · ");
  const hourLines = Object.entries(stats.byHourBlock)
    .sort((a, b) => b[1] - a[1])
    .map(([hour, count]) => `${hour}: ${count}`)
    .join(" · ");

  el.innerHTML = `
    <strong>${stats.totalCount}</strong> bookings since ${stats.sinceDate}<br>
    <strong>By day of week:</strong> ${dayLines || "no data"}<br>
    <strong>By hour:</strong> ${hourLines || "no data"}<br>
    <strong>Extended-hours bookings:</strong> ${stats.extendedCount} ·
    <strong>Cancellations:</strong> ${stats.cancelledCount}
  `;
}

document.getElementById("generate-btn").addEventListener("click", async () => {
  const btn = document.getElementById("generate-btn");
  const providerNote = document.getElementById("provider-note");
  const resultsCard = document.getElementById("results-card");
  const output = document.getElementById("suggestions-output");

  btn.disabled = true;
  btn.textContent = "Analyzing…";
  providerNote.textContent = "";

  try {
    const stats = await gatherBookingStats();
    renderStatsSummary(stats);

    if (stats.totalCount < 5) {
      resultsCard.style.display = "block";
      output.textContent = "Not enough booking history yet for meaningful suggestions (fewer than 5 bookings in the last 90 days). Check back once you've had more appointments.";
      btn.disabled = false;
      btn.textContent = "Generate Suggestions";
      return;
    }

    const prompt = `Here is the booking data summary:\n${JSON.stringify(stats, null, 2)}\n\nPlease give your scheduling suggestions.`;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({
        mode: "schedule_suggestions",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Request failed");

    resultsCard.style.display = "block";
    output.textContent = data.reply;
    providerNote.textContent = `(via ${data.provider})`;
  } catch (err) {
    resultsCard.style.display = "block";
    output.textContent = "Couldn't generate suggestions right now. Please try again shortly.";
    console.error(err);
  }

  btn.disabled = false;
  btn.textContent = "Generate Suggestions";
});
