requireAuth(["CITIZEN"]);
renderNav("submit");

const form = document.getElementById("challenge-form");
const alertBox = document.getElementById("alert-box");
const submitBtn = document.getElementById("submit-btn");
const useLocationBtn = document.getElementById("use-location-btn");

useLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showAlert(alertBox, "Geolocation is not supported by your browser.");
    return;
  }
  useLocationBtn.disabled = true;
  useLocationBtn.textContent = "Locating...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      document.getElementById("latitude").value = position.coords.latitude.toFixed(6);
      document.getElementById("longitude").value = position.coords.longitude.toFixed(6);
      useLocationBtn.disabled = false;
      useLocationBtn.textContent = "📍 Use my current location";
    },
    () => {
      showAlert(alertBox, "Could not fetch your location. Please enter it manually.");
      useLocationBtn.disabled = false;
      useLocationBtn.textContent = "📍 Use my current location";
    }
  );
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert(alertBox);
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value.trim());
  formData.append("description", document.getElementById("description").value.trim());
  formData.append("address", document.getElementById("address").value.trim());
  formData.append("latitude", document.getElementById("latitude").value);
  formData.append("longitude", document.getElementById("longitude").value);

  const fileInput = document.getElementById("files");
  for (const file of fileInput.files) {
    formData.append("files", file);
  }

  try {
    const data = await apiFetch("/challenges", {
      method: "POST",
      body: formData,
      isForm: true,
    });
    window.location.href = `challenge.html?id=${data.id}`;
  } catch (err) {
    showAlert(alertBox, err.message || "Could not submit challenge.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit challenge";
  }
});
