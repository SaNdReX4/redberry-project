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
        window.currentUser = result.data;
        updateProfileUI(result.data);
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

// ლოგინის მოდალის გახსნა
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

    document.querySelectorAll(".Weekly-Schedule").forEach((item) => {
      if (item !== parent) {
        item.classList.remove("open");
      }
    });

    parent.classList.toggle("open");
  });
});

// მარცხენა ფეჩი დეტალებზე
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("id");

let currentBasePrice = 0;
let selectedScheduleId = null;
let selectedTimeSlotId = null;
let selectedCourseScheduleId = null; // POST-ისთვის საჭირო courseScheduleId
let selectedPriceModifier = 0;

async function initPage() {
  if (!courseId) return;

  try {
    const res = await fetch(`${API_URL}/courses/${courseId}`);
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

    // შევამოწმოთ მომხმარებელი უკვე ჩაწერილია თუ არა
    await checkEnrollmentStatus();

    fetchSchedules();
  } catch (err) {
    console.error("Error:", err);
  }
}

// შევამოწმოთ enrollment სტატუსი
async function checkEnrollmentStatus() {
  const token = localStorage.getItem("user_token");
  if (!token || token === "null" || token === "undefined") return;

  try {
    const res = await fetch(`${API_URL}/enrollments`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status !== 200) return;

    const { data } = await res.json();
    const enrollment = data.find(
      (e) => String(e.course.id) === String(courseId),
    );

    if (enrollment) {
      showEnrolledView(enrollment);
    }
  } catch (err) {
    console.error("Enrollment check error:", err);
  }
}

// ჩაწერილი ვიუ
function showEnrolledView(enrollment) {
  currentEnrollmentId = enrollment.id;
  const invisibleOne = document.querySelector(".invisible-one");
  const courseCard = document.getElementById("enrolled-card");

  if (invisibleOne) invisibleOne.style.display = "none";
  if (!courseCard) return;

  courseCard.style.display = "block";

  // badge
  const badge = courseCard.querySelector(".badge");
  if (badge) {
    if (enrollment.progress >= 100) {
      badge.textContent = "Completed";
      badge.style.backgroundColor = "#d1fae5";
      badge.style.color = "#16a34a";
    } else {
      badge.textContent = "Enrolled";
      badge.style.backgroundColor = "#eeedfc";
      badge.style.color = "#736bea";
    }
  }

  // განრიგი
  const schedule = enrollment.schedule;
  if (schedule) {
    const infoItems = courseCard.querySelectorAll(".info-item span:last-child");
    if (infoItems[0] && schedule.weeklySchedule)
      infoItems[0].textContent = schedule.weeklySchedule.label;
    if (infoItems[1] && schedule.timeSlot)
      infoItems[1].textContent = schedule.timeSlot.label;
    if (infoItems[2] && schedule.sessionType)
      infoItems[2].textContent = schedule.sessionType.name;
    if (infoItems[3]) infoItems[3].textContent = schedule.location || "Online";
  }

  // პროგრესი
  const progressText = courseCard.querySelector(".progress-text");
  const progressFill = courseCard.querySelector(".progress-fill");
  if (progressText)
    progressText.textContent = `${enrollment.progress}% Complete`;
  if (progressFill) progressFill.style.width = `${enrollment.progress}%`;

  // Complete ღილაკი
  const completeBtn = courseCard.querySelector(".complete-btn");
  if (completeBtn) {
    if (enrollment.progress >= 100) {
      completeBtn.innerHTML = `Retake Course <span class="check">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24.375 5.68756V10.5626C24.375 10.7781 24.2894 10.9847 24.137 11.1371C23.9846 11.2895 23.778 11.3751 23.5625 11.3751H18.6875C18.472 11.3751 18.2653 11.2895 18.113 11.1371C17.9606 10.9847 17.875 10.7781 17.875 10.5626C17.875 10.3471 17.9606 10.1404 18.113 9.98804C18.2653 9.83567 18.472 9.75006 18.6875 9.75006H21.4703L18.7698 7.276L18.7444 7.25163C17.6151 6.12275 16.1782 5.35165 14.6132 5.03466C13.0482 4.71768 11.4245 4.86885 9.94488 5.46931C8.4653 6.06976 7.19545 7.09287 6.29396 8.41082C5.39246 9.72878 4.8993 11.2831 4.87607 12.8798C4.85284 14.4764 5.30057 16.0444 6.16334 17.388C7.02611 18.7317 8.26566 19.7913 9.72714 20.4345C11.1886 21.0778 12.8072 21.2761 14.3808 21.0048C15.9544 20.7335 17.4131 20.0045 18.5748 18.909C18.7314 18.7608 18.9405 18.681 19.156 18.687C19.3715 18.693 19.5758 18.7843 19.7239 18.941C19.8721 19.0976 19.9519 19.3067 19.9459 19.5222C19.9399 19.7377 19.8486 19.942 19.6919 20.0901C17.8856 21.8032 15.4894 22.7557 13 22.7501H12.8659C11.2691 22.7282 9.70209 22.3144 8.30262 21.5451C6.90315 20.7758 5.71408 19.6745 4.83991 18.338C3.96573 17.0016 3.43323 15.4708 3.28919 13.8804C3.14515 12.2899 3.394 10.6884 4.01385 9.21661C4.6337 7.74484 5.60558 6.44785 6.84407 5.43964C8.08256 4.43144 9.54975 3.74288 11.1167 3.43449C12.6836 3.12611 14.3023 3.20733 15.8304 3.67103C17.3586 4.13472 18.7495 4.96669 19.8808 6.09381L22.75 8.71413V5.68756C22.75 5.47207 22.8356 5.26541 22.988 5.11304C23.1403 4.96067 23.347 4.87506 23.5625 4.87506C23.778 4.87506 23.9846 4.96067 24.137 5.11304C24.2894 5.26541 24.375 5.47207 24.375 5.68756Z" fill="#FFFFFF"/>
        </svg>
      </span>`;
    }
  }
}

