// ============================================================
// Demor Hair Space — Admin: Hours & Availability logic
// ============================================================

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

async function loadWeeklyHours() {
  const tbody = document.getElementById("weekly-body");
  const { data, error } = await supabaseClient
    .from("weekly_hours")
    .select("*")
    .order("day_of_week", { ascending: true });

  if (error || !data) {
    tbody.innerHTML = `<tr><td colspan="6">Couldn't load hours.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => `
    <tr data-day="${d.day_of_week}">
      <td>${DAY_NAMES[d.day_of_week]}</td>
      <td><input type="checkbox" class="wk-open" ${d.is_open ? "checked" : ""} /></td>
      <td><input type="time" class="wk-open-time input" value="${d.open_time.slice(0,5)}" style="width:110px;" /></td>
      <td><input type="time" class="wk-normal-close input" value="${d.normal_close_time.slice(0,5)}" style="width:110px;" /></td>
      <td><input type="time" class="wk-extended-close input" value="${d.close_extended_time.slice(0,5)}" style="width:110px;" /></td>
      <td><button class="btn-sm" data-action="save-day">Save</button></td>
    </tr>
  `).join("");
}

document.addEventListener("click", async (e) => {
  if (e.target.dataset.action === "save-day") {
    const row = e.target.closest("tr");
    const day = row.dataset.day;
    const updates = {
      is_open: row.querySelector(".wk-open").checked,
      open_time: row.querySelector(".wk-open-time").value,
      normal_close_time: row.querySelector(".wk-normal-close").value,
      close_extended_time: row.querySelector(".wk-extended-close").value,
    };
    const { error } = await supabaseClient.from("weekly_hours").update(updates).eq("day_of_week", day);
    if (error) { alert("Couldn't save. Please try again."); return; }
    e.target.textContent = "Saved ✓";
    setTimeout(() => e.target.textContent = "Save", 1500);
  }
});

async function loadOverrides() {
  const tbody = document.getElementById("overrides-body");
  const { data, error } = await supabaseClient
    .from("date_overrides")
    .select("*")
    .gte("date", new Date().toISOString().slice(0,10))
    .order("date", { ascending: true });

  if (error || !data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No upcoming overrides.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(o => `
    <tr data-date="${o.date}">
      <td>${o.date}</td>
      <td>${o.is_open ? "Open (custom)" : "Closed"}</td>
      <td>${o.is_open ? `${o.open_time?.slice(0,5)} – ${o.close_extended_time?.slice(0,5)}` : "—"}</td>
      <td><button class="btn-sm danger" data-action="delete-override">Remove</button></td>
    </tr>
  `).join("");
}

document.getElementById("override-open").addEventListener("change", (e) => {
  document.getElementById("override-times").style.display = e.target.value === "true" ? "grid" : "none";
});

document.getElementById("add-override-btn").addEventListener("click", async () => {
  const date = document.getElementById("override-date").value;
  const isOpen = document.getElementById("override-open").value === "true";
  if (!date) { alert("Please pick a date."); return; }

  const payload = { date, is_open: isOpen };
  if (isOpen) {
    payload.open_time = document.getElementById("override-open-time").value;
    payload.normal_close_time = document.getElementById("override-normal-close").value;
    payload.close_extended_time = document.getElementById("override-extended-close").value;
  }

  const { error } = await supabaseClient.from("date_overrides").upsert(payload);
  if (error) { alert("Couldn't save override."); console.error(error); return; }
  loadOverrides();
});

document.addEventListener("click", async (e) => {
  if (e.target.dataset.action === "delete-override") {
    const date = e.target.closest("tr").dataset.date;
    await supabaseClient.from("date_overrides").delete().eq("date", date);
    loadOverrides();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadWeeklyHours();
  loadOverrides();
});
