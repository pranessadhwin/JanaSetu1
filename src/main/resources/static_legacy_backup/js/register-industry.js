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
  submitBtn.textContent = "Submitting...";

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value,
    industryName: document.getElementById("industryName").value.trim(),
    sector: document.getElementById("sector").value.trim(),
    contactEmail: document.getElementById("contactEmail").value.trim(),
    contactPhone: document.getElementById("contactPhone").value.trim(),
  };

  try {
    await apiFetch("/industry/register", { method: "POST", body: payload });
    form.reset();
    showAlert(
      alertBox,
      "Registration submitted! A Super Admin must approve your account before you can log in.",
      "success"
    );
  } catch (err) {
    showAlert(alertBox, err.message || "Registration failed.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit for approval";
  }
});
