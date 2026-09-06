// ============================================================
// Demor Hair Space — Hero Background Video Playlist
// ============================================================

async function loadHeroVideos() {
  const videoEl = document.getElementById("hero-bg-video");

  const { data, error } = await supabaseClient
    .from("hero_videos")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return; // no videos — keep the plain gradient background

  let currentIndex = 0;

  function playVideo(index) {
    videoEl.src = data[index].video_url;
    videoEl.style.display = "block";
    videoEl.play().catch(() => {}); // autoplay can be blocked silently on some browsers — fine, gradient still shows
  }

  videoEl.addEventListener("ended", () => {
    currentIndex = (currentIndex + 1) % data.length;
    playVideo(currentIndex);
  });

  playVideo(currentIndex);
}

document.addEventListener("DOMContentLoaded", loadHeroVideos);
