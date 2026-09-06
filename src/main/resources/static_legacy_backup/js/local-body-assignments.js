const session = requireAuth(["LOCAL_BODY_ADMIN"]);
renderNav("local-body-assignments");

const alertBox = document.getElementById("alert-box");
const tbody = document.getElementById("assignments-body");
const emptyState = document.getElementById("empty-state");

const resolveCard = document.getElementById("resolve-card");
const resolveForm = document.getElementById("resolve-form");
const resolveAlert = document.getElementById("resolve-alert");
const resolveCancelBtn = document.getElementById("resolve-cancel");
let resolveAssignmentId = null;

async function loadAssignments() {
  clearAlert(alertBox);
  if (!session.localBodyId) {
    showAlert(alertBox, "Your account isn't linked to a local body. Contact a Super Admin.");
    return;
  }
  try {
    const assignments = await apiFetch(`/local-body/${session.localBodyId}/assignments`);
    if (!assignments.length) {
      emptyState.classList.remove("hidden");
      tbody.innerHTML = "";
      return;
    }
    emptyState.classList.add("hidden");
    tbody.innerHTML = assignments
      .map((a) => {
        const resolutionCell = a.status === "RESOLVED"
          ? `${escapeHtml(a.resolutionNotes || "")}<br/><span class="muted">Resolved ${formatDate(a.resolvedAt)}</span>`
          : `<span class="muted">Not resolved yet</span>`;
        const actionCell = a.status === "RESOLVED"
          ? ""
          : `<button class="btn small" data-action="resolve" data-id="${a.id}">Mark resolved</button>`;
        return `
        <tr>
          <td><a href="challenge.html?id=${a.challengeId}">${escapeHtml(a.challengeTitle)}</a></td>
          <td><span class="pill">${formatEnum(a.domain)}</span></td>
          <td><span class="pill status-${a.status}">${formatEnum(a.status)}</span></td>
          <td>${resolutionCell}</td>
          <td>${actionCell}</td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("button[data-action='resolve']").forEach((btn) => {
      btn.addEventListener("click", () => openResolveForm(btn.dataset.id));
    });
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load assigned issues.");
  }
}

function openResolveForm(assignmentId) {
  resolveAssignmentId = assignmentId;
  resolveCard.classList.remove("hidden");
  clearAlert(resolveAlert);
  document.getElementById("resolution-notes").value = "";
  resolveCard.scrollIntoView({ behavior: "smooth" });
}

resolveCancelBtn.addEventListener("click", () => {
  resolveCard.classList.add("hidden");
  resolveAssignmentId = null;
});

resolveForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!resolveAssignmentId) return;
  clearAlert(resolveAlert);

  const resolutionNotes = document.getElementById("resolution-notes").value.trim();

  try {
    await apiFetch(`/local-body/assignments/${resolveAssignmentId}/resolve`, {
      method: "POST",
      body: { resolutionNotes },
    });
    resolveCard.classList.add("hidden");
    resolveAssignmentId = null;
    await loadAssignments();
  } catch (err) {
    showAlert(resolveAlert, err.message || "Could not mark this issue resolved.");
  }
});

loadAssignments();
