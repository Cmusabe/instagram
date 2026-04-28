// InstaClean Bridge Content Script
// Runs on instaclean.nl to enable website ↔ extension communication

// Mark extension as installed
document.getElementById("instaclean-extension-marker")?.remove();
const marker = document.createElement("div");
marker.id = "instaclean-extension-marker";
marker.dataset.version = chrome.runtime.getManifest().version;
marker.style.display = "none";
document.documentElement.appendChild(marker);

// Listen for commands from the website
window.addEventListener("instaclean-command", (e) => {
  const detail = e.detail;
  if (!detail?.action) return;

  // Forward to background script
  chrome.runtime.sendMessage(detail, (response) => {
    if (chrome.runtime.lastError) {
      window.dispatchEvent(new CustomEvent("instaclean-response", {
        detail: {
          ok: false,
          reason: "runtime_error",
          message: chrome.runtime.lastError.message || "De extensie reageerde niet.",
        },
      }));
      return;
    }

    // Send response back to the website
    window.dispatchEvent(new CustomEvent("instaclean-response", { detail: response }));
  });
});

// Listen for progress updates from background and forward to website
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.source === "extension") {
    // Forward to website via custom event
    window.dispatchEvent(new CustomEvent("instaclean-progress", { detail: msg }));
  }
});
