const modal = document.getElementById("signupModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModal");
const backBtn = document.getElementById("backBtn");
const nextButtons = document.querySelectorAll(".next-btn");
const steps = document.querySelectorAll(".form-step");
const lines = document.querySelectorAll(".progress-bar .line");

let currentStep = 1;

openBtn.onclick = () => (modal.style.display = "flex");
closeBtn.onclick = () => (modal.style.display = "none");

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

nextButtons.forEach((btn) => {
  btn.onclick = () => {
    changeStep(currentStep + 1);
  };
});

backBtn.onclick = () => {
  changeStep(currentStep - 1);
};

function changeStep(newStep) {
  steps[currentStep - 1].classList.remove("active");
  lines[currentStep - 1].classList.remove("active");

  currentStep = newStep;

  steps[currentStep - 1].classList.add("active");
  lines[currentStep - 1].classList.add("active");

  if (currentStep > 1) {
    backBtn.classList.remove("hidden");
  } else {
    backBtn.classList.add("hidden");
  }
}

const closeModalWithReset = () => {
  modal.style.display = "none";
  changeStep(1);
};

closeBtn.onclick = closeModalWithReset;

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModalWithReset();
});

// პაროლის გამოჩენა დამალვა

document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", function () {
    const inputId = this.getAttribute("data-target");
    const input = document.getElementById(inputId);

    if (input.type === "password") {
      input.type = "text";
      this.src = "../../assets/icons/Icon Set=eye open.svg";
    } else {
      input.type = "password";
      this.src = "../../assets/icons/Icon Set=eye closed.svg";
    }
  });
});

// დრაგ ანდ დროპი

const dropzone = document.getElementById("dropzone");
const avatarInput = document.getElementById("avatarInput");
const uploadText = document.getElementById("uploadText");

dropzone.addEventListener("click", () => {
  avatarInput.click();
});

avatarInput.addEventListener("change", function () {
  handleFiles(this.files);
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.style.borderColor = "#4F46E5";
});

dropzone.addEventListener("dragleave", () => {
  dropzone.style.borderColor = "";
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.style.borderColor = "";

  const files = e.dataTransfer.files;
  handleFiles(files);
});

function handleFiles(files) {
  if (files.length > 0) {
    const file = files[0];

    if (file.type.startsWith("image/")) {
      avatarInput.files = files;
      uploadText.innerHTML = `Selected: <b>${file.name}</b>`;
    } else {
      alert("გთხოვთ ატვირთოთ მხოლოდ სურათი!");
    }
  }
}

// ლოგინის მოდალი

const loginModal = document.getElementById("loginModal");
const openLoginBtn = document.getElementById("openLoginBtn");
const closeLoginBtn = document.getElementById("closeLoginModal");

if (openLoginBtn) {
  openLoginBtn.onclick = () => (loginModal.style.display = "flex");
}

closeLoginBtn.onclick = () => (loginModal.style.display = "none");
window.onclick = (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
};
