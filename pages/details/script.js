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

// დეტალების გვერდის მარჯვენა მხარის ქარდების აკეცვა ჩამოშლის ფუნქცია
document.querySelectorAll(".Weekly-Schedule-header").forEach((header) => {
  header.addEventListener("click", () => {
    const parent = header.parentElement;

    // ეს არის როცა ერთი სექცია გახსნილი მაქ და სხვა სექციას ვქხნი ის გახსნილი სექცია იხურება თავისით და საბოლოოდ მარტო ერთი გახსნილი სექცია მრჩება
    document.querySelectorAll(".Weekly-Schedule").forEach((item) => {
      if (item !== parent) {
        item.classList.remove("open");
      }
    });

    parent.classList.toggle("open");
  });
});

// მარცხენა ფეჩი დეტალებზეე

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("id");

let currentBasePrice = 0;
let selectedScheduleId = null;

async function initPage() {
  if (!courseId) return;

  try {
    const res = await fetch(
      `https://api.redclass.redberryinternship.ge/api/courses/${courseId}`,
    );
    const { data } = await res.json();

    document.getElementById("courseTitle").textContent = data.title;
    document.getElementById("courseBanner").src = data.image;
    document.getElementById("courseWeeks").textContent =
      `${data.durationWeeks} Weeks`;
    document.getElementById("instructorName").textContent =
      data.instructor.name;
    document.getElementById("instructorAvatar").src = data.instructor.avatar;
    document.getElementById("courseDescription").innerHTML =
      `<p>${data.description}</p>`;
    document.getElementById("courseCategoryName").textContent =
      data.category.name;

    const ratingEl = document.getElementById("courseRating");
    if (ratingEl) {
      ratingEl.textContent = data.rating || "4.9";
    }

    const topicEl = document.getElementById("courseTopicName");
    if (topicEl && data.topic) {
      topicEl.innerHTML = `<img src="../../assets/icons/Icon_Set2 (1).svg" alt="" /> ${data.topic.name}`;
    }

    currentBasePrice = data.basePrice;
    const basePriceEl = document.getElementById("basePriceDisplay");
    if (basePriceEl) basePriceEl.textContent = `$${data.basePrice}`;

    document.getElementById("totalPriceDisplay").textContent =
      `$${data.basePrice}`;

    fetchSchedules();
  } catch (err) {
    console.error("Error:", err);
  }
}

async function fetchSchedules() {
  try {
    const res = await fetch(
      `https://api.redclass.redberryinternship.ge/api/courses/${courseId}/weekly-schedules`,
    );
    const { data } = await res.json();

    const container = document.getElementById("weeklySchedulesContainer");
    if (!container) return;

    container.innerHTML = data
      .map(
        (s) => `
          <button class="opt-btn" onclick="selectSchedule(${s.id}, this)">${s.label}</button>
      `,
      )
      .join("");
  } catch (err) {
    console.error("Schedules fetch error:", err);
  }
}

window.selectSchedule = async (id, btn) => {
  selectedScheduleId = id;
  highlightBtn("weeklySchedulesContainer", btn);

  const res = await fetch(
    `https://api.redclass.redberryinternship.ge/api/courses/${courseId}/time-slots?weekly_schedule_id=${id}`,
  );
  const { data } = await res.json();

  const container = document.getElementById("timeSlotsContainer");
  if (!container) return;

  container.innerHTML = data
    .map(
      (t) => `
        <button class="opt-btn" onclick="selectTime(${t.id}, this)">${t.label}</button>
    `,
    )
    .join("");
  document.getElementById("sessionTypesContainer").innerHTML = "";
};

window.selectTime = async (timeId, btn) => {
  highlightBtn("timeSlotsContainer", btn);

  const res = await fetch(
    `https://api.redclass.redberryinternship.ge/api/courses/${courseId}/session-types?weekly_schedule_id=${selectedScheduleId}&time_slot_id=${timeId}`,
  );
  const { data } = await res.json();

  const container = document.getElementById("sessionTypesContainer");
  if (!container) return;

  container.innerHTML = data
    .map(
      (st) => `
        <div class="session-card ${st.availableSeats === 0 ? "disabled" : ""}" 
             onclick="${st.availableSeats > 0 ? `updatePrice(${st.priceModifier}, this)` : ""}">
            <p>${st.name}</p>
            <small>${st.availableSeats} seats left</small>
            <b>+ $${st.priceModifier}</b>
        </div>
    `,
    )
    .join("");
};

window.updatePrice = (mod, el) => {
  const modDisplay = document.getElementById("modifierDisplay");
  if (modDisplay) modDisplay.textContent = `+ $${mod}`;

  document.getElementById("totalPriceDisplay").textContent =
    `$${currentBasePrice + mod}`;

  const enrollBtn = document.getElementById("enrollBtn");
  if (enrollBtn) enrollBtn.disabled = false;

  highlightBtn("sessionTypesContainer", el);
};

function highlightBtn(containerId, activeEl) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container
    .querySelectorAll(".opt-btn, .session-card")
    .forEach((el) => el.classList.remove("active"));
  activeEl.classList.add("active");
}

document.addEventListener("DOMContentLoaded", initPage);
