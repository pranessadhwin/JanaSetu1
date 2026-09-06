renderNav("login");

if (Session.isAuthenticated()) {
  window.location.href = "index.html";
}

const form = document.getElementById("login-form");
const alertBox = document.getElementById("alert-box");
const submitBtn = document.getElementById("login-submit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert(alertBox);
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    Session.set(data);
    window.location.href = "index.html";
  } catch (err) {
    showAlert(alertBox, err.message || "Login failed.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});
