const API_URL = "https://api.redclass.redberryinternship.ge/api";

function updateAuthUI(isLoggedIn, userData = null) {
  const userZone = document.getElementById("user-zone");
  const guestZone = document.getElementById("guest-zone");
  const headerAvatar = document.getElementById("headerAvatar");

  if (isLoggedIn) {
    if (userZone) userZone.style.setProperty("display", "flex", "important");
    if (guestZone) guestZone.style.setProperty("display", "none", "important");
    if (headerAvatar && userData && userData.avatar) {
      headerAvatar.src = userData.avatar;
    }
  } else {
    if (userZone) userZone.style.setProperty("display", "none", "important");
    if (guestZone) guestZone.style.setProperty("display", "flex", "important");
  }
}

// გვერდის ჩატვირთვისას ტოკენის შემოწმება
window.addEventListener("load", async () => {
  const token = localStorage.getItem("user_token");

  if (token && token !== "null" && token !== "undefined") {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const result = await response.json();
        updateAuthUI(true, result.data);
      } else {
        localStorage.removeItem("user_token");
        updateAuthUI(false);
      }
    } catch (error) {
      console.error("Network error:", error);
      updateAuthUI(false);
    }
  } else {
    updateAuthUI(false);
  }
});

function handleApiErrors(errors, formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form
    .querySelectorAll(".input-group")
    .forEach((group) => group.classList.remove("error"));
  form.querySelectorAll(".error-msg").forEach((msg) => (msg.innerText = ""));

  for (const field in errors) {
    const input =
      form.querySelector(`input[id*="${field}"]`) ||
      form.querySelector(`#${field}`);
    if (input) {
      const container = input.closest(".input-group");
      if (container) {
        container.classList.add("error");
        const errorMsg = container.querySelector(".error-msg");
        if (errorMsg) errorMsg.innerText = errors[field][0];
      }
    }
  }
}

// 4. ლოგინის მოდალის  გახსნა
const loginModal = document.getElementById("loginModal");
const openLoginBtn = document.getElementById("openLoginBtn");
const closeLoginBtn = document.getElementById("closeLoginModal");

if (openLoginBtn)
  openLoginBtn.onclick = () => (loginModal.style.display = "flex");
if (closeLoginBtn)
  closeLoginBtn.onclick = () => (loginModal.style.display = "none");

window.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
});

// ეს ფუნქცია ამოწმებს კონკრეტულ სთეპში არსებულ ინპუტებს
function validateStepInputs(stepElement) {
  const inputs = stepElement.querySelectorAll("input[required]");
  let stepErrors = {};
  let isValid = true;

  inputs.forEach((input) => {
    const value = input.value.trim();
    const id = input.id;

    if (!value) {
      isValid = false;
      stepErrors[id] = ["This field is required"];
    } else if (value.length < 3) {
      isValid = false;
      stepErrors[id] = ["Minimum 3 characters required"];
    } else if (input.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        stepErrors[id] = ["Please enter a valid email"];
      }
    } else if (id === "confirmPassword") {
      const pass = document.getElementById("password").value;
      if (value !== pass) {
        isValid = false;
        stepErrors[id] = ["Passwords do not match"];
      }
    }
  });

  if (!isValid) {
    handleApiErrors(stepErrors, "signupForm");
  }
  return isValid;
}
