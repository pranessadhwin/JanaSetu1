requireAuth(["SUPER_ADMIN"]);
renderNav("admin");

const approvalAlert = document.getElementById("approval-alert");
const pendingBody = document.getElementById("pending-users-body");
const pendingEmpty = document.getElementById("pending-empty-state");

async function loadPendingUsers() {
  clearAlert(approvalAlert);
  try {
    const users = await apiFetch("/admin/users/pending");
    if (!users.length) {
      pendingEmpty.classList.remove("hidden");
      pendingBody.innerHTML = "";
      return;
    }
    pendingEmpty.classList.add("hidden");
    pendingBody.innerHTML = users
      .map(
        (u) => `
        <tr>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="pill">${formatEnum(u.role)}</span></td>
          <td>${escapeHtml(u.organizationName || "-")}</td>
          <td>${formatDate(u.createdAt)}</td>
          <td>
            <div class="inline-actions">
              <button class="btn small" data-action="approve" data-id="${u.id}">Approve</button>
              <button class="btn small danger" data-action="reject" data-id="${u.id}">Reject</button>
            </div>
          </td>
        </tr>`
      )
      .join("");

    pendingBody.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => handlePendingAction(btn.dataset.action, btn.dataset.id));
    });
  } catch (err) {
    showAlert(approvalAlert, err.message || "Could not load pending users.");
  }
}

async function handlePendingAction(action, id) {
  clearAlert(approvalAlert);
  try {
    await apiFetch(`/admin/users/${id}/${action}`, { method: "POST" });
    await loadPendingUsers();
  } catch (err) {
    showAlert(approvalAlert, err.message || `Could not ${action} this user.`);
  }
}

loadPendingUsers();

const alertBox = document.getElementById("alert-box");
const universityIdInput = document.getElementById("university-id");
const loadBtn = document.getElementById("load-btn");
const assignmentsCard = document.getElementById("assignments-card");
const tbody = document.getElementById("assignments-body");
const emptyState = document.getElementById("empty-state");

let allUniversities = [];

async function loadUniversitiesOnce() {
  if (allUniversities.length) return allUniversities;
  allUniversities = await apiFetch("/universities");
  return allUniversities;
}

async function loadAssignments() {
  const universityId = universityIdInput.value.trim();
  if (!universityId) {
    showAlert(alertBox, "Please enter a university ID.");
    return;
  }
  clearAlert(alertBox);
  assignmentsCard.classList.add("hidden");
  emptyState.classList.add("hidden");

  try {
    const [assignments] = await Promise.all([
      apiFetch(`/university/${universityId}/assignments`),
      loadUniversitiesOnce(),
    ]);
    assignmentsCard.classList.remove("hidden");
    if (!assignments.length) {
      emptyState.classList.remove("hidden");
      tbody.innerHTML = "";
      return;
    }
    renderRows(assignments);
  } catch (err) {
    showAlert(alertBox, err.message || "Could not load assignments.");
  }
}

function universityOptions(currentId) {
  return allUniversities
    .map((u) => `<option value="${u.id}" ${u.id === currentId ? "selected" : ""}>${escapeHtml(u.name)}</option>`)
    .join("");
}

function renderRows(assignments) {
  tbody.innerHTML = assignments
    .map(
      (a) => `
      <tr>
        <td><a href="challenge.html?id=${a.challengeId}">${escapeHtml(a.challengeTitle)}</a></td>
        <td><span class="pill">${formatEnum(a.domain)}</span></td>
        <td>${escapeHtml(a.universityName)}</td>
        <td><span class="pill status-${a.status}">${formatEnum(a.status)}</span></td>
        <td>${escapeHtml(a.notes || "-")}</td>
        <td>
          <div class="inline-actions">
            <select data-id="${a.id}" class="reassign-select">${universityOptions(a.universityId)}</select>
            <button class="btn small" data-action="reassign" data-id="${a.id}">Reassign</button>
          </div>
        </td>
      </tr>`
    )
    .join("");

  tbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleReassign(btn.dataset.id));
  });
}

async function handleReassign(assignmentId) {
  clearAlert(alertBox);
  const select = tbody.querySelector(`select[data-id="${assignmentId}"]`);
  const universityId = Number(select.value);
  try {
    await apiFetch(`/university/assignments/${assignmentId}/reassign`, {
      method: "POST",
      body: { universityId },
    });
    await loadAssignments();
  } catch (err) {
    showAlert(alertBox, err.message || "Could not reassign this challenge.");
  }
}

loadBtn.addEventListener("click", loadAssignments);
