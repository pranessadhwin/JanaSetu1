renderNav("register");

if (Session.isAuthenticated()) {
  window.location.href = "index.html";
}

const form = document.getElementById("register-form");
const alertBox = document.getElementById("alert-box");
const submitBtn = document.getElementById("register-submit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert(alertBox);
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value,
  };

  try {
    const data = await apiFetch("/citizen/register", {
      method: "POST",
      body: payload,
    });
    Session.set(data);
    window.location.href = "index.html";
  } catch (err) {
    showAlert(alertBox, err.message || "Registration failed.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";
  }
});