async function fetchSchedules() {
  try {
    const res = await fetch(`${API_URL}/courses/${courseId}/weekly-schedules`);
    const { data } = await res.json();
    const container = document.getElementById("weeklySchedulesContainer");
    if (!container) return;

    container.innerHTML = data
      .map(
        (s) => `
      <div class="Weekly-Schedule-boxs" onclick="selectSchedule(${s.id}, this)">
        <p>${s.label}</p>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    console.error("Schedules fetch error:", err);
  }
}

window.selectSchedule = async (id, btn) => {
  selectedScheduleId = id;
  selectedTimeSlotId = null;
  selectedCourseScheduleId = null;
  selectedPriceModifier = 0;
  highlightBtn("weeklySchedulesContainer", btn);

  // time slots და session types გავასუფთავოთ
  document.getElementById("timeSlotsContainer").innerHTML = "";
  document.getElementById("sessionTypesContainer").innerHTML = "";
  updateEnrollBtn();

  const res = await fetch(
    `${API_URL}/courses/${courseId}/time-slots?weekly_schedule_id=${id}`,
  );
  const { data } = await res.json();
  const container = document.getElementById("timeSlotsContainer");
  if (!container) return;

  container.innerHTML = data
    .map(
      (t) => `
    <div class="Time-Slot-boxs" onclick="selectTime(${t.id}, this)">
      <div class="Time-Slot-boxs-text">
        <h5>${t.label}</h5>
        <p>${t.range || ""}</p>
      </div>
    </div>
  `,
    )
    .join("");
};

window.selectTime = async (timeId, btn) => {
  selectedTimeSlotId = timeId;
  selectedCourseScheduleId = null;
  selectedPriceModifier = 0;
  highlightBtn("timeSlotsContainer", btn);

  document.getElementById("sessionTypesContainer").innerHTML = "";
  updateEnrollBtn();

  const res = await fetch(
    `${API_URL}/courses/${courseId}/session-types?weekly_schedule_id=${selectedScheduleId}&time_slot_id=${timeId}`,
  );
  const { data } = await res.json();
  const container = document.getElementById("sessionTypesContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="Session-Type-wrapper-container">
    <div class="Session-Type-wrapper">
      ${data
        .map(
          (st) => `
        <div class="Session-Type-boxs ${st.availableSeats === 0 ? "disabled" : ""}" 
             onclick="${st.availableSeats > 0 ? `selectSessionType(${st.courseScheduleId}, ${st.priceModifier}, this)` : ""}">
            <h4>${st.name}</h4>
            <p>${st.availableSeats === 0 ? "Fully Booked" : st.availableSeats + " seats left"}</p>
            <span>+ $${st.priceModifier}</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
};

// Session Type არჩევა - ახლა courseScheduleId ვინახავთ
window.selectSessionType = (courseScheduleId, priceModifier, el) => {
  selectedCourseScheduleId = courseScheduleId;
  selectedPriceModifier = priceModifier;

  const modDisplay = document.getElementById("modifierDisplay");
  if (modDisplay) modDisplay.textContent = `+ $${priceModifier}`;

  document.getElementById("totalPriceDisplay").textContent =
    `$${currentBasePrice + priceModifier}`;

  highlightBtn("sessionTypesContainer", el);
  updateEnrollBtn();
};

// ძველი updatePrice ფუნქცია - უკუ თავსებადობისთვის
window.updatePrice = window.selectSessionType;

// Enroll ღილაკის სტატუსი
function updateEnrollBtn() {
  const enrollBtn = document.getElementById("enrollBtn");
  if (!enrollBtn) return;

  if (selectedCourseScheduleId !== null) {
    enrollBtn.disabled = false;
    enrollBtn.style.opacity = "1";
    enrollBtn.style.backgroundColor = "#4f46e5";
    enrollBtn.style.color = "#ffffff";
  } else {
    enrollBtn.disabled = true;
    enrollBtn.style.opacity = "0.5";
    enrollBtn.style.backgroundColor = "#eeedfc";
    enrollBtn.style.color = "#b7b3f4";
  }
}

function highlightBtn(containerId, activeEl) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container
    .querySelectorAll(
      ".Weekly-Schedule-boxs, .Time-Slot-boxs, .Session-Type-boxs",
    )
    .forEach((el) => el.classList.remove("active"));

  activeEl.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  initPage();

  // Enroll Now ღილაკი - ID გასწორებულია
  const enrollBtn = document.getElementById("enrollBtn");
  const invisibleOne = document.querySelector(".invisible-one");
  const courseCard = document.getElementById("enrolled-card");

  if (enrollBtn) {
    enrollBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("user_token");

      // არ არის ავტორიზებული
      if (!token || token === "null" || token === "undefined") {
        const loginModal = document.getElementById("loginModal");
        if (loginModal) loginModal.style.display = "flex";
        return;
      }

      // არ არის courseScheduleId არჩეული
      if (!selectedCourseScheduleId) {
        alert("გთხოვთ აირჩიოთ კვირის განრიგი, დრო და სესიის ტიპი.");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/enrollments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseId: parseInt(courseId),
            courseScheduleId: selectedCourseScheduleId,
            force: false,
          }),
        });

        const result = await res.json();

        if (res.status === 200 || res.status === 201) {
          // წარმატებული ჩაწერა
          showEnrolledView(result.data);
        } else if (res.status === 409) {
          // Schedule conflict
          const conflict = result.conflicts && result.conflicts[0];
          const conflictMsg = conflict
            ? `თქვენ უკვე ჩაწერილი ხართ კურს "${conflict.conflictingCourseName}"-ზე იგივე განრიგით: ${conflict.schedule}`
            : "განრიგის კონფლიქტი აღმოჩენილია.";

          const confirmed = confirm(
            conflictMsg + "\n\nგსურთ მაინც გააგრძელოთ?",
          );
          if (confirmed) {
            // force: true-ით ხელახლა გავაგზავნოთ
            const forceRes = await fetch(`${API_URL}/enrollments`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                courseId: parseInt(courseId),
                courseScheduleId: selectedCourseScheduleId,
                force: true,
              }),
            });

            const forceResult = await forceRes.json();
            if (forceRes.status === 200 || forceRes.status === 201) {
              showEnrolledView(forceResult.data);
            } else {
              alert(forceResult.message || "შეცდომა მოხდა.");
            }
          }
        } else if (res.status === 401) {
          // არ არის ავტორიზებული
          localStorage.removeItem("user_token");
          updateAuthUI(false);
          const loginModal = document.getElementById("loginModal");
          if (loginModal) loginModal.style.display = "flex";
        } else if (res.status === 422) {
          // validation error - პროფილი არ არის შევსებული
          const msg =
            result.message ||
            "პროფილი სრულად არ არის შევსებული. გთხოვთ შეავსოთ პროფილი.";
          alert(msg);
          // redirect პროფილზე
          const completeProfileBtn =
            document.getElementById("complete-profile");
          if (completeProfileBtn) completeProfileBtn.click();
        } else {
          alert(result.message || "შეცდომა მოხდა. სცადეთ ხელახლა.");
        }
      } catch (err) {
        console.error("Enrollment error:", err);
        alert("ქსელის შეცდომა. სცადეთ ხელახლა.");
      }
    });
  }

  // Complete Course ღილაკი
  const completeBtn = document.querySelector(".complete-btn");

  if (completeBtn) {
    completeBtn.addEventListener("click", async function () {
      const token = localStorage.getItem("user_token");

      // თუ უკვე დასრულებულია → Retake
      if (this.classList.contains("retake")) {
        const confirmDelete = confirm("ნამდვილად გინდა თავიდან დაწყება?");
        if (!confirmDelete) return;

        try {
          const res = await fetch(
            `${API_URL}/enrollments/${currentEnrollmentId}`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (res.status === 204) {
            document.querySelector(".invisible-one").style.display = "block";
            document.getElementById("enrolled-card").style.display = "none";

            // reset state
            selectedCourseScheduleId = null;
            updateEnrollBtn();
          }
        } catch (err) {
          console.error(err);
        }

        return;
      }

      //  თუ ჯერ არ არის დასრულებული → Complete
      const progressText = document.querySelector(".progress-text");
      const progressFill = document.querySelector(".progress-fill");
      const badge = document.querySelector(".badge");

      if (progressText) progressText.textContent = `100% Complete`;
      if (progressFill) progressFill.style.width = `100%`;

      if (badge) {
        badge.textContent = "Completed";
        badge.style.backgroundColor = "#d1fae5";
        badge.style.color = "#16a34a";
      }

      // ღილაკის შეცვლა Retake-ზე
      this.innerHTML = `Retake Course`;
      this.classList.add("retake");
    });
  }
});

