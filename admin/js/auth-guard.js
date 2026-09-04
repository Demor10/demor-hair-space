// ============================================================
// Demor Hair Space — Admin Auth Guard
// ============================================================
// Include this on every admin page (after supabase-client.js).
// It checks for a logged-in session and redirects to login if none.

async function requireAdminAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

function setupLogout() {
  const btn = document.getElementById("logout-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  }
}

requireAdminAuth();
document.addEventListener("DOMContentLoaded", setupLogout);
