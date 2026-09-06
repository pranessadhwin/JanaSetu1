requireAuth(["INDUSTRY"]);
renderNav("industry-dashboard");

const ENGAGEMENT_TYPES = ["MENTOR", "FUND", "PROTOTYPE", "DEPLOY"];

const alertBox = document.getElementById("alert-box");
const grid = document.getElementById("solutions-grid");
const solutionsEmpty = document.getElementById("solutions-empty");
const engagementsBody = document.getElementById("engagements-body");
const engagementsEmpty = document.getElementById("engagements-empty");

async function loadAll() {
  clearAlert(alertBox);
  await Promise.all([loadSolutions(), loadEngagements()]);
}

async function loadSolutions() {
  try {
    const solutions = await apiFetch("/industry/solutions/available");
    if (!solutions.length) {
      solutionsEmpty.classList.remove("hidden");
      grid.innerHTML = "";
      return;
    }
    solutionsEmpty.classList.add("hidden");
    grid.innerHTML = solutions
      .map(
        (s) => `
        <div class="card">
          <h3>${escapeHtml(s.solutionTitle)}</h3>
          <p class="muted">For: <a href="challenge.html?id=${s.challengeId}">${escapeHtml(s.challengeTitle)}</a> · <span class="pill">${s.domain ? formatEnum(s.domain) : "-"}</span></p>
          <p>${escapeHtml(s.solutionDescription)}</p>
          <p class="help-text"><strong>Team:</strong> ${escapeHtml(s.teamMembers || "Not specified")}</p>
          <p class="help-text"><strong>University:</strong> ${escapeHtml(s.universityName)}</p>
          <form class="stacked engage-form" data-assignment-id="${s.assignmentId}">
            <div>
              <label>Support type</label>
              <select class="engagement-type">
                ${ENGAGEMENT_TYPES.map((t) => `<option value="${t}">${formatEnum(t)}</option>`).join("")}
              </select>
            </div>
            <div>
              <label>Notes (optional)</label>
              <textarea class="engagement-notes" placeholder="How would you like to help?"></textarea>
            </div>
            <button type="submit" class="btn small">I'll support this</button>
            <div class="engage-alert"></div>
          </form>
        </div>`
      )
      .join("");

    grid.querySelectorAll(".engage-form").forEach((form) => {
      form.addEventListener("submit", (e) => handleEngage(e, form));
    });
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load available solutions.");
  }
}

async function handleEngage(e, form) {
  e.preventDefault();
  const assignmentId = form.dataset.assignmentId;
  const engagementType = form.querySelector(".engagement-type").value;
  const notes = form.querySelector(".engagement-notes").value.trim();
  const engageAlert = form.querySelector(".engage-alert");
  clearAlert(engageAlert);

  try {
    await apiFetch(`/industry/solutions/${assignmentId}/engage`, {
      method: "POST",
      body: { engagementType, notes },
    });
    showAlert(engageAlert, "Thanks! Your interest has been recorded.", "success");
    await loadEngagements();
  } catch (err) {
    showAlert(engageAlert, err.message || "Could not record your engagement.");
  }
}

async function loadEngagements() {
  try {
    const engagements = await apiFetch("/industry/engagements/my");
    if (!engagements.length) {
      engagementsEmpty.classList.remove("hidden");
      engagementsBody.innerHTML = "";
      return;
    }
    engagementsEmpty.classList.add("hidden");
    engagementsBody.innerHTML = engagements
      .map(
        (e) => `
        <tr>
          <td><a href="challenge.html?id=${e.challengeId}">${escapeHtml(e.challengeTitle)}</a></td>
          <td>${escapeHtml(e.universityName)}</td>
          <td>${escapeHtml(e.solutionTitle || "-")}</td>
          <td><span class="pill">${formatEnum(e.engagementType)}</span></td>
          <td>${escapeHtml(e.notes || "-")}</td>
          <td>${formatDate(e.createdAt)}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load your engagements.");
  }
}

loadAll();