// ენროლის დროს ვამომებ აქვს თუ არა პროფაილზე ყველაფერი შევსებული

function isProfileComplete(user) {
  if (!user) return false;

  if (typeof user.profileComplete === "boolean") {
    return user.profileComplete;
  }

  // fallback
  const name = (user.fullName || user.name || "").trim();
  const phone = (user.mobileNumber || user.mobile || user.phone || "").trim();
  const age = Number(user.age);

  return name.length > 0 && phone.length > 0 && age > 0;
}

const completeProfileBtn = document.getElementById("complete-profile");

if (completeProfileBtn) {
  completeProfileBtn.addEventListener("click", () => {
    const user = window.currentUser;

    //  NOT LOGGED IN → SIGN IN MODAL
    if (!user) {
      const loginModal = document.getElementById("loginModal");
      if (loginModal) loginModal.style.display = "flex";
      return;
    }

    //  INCOMPLETE → PROFILE MODAL
    if (!isProfileComplete(user)) {
      const profileModal = document.getElementById("profileModal");
      if (profileModal) profileModal.style.display = "flex";
      return;
    }
  });
}

document
  .getElementById("profileUpdateForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // წარმატების შემდეგ:

    const updatedUser = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("user_token")}`,
      },
    }).then((r) => r.json());

    window.currentUser = updatedUser.data;

    updateProfileUI(updatedUser.data);

    document.getElementById("profileModal").style.display = "none";
  });

document.addEventListener("DOMContentLoaded", () => {
  const profileModal = document.getElementById("profileModal");
  const avatarBtn = document.getElementById("headerAvatar"); // ან შენი avatar id

  if (!profileModal || !avatarBtn) return;

  avatarBtn.addEventListener("click", () => {
    profileModal.style.display = "flex";
  });
});

function updateProfileUI(user) {
  const warningBox = document.querySelector(".Complete-Your-Profile");
  if (!warningBox) return;

  const title = warningBox.querySelector("h2");
  const button = warningBox.querySelector("#complete-profile p");

  //  REAL AUTH CHECK
  const token = localStorage.getItem("user_token");
  const isLoggedIn = token && token !== "null" && token !== "undefined";

  //  NOT LOGGED IN
  if (!isLoggedIn || !user) {
    warningBox.style.display = "flex";

    if (title) title.textContent = "Authentication Required";
    if (button) button.textContent = "Sign in";

    return;
  }

  //  LOGGED IN BUT INCOMPLETE
  if (!isProfileComplete(user)) {
    warningBox.style.display = "flex";

    if (title) title.textContent = "Complete Your Profile";
    if (button) button.textContent = "Complete";

    return;
  }

  //  COMPLETE
  warningBox.style.display = "none";
}

window.addEventListener("load", async () => {
  const token = localStorage.getItem("user_token");

  if (!token || token === "null") {
    window.currentUser = null;
    updateProfileUI(null);
    return;
  }

  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) {
    window.currentUser = null;
    updateProfileUI(null);
    return;
  }

  const data = await res.json();
  window.currentUser = data.data;

  updateProfileUI(window.currentUser);
});
