const profileModal = document.getElementById("profileModal");
const headerAvatar = document.getElementById("headerAvatar");
const closeProfileModal = document.getElementById("closeProfileModal");
const profileDropzone = document.getElementById("profileDropzone");
const profileAvatarInput = document.getElementById("profileAvatarInput");
const profileUploadText = document.getElementById("profileUploadText");
const logoutBtnElement = document.getElementById("logout");

//  მოდალის  გახსნა/დახურვა
if (headerAvatar) {
  headerAvatar.addEventListener("click", () => {
    const token = localStorage.getItem("user_token");
    if (token) {
      profileModal.style.display = "flex";
      fetchUserProfile();
    }
  });
}

if (closeProfileModal) {
  closeProfileModal.onclick = () => (profileModal.style.display = "none");
}

window.addEventListener("click", (e) => {
  if (e.target === profileModal) profileModal.style.display = "none";
});

// 3. ფოტოს ატვირთვის ფუნქციონალი (Dropzone + Drag and Drop)
if (profileDropzone) {
  profileDropzone.addEventListener("click", () => {
    profileAvatarInput.click();
  });

  profileAvatarInput.addEventListener("change", function () {
    handleProfileFiles(this.files);
  });

  profileDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    profileDropzone.style.borderColor = "#5D37F3";
    profileDropzone.style.backgroundColor = "#f3f0ff";
  });

  profileDropzone.addEventListener("dragleave", () => {
    profileDropzone.style.borderColor = "";
    profileDropzone.style.backgroundColor = "";
  });

  profileDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    profileDropzone.style.borderColor = "";
    profileDropzone.style.backgroundColor = "";
    const files = e.dataTransfer.files;
    handleProfileFiles(files);
  });

  // ფაილების დამუშავების ფუნქცია
  function handleProfileFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        profileAvatarInput.files = files;

        if (profileUploadText) {
          profileUploadText.innerHTML = `Selected: <b>${file.name}</b>`;
        } else {
          const pTag = profileDropzone.querySelector("p");
          if (pTag) pTag.innerHTML = `Selected: <b>${file.name}</b>`;
        }
        console.log("ფაილი მზად არის ატვირთვისთვის:", file.name);
      } else {
        alert("გთხოვთ ატვირთოთ მხოლოდ სურათი!");
      }
    }
  }
}

