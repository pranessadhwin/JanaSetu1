const DOMAINS = [
  "EDUCATION", "HEALTHCARE", "AGRICULTURE", "WATER", "SANITATION",
  "ENVIRONMENT", "RURAL_LIVELIHOOD", "ACCESSIBILITY", "URBAN_INFRASTRUCTURE", "PUBLIC_SERVICE",
];

renderNav("universities");

const alertBox = document.getElementById("alert-box");
const grid = document.getElementById("universities-grid");
const filter = document.getElementById("discipline-filter");

filter.innerHTML += DOMAINS.map((d) => `<option value="${d}">${formatEnum(d)}</option>`).join("");

async function loadUniversities() {
  clearAlert(alertBox);
  try {
    const discipline = filter.value;
    const query = discipline ? `?discipline=${encodeURIComponent(discipline)}` : "";
    const universities = await apiFetch(`/universities${query}`);
    if (!universities.length) {
      grid.innerHTML = `<div class="empty-state">No universities match this filter.</div>`;
      return;
    }
    grid.innerHTML = universities
      .map(
        (u) => `
        <div class="card">
          <h3>${escapeHtml(u.name)}</h3>
          <p class="muted">${escapeHtml(u.location || "")}</p>
          <p>${(u.disciplines || []).map((d) => `<span class="pill">${formatEnum(d)}</span>`).join(" ")}</p>
          <p class="help-text">${escapeHtml(u.contactEmail || "")} ${u.contactPhone ? "· " + escapeHtml(u.contactPhone) : ""}</p>
        </div>`
      )
      .join("");
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load universities.");
  }
}

filter.addEventListener("change", loadUniversities);
loadUniversities();
