const DOMAINS = [
  "EDUCATION", "HEALTHCARE", "AGRICULTURE", "WATER", "SANITATION",
  "ENVIRONMENT", "RURAL_LIVELIHOOD", "ACCESSIBILITY", "URBAN_INFRASTRUCTURE", "PUBLIC_SERVICE",
];

renderNav("local-bodies");

const alertBox = document.getElementById("alert-box");
const grid = document.getElementById("local-bodies-grid");
const filter = document.getElementById("discipline-filter");

filter.innerHTML += DOMAINS.map((d) => `<option value="${d}">${formatEnum(d)}</option>`).join("");

async function loadLocalBodies() {
  clearAlert(alertBox);
  try {
    const discipline = filter.value;
    const query = discipline ? `?discipline=${encodeURIComponent(discipline)}` : "";
    const localBodies = await apiFetch(`/local-bodies${query}`);
    if (!localBodies.length) {
      grid.innerHTML = `<div class="empty-state">No local bodies match this filter.</div>`;
      return;
    }
    grid.innerHTML = localBodies
      .map(
        (lb) => `
        <div class="card">
          <h3>${escapeHtml(lb.name)}</h3>
          <p class="muted">${escapeHtml(lb.jurisdiction || "")}</p>
          <p>${(lb.disciplines || []).map((d) => `<span class="pill">${formatEnum(d)}</span>`).join(" ")}</p>
          <p class="help-text">${escapeHtml(lb.contactEmail || "")} ${lb.contactPhone ? "· " + escapeHtml(lb.contactPhone) : ""}</p>
        </div>`
      )
      .join("");
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load local bodies.");
  }
}

filter.addEventListener("change", loadLocalBodies);
loadLocalBodies();
