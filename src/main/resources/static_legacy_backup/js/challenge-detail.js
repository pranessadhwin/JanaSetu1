const DOMAINS = [
  "EDUCATION", "HEALTHCARE", "AGRICULTURE", "WATER", "SANITATION",
  "ENVIRONMENT", "RURAL_LIVELIHOOD", "ACCESSIBILITY", "URBAN_INFRASTRUCTURE", "PUBLIC_SERVICE",
];

const session = requireAuth();
renderNav(null);

const alertBox = document.getElementById("alert-box");
const contentEl = document.getElementById("challenge-content");
const params = new URLSearchParams(window.location.search);
const challengeId = params.get("id");

function isImage(fileType) {
  return (fileType || "").startsWith("image/");
}
function isVideo(fileType) {
  return (fileType || "").startsWith("video/");
}

async function loadChallenge() {
  if (!challengeId) {
    showAlert(alertBox, "No challenge id was provided.");
    return;
  }
  try {
    const c = await apiFetch(`/challenges/${challengeId}`);
    contentEl.classList.remove("hidden");

    document.getElementById("c-title").textContent = c.title;
    document.getElementById("c-meta").textContent = `Reported by ${c.submittedByName} on ${formatDate(c.createdAt)}`;
    document.getElementById("c-description").textContent = c.description;
    document.getElementById("c-address").textContent = c.address;
    document.getElementById("c-coords").textContent = `${c.latitude}, ${c.longitude}`;
    document.getElementById("c-domain").textContent = c.domain ? formatEnum(c.domain) : "Not classified yet";
    document.getElementById("c-track").textContent = c.resolutionTrack ? formatEnum(c.resolutionTrack) : "Not classified yet";
    document.getElementById("c-routed-to").textContent = c.routedToName
      ? `${c.routedToName} (${c.routedToType === "LOCAL_BODY" ? "Local Body" : "University"})`
      : "Not routed yet";
    document.getElementById("c-status").innerHTML = `<span class="pill status-${c.status}">${formatEnum(c.status)}</span>`;

    const mediaMount = document.getElementById("c-media");
    const mediaEmpty = document.getElementById("c-media-empty");
    if (!c.media || !c.media.length) {
      mediaEmpty.classList.remove("hidden");
    } else {
      mediaMount.innerHTML = c.media
        .map((m) => {
          const url = `/api/media/${m.id}`;
          if (isImage(m.fileType)) return `<a href="${url}" target="_blank"><img src="${url}" alt="attachment" /></a>`;
          if (isVideo(m.fileType)) return `<video src="${url}" controls></video>`;
          return `<a class="file-link" href="${url}" target="_blank">📎 Download attachment</a>`;
        })
        .join("");
    }

    if (session?.role === "SUPER_ADMIN") {
      setupOverride(c.domain, c.resolutionTrack);
    }
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load challenge details.");
  }
}

function setupOverride(currentDomain, currentTrack) {
  const card = document.getElementById("override-card");
  card.classList.remove("hidden");

  const select = document.getElementById("override-domain");
  select.innerHTML = DOMAINS.map(
    (d) => `<option value="${d}" ${d === currentDomain ? "selected" : ""}>${formatEnum(d)}</option>`
  ).join("");

  const trackSelect = document.getElementById("override-track");
  if (currentTrack) {
    trackSelect.value = currentTrack;
  }

  const form = document.getElementById("override-form");
  const overrideAlert = document.getElementById("override-alert");
  const submitBtn = document.getElementById("override-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert(overrideAlert);
    submitBtn.disabled = true;
    try {
      await apiFetch(`/classification/${challengeId}/override`, {
        method: "POST",
        body: { domain: select.value, resolutionTrack: trackSelect.value },
      });
      showAlert(overrideAlert, "Classification updated.", "success");
      loadChallenge();
    } catch (err) {
      showAlert(overrideAlert, err.message || "Could not override classification.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

loadChallenge();