//  ლოგაუთის ლოგიკა
if (logoutBtnElement) {
  logoutBtnElement.addEventListener("click", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("user_token");

    try {
      await fetch("https://api.redclass.redberryinternship.ge/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("user_token");

    if (typeof updateAuthUI === "function") {
      updateAuthUI(false);
    }

    if (profileModal) profileModal.style.display = "none";
    location.reload();
  });
}

// მოფეჩვა პროფილის

async function fetchUserProfile() {
  const token = localStorage.getItem("user_token");
  if (!token) return;

  try {
    const response = await fetch(
      "https://api.redclass.redberryinternship.ge/api/me",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const result = await response.json();
      const user = result.data;

      //  Full Name ინპუტის შევსება
      const fullNameInput = document.getElementById("profileFullName");
      if (fullNameInput) {
        // თუ fullName ცარიელია, აიღოს username
        fullNameInput.value = user.fullName || user.username || "";
      }

      if (document.getElementById("profileEmail"))
        document.getElementById("profileEmail").value = user.email || "";
      if (document.getElementById("profileMobile"))
        document.getElementById("profileMobile").value =
          user.mobileNumber || "";
      if (document.getElementById("profileAge"))
        document.getElementById("profileAge").value = user.age || "";

      //  მთავარი სახელი მოდალში
      const nameDisplay = document.getElementById("profileNameDisplay");
      if (nameDisplay) {
        nameDisplay.innerText = user.fullName || user.username || "User";
      }

      //  ავატარის განახლება მოდალში
      const avatarDisplay = document.getElementById("profilePreviewImg");
      if (user.avatar && avatarDisplay) {
        avatarDisplay.src = user.avatar;
      }

      // ავატარის განახლება ნავბარში (Header)
      const navAvatar = document.getElementById("headerAvatar");
      if (user.avatar && navAvatar) {
        navAvatar.src = user.avatar;
      }

      console.log("მონაცემები წარმატებით ჩაიტვირთა");
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchUserProfile);

// ინფორმაციის განახლება აბდეით ბათონით

const updateProfileBtn = document.getElementById("updateProfileBtn");
const profileUpdateForm = document.getElementById("profileUpdateForm");

const validateProfile = () => {
  const fullName = document.getElementById("profileFullName").value.trim();
  const mobile = document.getElementById("profileMobile").value.trim();
  const age = document.getElementById("profileAge").value.trim();

  let errors = {};

  // Full Name ვალიდაცია
  if (!fullName) errors.fullName = "Name is required";
  else if (fullName.length < 3)
    errors.fullName = "Name must be at least 3 characters";
  else if (fullName.length > 50)
    errors.fullName = "Name must not exceed 50 characters";

  // Mobile Number ვალიდაცია
  const cleanMobile = mobile.replace(/\s/g, ""); // აიგნორირებს სფეისებს
  if (!cleanMobile) errors.mobile = "Mobile number is required";
  else if (!/^5\d{8}$/.test(cleanMobile))
    errors.mobile =
      "Please enter a valid Georgian mobile number (9 digits starting with 5)";

  // Age ვალიდაცია
  const ageNum = parseInt(age);
  if (!age) errors.age = "Age is required";
  else if (isNaN(ageNum)) errors.age = "Age must be a number";
  else if (ageNum < 16)
    errors.age = "You must be at least 16 years old to enroll";
  else if (ageNum > 120) errors.age = "Please enter a valid age";

  return errors;
};

const showErrors = (errors) => {
  document.querySelectorAll(".error-msg").forEach((el) => el.remove());
  document
    .querySelectorAll("input")
    .forEach((el) => (el.style.borderColor = "#ccc"));

  for (const [key, message] of Object.entries(errors)) {
    const inputId =
      key === "fullName"
        ? "profileFullName"
        : key === "mobile"
          ? "profileMobile"
          : "profileAge";
    const input = document.getElementById(inputId);

    input.style.borderColor = "red"; // Visual feedback: red border
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-msg";
    errorDiv.style.color = "red";
    errorDiv.style.fontSize = "11px";
    errorDiv.innerText = message;
    input.parentNode.appendChild(errorDiv);
  }
};

if (updateProfileBtn) {
  updateProfileBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const errors = validateProfile();

    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      return;
    }

    // Loading state
    updateProfileBtn.disabled = true;
    updateProfileBtn.innerText = "Updating...";

    const token = localStorage.getItem("user_token");
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append(
      "full_name",
      document.getElementById("profileFullName").value,
    );
    formData.append(
      "mobile_number",
      document.getElementById("profileMobile").value.replace(/\s/g, ""),
    );
    formData.append("age", document.getElementById("profileAge").value);

    const avatarInput = document.getElementById("profileAvatarInput");
    if (avatarInput.files[0]) {
      formData.append("avatar", avatarInput.files[0]);
    }

    try {
      const response = await fetch(
        "https://api.redclass.redberryinternship.ge/api/profile",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        alert("Profile updated successfully 🎉");

        const avatarInput = document.getElementById("profileAvatarInput");
        if (avatarInput && avatarInput.files[0]) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const headerAvatar = document.getElementById("headerAvatar");
            if (headerAvatar) headerAvatar.src = e.target.result;

            const profilePreview = document.getElementById("profilePreviewImg");
            if (profilePreview) profilePreview.src = e.target.result;

            const nameInput = document.getElementById("profileFullName");
            const nameDisplay = document.getElementById("profileNameDisplay");
            if (nameInput && nameDisplay)
              nameDisplay.innerText = nameInput.value;
          };
          reader.readAsDataURL(avatarInput.files[0]);
        }
      } else {
        const apiErrors = await response.json();
        alert(apiErrors.message || "შეცდომა სერვერზე");
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      updateProfileBtn.disabled = false;
      updateProfileBtn.innerText = "Update Profile";
    }
  });
}

document.addEventListener("DOMContentLoaded", fetchUserProfile);
