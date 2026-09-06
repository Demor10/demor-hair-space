// ============================================================
// Demor Hair Space — Customer Stories (homepage carousel)
// ============================================================

let autoGlideInterval = null;

async function loadStories() {
  const rack = document.getElementById("stories-rack");

  const { data, error } = await supabaseClient
    .from("customer_stories")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    rack.innerHTML = `<p class="muted">Couldn't load stories right now.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    rack.innerHTML = `<p class="muted">No stories shared yet — be the first!</p>`;
    return;
  }

  rack.innerHTML = data.map(s => `
    <div class="story-card">
      <p class="story-text">"${s.story_text}"</p>
      <div class="story-author">— ${s.customer_name}</div>
    </div>
  `).join("");

  startAutoGlide(rack);
}

function startAutoGlide(rack) {
  if (autoGlideInterval) clearInterval(autoGlideInterval);
  autoGlideInterval = setInterval(() => {
    const cardWidth = rack.querySelector(".story-card")?.offsetWidth || 320;
    const atEnd = rack.scrollLeft + rack.clientWidth >= rack.scrollWidth - 10;
    rack.scrollTo({
      left: atEnd ? 0 : rack.scrollLeft + cardWidth + 20,
      behavior: "smooth",
    });
  }, 4000);
}

document.getElementById("stories-prev").addEventListener("click", () => {
  const rack = document.getElementById("stories-rack");
  const cardWidth = rack.querySelector(".story-card")?.offsetWidth || 320;
  rack.scrollBy({ left: -(cardWidth + 20), behavior: "smooth" });
});
document.getElementById("stories-next").addEventListener("click", () => {
  const rack = document.getElementById("stories-rack");
  const cardWidth = rack.querySelector(".story-card")?.offsetWidth || 320;
  rack.scrollBy({ left: cardWidth + 20, behavior: "smooth" });
});

// ---------- Share Your Story modal ----------
const modal = document.getElementById("story-modal");
document.getElementById("share-story-btn").addEventListener("click", () => modal.classList.add("open"));
document.getElementById("story-modal-close").addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

document.getElementById("story-submit-btn").addEventListener("click", async () => {
  const name = document.getElementById("story-name").value.trim();
  const text = document.getElementById("story-text").value.trim();
  const statusEl = document.getElementById("story-status");

  if (!name || !text) {
    statusEl.style.color = "#b00020";
    statusEl.textContent = "Please fill in your name and story.";
    return;
  }

  const btn = document.getElementById("story-submit-btn");
  btn.disabled = true;
  btn.textContent = "Submitting…";

  const { error } = await supabaseClient.from("customer_stories").insert({
    customer_name: name, story_text: text,
  });

  btn.disabled = false;
  btn.textContent = "Submit Story";

  if (error) {
    statusEl.style.color = "#b00020";
    statusEl.textContent = "Something went wrong. Please try again.";
    console.error(error);
    return;
  }

  statusEl.style.color = "#1e7a43";
  statusEl.textContent = "Thanks for sharing! Your story will appear here once approved.";
  document.getElementById("story-name").value = "";
  document.getElementById("story-text").value = "";
});

document.addEventListener("DOMContentLoaded", loadStories);
