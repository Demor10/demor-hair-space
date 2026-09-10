// ============================================================
// Demor Hair Space — Customer Stories (homepage carousel)
// ============================================================

let autoGlideInterval = null;
let isPaused = false;
const TRUNCATE_AT = 130;

function reactedKey(storyId, type) {
  return `demor_reacted_${type}_${storyId}`;
}

function storyCardHtml(s) {
  const isLong = s.story_text.length > TRUNCATE_AT;
  const shortText = isLong ? s.story_text.slice(0, TRUNCATE_AT).trim() + "…" : s.story_text;
  const likedAlready = localStorage.getItem(reactedKey(s.id, "like"));
  const laughedAlready = localStorage.getItem(reactedKey(s.id, "laugh"));

  return `
    <div class="story-card" data-story-id="${s.id}">
      <p class="story-text" data-full="${s.story_text.replace(/"/g, "&quot;")}" data-short="${shortText.replace(/"/g, "&quot;")}" data-expanded="false">
        "${shortText}"
      </p>
      ${isLong ? `<button class="story-readmore" data-action="toggle-story">Read more</button>` : ""}
      <div class="story-author">— ${s.customer_name}</div>
      <div class="story-reactions">
        <button class="story-react-btn ${likedAlready ? "reacted" : ""}" data-action="react-like" ${likedAlready ? "disabled" : ""}>
          👍 <span>${s.like_count || 0}</span>
        </button>
        <button class="story-react-btn ${laughedAlready ? "reacted" : ""}" data-action="react-laugh" ${laughedAlready ? "disabled" : ""}>
          😂 <span>${s.laugh_count || 0}</span>
        </button>
      </div>
    </div>
  `;
}

async function loadStories() {
  const rack = document.getElementById("stories-rack");

  const { data, error } = await supabaseClient
    .from("customer_stories")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    rack.innerHTML = `<p class="muted">Couldn't load stories right now.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    rack.innerHTML = `<p class="muted">No stories shared yet — be the first!</p>`;
    return;
  }

  rack.innerHTML = data.map(storyCardHtml).join("");

  // On wide screens, a couple of cards can fit entirely within view, leaving
  // nothing to auto-scroll through. If that's the case, duplicate the set
  // once so there's always visible sliding motion. Only bothers with this
  // when there are few stories — with many, real content already overflows.
  requestAnimationFrame(() => {
    if (rack.scrollWidth <= rack.clientWidth + 20 && data.length > 0) {
      rack.innerHTML += rack.innerHTML;
    }
    startAutoGlide(rack);
  });
}

function startAutoGlide(rack) {
  if (autoGlideInterval) clearInterval(autoGlideInterval);
  autoGlideInterval = setInterval(() => {
    if (isPaused) return;
    const cardWidth = rack.querySelector(".story-card")?.offsetWidth || 320;
    const atEnd = rack.scrollLeft + rack.clientWidth >= rack.scrollWidth - 10;
    rack.scrollTo({
      left: atEnd ? 0 : rack.scrollLeft + cardWidth + 20,
      behavior: "smooth",
    });
  }, 4000);
}

// ---------- Pause auto-glide on interaction (reading, hovering, touching) ----------
const storiesRackEl = document.getElementById("stories-rack");
storiesRackEl.addEventListener("mouseenter", () => { isPaused = true; });
storiesRackEl.addEventListener("mouseleave", () => { isPaused = false; });
storiesRackEl.addEventListener("touchstart", () => { isPaused = true; }, { passive: true });
storiesRackEl.addEventListener("scroll", () => {
  isPaused = true;
  clearTimeout(storiesRackEl._resumeTimer);
  storiesRackEl._resumeTimer = setTimeout(() => { isPaused = false; }, 6000);
});

// ---------- Read more / less toggle ----------
document.addEventListener("click", (e) => {
  if (e.target.dataset.action === "toggle-story") {
    const card = e.target.closest(".story-card");
    const textEl = card.querySelector(".story-text");
    const expanded = textEl.dataset.expanded === "true";
    textEl.textContent = expanded ? `"${textEl.dataset.short}"` : `"${textEl.dataset.full}"`;
    textEl.dataset.expanded = expanded ? "false" : "true";
    e.target.textContent = expanded ? "Read more" : "Show less";
    isPaused = true;
  }
});

// ---------- Reactions ----------
document.addEventListener("click", async (e) => {
  const action = e.target.closest("[data-action='react-like'], [data-action='react-laugh']")?.dataset.action;
  if (!action) return;
  const btn = e.target.closest("button");
  const card = btn.closest(".story-card");
  const storyId = card.dataset.storyId;
  const type = action === "react-like" ? "like" : "laugh";

  if (localStorage.getItem(reactedKey(storyId, type))) return;

  btn.disabled = true;
  const { data, error } = await supabaseClient.rpc("react_to_story", {
    p_story_id: storyId, p_reaction: type,
  });

  if (error) {
    btn.disabled = false;
    console.error(error);
    return;
  }

  localStorage.setItem(reactedKey(storyId, type), "1");
  btn.classList.add("reacted");
  const countEl = btn.querySelector("span");
  countEl.textContent = type === "like" ? data.like_count : data.laugh_count;
});

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
