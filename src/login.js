function handleApiErrors(errors, formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll(".input-group").forEach((group) => {
    group.classList.remove("error");
    const msg = group.querySelector(".error-msg");
    if (msg) msg.innerText = "";
  });

  // 2. ვამატებთ ახალ შეცდომებს
  for (const field in errors) {
    // ვეძებ ინპუტს პირდაპირი ID-ით  ან სახელის ნაწილით
    const input =
      form.querySelector(`#${field}`) ||
      form.querySelector(`input[id*="${field}"]`);

    if (input) {
      const container = input.closest(".input-group");

      if (container) {
        container.classList.add("error"); // ეს გააწითლებს Label-ს და Input-ს

        const errorMsg = container.querySelector(".error-msg");
        if (errorMsg) {
          errorMsg.innerText = errors[field][0];
        }
      }
    }
  }
}

//  ლოგინის ფორმის ლოგიკა
const loginForm = document.getElementById("loginForm");

loginForm.onsubmit = async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let localErrors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email.length < 3) {
    localErrors.loginEmail = ["Email must be at least 3 characters"];
  } else if (!emailRegex.test(email)) {
    localErrors.loginEmail = ["Please enter a valid email address"];
  }

  if (password.length < 3) {
    localErrors.loginPassword = ["Password must be at least 3 characters"];
  }

  // თუ ლოკალური შეცდომებია, API-ზე აღარ ვუშვებ
  if (Object.keys(localErrors).length > 0) {
    handleApiErrors(localErrors, "loginForm");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      // წარმატებული ავტორიზაცია
      const token = result.token || (result.data && result.data.token);

      if (token) {
        localStorage.setItem("user_token", token);

        // მოდალის დახურვა
        document.getElementById("loginModal").style.display = "none";

        // UI-ს განახლება ავატარი ნავიგაციაში
        if (typeof updateAuthUI === "function") {
          updateAuthUI(true, result.data);
        }

        location.reload();
      }
    } else {
      // ბექენდის ვალიდაციის შეცდომები
      if (response.status === 422 && result.errors) {
        handleApiErrors(result.errors, "loginForm");
      } else {
        handleApiErrors(
          {
            loginPassword: [result.message || "Invalid email or password"],
          },
          "loginForm",
        );
      }
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("Connection error. Please try again.");
  }
};

// ეს ეძებს ლოგინის ფორმის ყველა ინპუტს
const loginInputs = document.querySelectorAll("#loginForm input");

loginInputs.forEach((input) => {
  input.addEventListener("input", () => {
    const container = input.closest(".input-group");

    if (container.classList.contains("error")) {
      container.classList.remove("error");
    }
  });
});
