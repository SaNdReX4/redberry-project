// register.js

const signupModal = document.getElementById("signupModal");
const openSignupBtn = document.getElementById("openModalBtn");
const closeSignupBtn = document.getElementById("closeModal");
const backBtn = document.getElementById("backBtn");
const nextButtons = document.querySelectorAll(".next-btn");
const steps = document.querySelectorAll(".form-step");
const lines = document.querySelectorAll(".progress-bar .line");
const signupForm = document.getElementById("signupForm");

let currentStep = 1;

//  მოდალის მართვა ---
if (openSignupBtn)
  openSignupBtn.onclick = () => (signupModal.style.display = "flex");
if (closeSignupBtn) closeSignupBtn.onclick = closeModalWithReset;

function closeModalWithReset() {
  signupModal.style.display = "none";
  changeStep(1);
}

//  ვალიდაციის ფუნქცია
function validateStep(stepIndex) {
  const activeStep = steps[stepIndex];
  const inputs = activeStep.querySelectorAll("input[required]");
  let errors = {};
  let isValid = true;

  inputs.forEach((input) => {
    const value = input.value.trim();
    const id = input.id;

    if (!value) {
      isValid = false;
      errors[id] = ["This field is required"];
    } else if (value.length < 3) {
      isValid = false;
      errors[id] = ["Must be at least 3 characters"];
    } else if (input.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errors[id] = ["Invalid email format"];
      }
    } else if (id === "confirmPassword") {
      const password = document.getElementById("password").value;
      if (value !== password) {
        isValid = false;
        errors[id] = ["Passwords do not match"];
      }
    }
  });

  if (!isValid) {
    // იყენებს script.js-ში არსებულ handleApiErrors ფუნქციას
    handleApiErrors(errors, "signupForm");
  }
  return isValid;
}

// სთეპების მართვა ---
function changeStep(newStep) {
  // გასუფთავება გადასვლამდე
  signupForm
    .querySelectorAll(".input-group")
    .forEach((g) => g.classList.remove("error"));
  signupForm.querySelectorAll(".error-msg").forEach((m) => (m.innerText = ""));

  steps[currentStep - 1].classList.remove("active");
  if (lines[currentStep - 1]) lines[currentStep - 1].classList.remove("active");

  currentStep = newStep;

  steps[currentStep - 1].classList.add("active");
  if (lines[currentStep - 1]) lines[currentStep - 1].classList.add("active");

  if (backBtn) {
    currentStep > 1
      ? backBtn.classList.remove("hidden")
      : backBtn.classList.add("hidden");
  }
}

nextButtons.forEach((btn) => {
  btn.onclick = () => {
    // თუ ვალიდაცია გაიარა, მხოლოდ მაშინ გადადის შემდეგზე
    if (validateStep(currentStep - 1)) {
      changeStep(currentStep + 1);
    }
  };
});

if (backBtn) backBtn.onclick = () => changeStep(currentStep - 1);

// პაროლის თვალი
document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", function () {
    const input = document.getElementById(this.getAttribute("data-target"));
    if (input) {
      input.type = input.type === "password" ? "text" : "password";
      this.src = `../../assets/icons/Icon Set=eye ${input.type === "password" ? "open" : "closed"}.svg`;
    }
  });
});

//  ავატარი და ფაილები
const dropzone = document.getElementById("dropzone");
const avatarInput = document.getElementById("avatarInput");
const uploadText = document.getElementById("uploadText");

if (dropzone) {
  dropzone.onclick = () => avatarInput.click();

  avatarInput.onchange = function () {
    handleFiles(this.files);
  };

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "#4F46E5";
  };

  dropzone.ondragleave = () => (dropzone.style.borderColor = "");

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "";
    handleFiles(e.dataTransfer.files);
  };
}

function handleFiles(files) {
  if (files && files[0] && files[0].type.startsWith("image/")) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(files[0]);
    avatarInput.files = dataTransfer.files;

    uploadText.innerHTML = `Selected: <b>${files[0].name}</b>`;
    console.log("File attached:", avatarInput.files[0]);
  } else {
    alert(" ატვირთეთ მხოლოდ სურათი!");
  }
}

signupForm.onsubmit = async (e) => {
  e.preventDefault();

  // ბოლო სთეპის ვალიდაცია
  if (!validateStep(currentStep - 1)) return;

  const manualData = new FormData();
  manualData.append("username", document.getElementById("username").value);
  manualData.append("email", document.getElementById("email").value);
  manualData.append("password", document.getElementById("password").value);
  manualData.append(
    "password_confirmation",
    document.getElementById("confirmPassword").value,
  );
  if (avatarInput.files[0]) manualData.append("avatar", avatarInput.files[0]);

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: manualData,
    });

    const result = await response.json();

    if (response.status === 201 || response.ok) {
      alert("Registration Successful!");
      const token = result.token || (result.data && result.data.token);
      localStorage.setItem("user_token", token);
      location.reload();
    } else if (response.status === 422) {
      handleApiErrors(result.errors, "signupForm");
    } else {
      alert("Error: " + (result.message || "Something went wrong"));
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};

// წერისას გაწითლების გაქრობა ლეიბლებში რო ვწერ ეგარი
signupForm.querySelectorAll("input").forEach((input) => {
  input.oninput = () => {
    const group = input.closest(".input-group");
    if (group) group.classList.remove("error");
  };
});
