const session = requireAuth(["UNIVERSITY_ADMIN"]);
renderNav("university-assignments");

const alertBox = document.getElementById("alert-box");
const claimableBody = document.getElementById("claimable-body");
const claimableEmpty = document.getElementById("claimable-empty");
const assignmentsBody = document.getElementById("assignments-body");
const emptyState = document.getElementById("empty-state");

const solutionCard = document.getElementById("solution-card");
const solutionForm = document.getElementById("solution-form");
const solutionAlert = document.getElementById("solution-alert");
const solutionCancelBtn = document.getElementById("solution-cancel");
let solutionAssignmentId = null;

async function loadAll() {
  clearAlert(alertBox);
  if (!session.universityId) {
    showAlert(alertBox, "Your account isn't linked to a university. Contact a Super Admin.");
    return;
  }
  await Promise.all([loadClaimable(), loadMyAssignments()]);
}

async function loadClaimable() {
  try {
    const claimable = await apiFetch("/university/challenges/claimable");
    if (!claimable.length) {
      claimableEmpty.classList.remove("hidden");
      claimableBody.innerHTML = "";
      return;
    }
    claimableEmpty.classList.add("hidden");
    claimableBody.innerHTML = claimable
      .map(
        (a) => `
        <tr>
          <td><a href="challenge.html?id=${a.challengeId}">${escapeHtml(a.challengeTitle)}</a></td>
          <td><span class="pill">${formatEnum(a.domain)}</span></td>
          <td>${escapeHtml(a.universityName)}</td>
          <td><button class="btn small" data-id="${a.id}" data-action="claim">Claim this problem</button></td>
        </tr>`
      )
      .join("");

    claimableBody.querySelectorAll("button[data-action='claim']").forEach((btn) => {
      btn.addEventListener("click", () => handleClaim(btn.dataset.id));
    });
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load claimable challenges.");
  }
}

async function handleClaim(assignmentId) {
  clearAlert(alertBox);
  try {
    await apiFetch(`/university/assignments/${assignmentId}/claim`, { method: "POST" });
    await loadAll();
  } catch (err) {
    showAlert(alertBox, err.message || "Could not claim this challenge.");
  }
}

async function loadMyAssignments() {
  try {
    const assignments = await apiFetch(`/university/${session.universityId}/assignments`);
    const mine = assignments.filter((a) => a.status === "ACCEPTED" || a.status === "PENDING");
    if (!mine.length) {
      emptyState.classList.remove("hidden");
      assignmentsBody.innerHTML = "";
      return;
    }
    emptyState.classList.add("hidden");
    assignmentsBody.innerHTML = mine
      .map((a) => {
        const solutionCell = a.solutionProposedAt
          ? `<strong>${escapeHtml(a.solutionTitle)}</strong><br/><span class="muted">Proposed ${formatDate(a.solutionProposedAt)}</span>`
          : `<span class="muted">Not proposed yet</span>`;
        const actionCell =
          a.status === "ACCEPTED"
            ? `<button class="btn small secondary" data-action="propose" data-id="${a.id}" data-title="${escapeHtml(a.solutionTitle || "")}">${a.solutionProposedAt ? "Edit solution" : "Propose solution"}</button>`
            : "";
        return `
        <tr>
          <td><a href="challenge.html?id=${a.challengeId}">${escapeHtml(a.challengeTitle)}</a></td>
          <td><span class="pill">${formatEnum(a.domain)}</span></td>
          <td><span class="pill status-${a.status}">${formatEnum(a.status)}</span></td>
          <td>${solutionCell}</td>
          <td>${actionCell}</td>
        </tr>`;
      })
      .join("");

    assignmentsBody.querySelectorAll("button[data-action='propose']").forEach((btn) => {
      btn.addEventListener("click", () => openSolutionForm(btn.dataset.id, mine.find((a) => String(a.id) === btn.dataset.id)));
    });
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load your assignments.");
  }
}

function openSolutionForm(assignmentId, assignment) {
  solutionAssignmentId = assignmentId;
  solutionCard.classList.remove("hidden");
  clearAlert(solutionAlert);
  document.getElementById("solution-title").value = assignment?.solutionTitle || "";
  document.getElementById("solution-description").value = assignment?.solutionDescription || "";
  document.getElementById("team-members").value = assignment?.teamMembers || "";
  solutionCard.scrollIntoView({ behavior: "smooth" });
}

solutionCancelBtn.addEventListener("click", () => {
  solutionCard.classList.add("hidden");
  solutionAssignmentId = null;
});

solutionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!solutionAssignmentId) return;
  clearAlert(solutionAlert);

  const payload = {
    title: document.getElementById("solution-title").value.trim(),
    description: document.getElementById("solution-description").value.trim(),
    teamMembers: document.getElementById("team-members").value.trim(),
  };

  try {
    await apiFetch(`/university/assignments/${solutionAssignmentId}/propose-solution`, {
      method: "POST",
      body: payload,
    });
    solutionCard.classList.add("hidden");
    solutionAssignmentId = null;
    await loadMyAssignments();
  } catch (err) {
    showAlert(solutionAlert, err.message || "Could not submit the solution.");
  }
});

loadAll();
