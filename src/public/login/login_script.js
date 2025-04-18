document.addEventListener("DOMContentLoaded", function () {
  // Tab Switching Logic
  const loginTab = document.getElementById("login-tab");
  const signupTab = document.getElementById("signup-tab");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  if (loginTab && signupTab && loginForm && signupForm) {
    loginTab.addEventListener("click", () => {
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
      loginForm.classList.add("active");
      signupForm.classList.remove("active");
    });

    signupTab.addEventListener("click", () => {
      signupTab.classList.add("active");
      loginTab.classList.remove("active");
      signupForm.classList.add("active");
      loginForm.classList.remove("active");
    });
  }

  // Password Toggles
  const passwordToggles = document.querySelectorAll(".password-toggle");
  passwordToggles.forEach((toggle) => {
    // Replace the text content with Font Awesome icon
    toggle.innerHTML = '<i class="fas fa-eye"></i>';

    toggle.addEventListener("click", function () {
      const passwordField = this.previousElementSibling;
      const type = passwordField.getAttribute("type");

      if (type === "password") {
        passwordField.setAttribute("type", "text");
        this.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Show slashed eye when password is visible
      } else {
        passwordField.setAttribute("type", "password");
        this.innerHTML = '<i class="fas fa-eye"></i>'; // Show regular eye when password is hidden
      }
    });
  });

  // Your existing signup form validation
  const signupFormElement = document.querySelector("#signup");
  if (signupFormElement) {
    signupFormElement.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Get all form fields
      const fullname = document.getElementById("signup-fullname");
      const username = document.getElementById("signup-username");
      const email = document.getElementById("signup-email");
      const password = document.getElementById("signup-password");
      const confirmPassword = document.getElementById(
        "signup-confirm-password"
      );

      // Clear all error messages
      document.querySelectorAll(".error-message").forEach((el) => {
        el.style.display = "none";
      });

      let hasError = false;

      // Validate Full Name
      if (!fullname.value.trim()) {
        document.getElementById("signup-fullname-error").style.display =
          "block";
        fullname.style.borderColor = "#e74c3c";
        hasError = true;
      }

      // Validate Username
      if (!username.value.trim() || username.value.trim().length < 3) {
        document.getElementById("signup-username-error").style.display =
          "block";
        username.style.borderColor = "#e74c3c";
        hasError = true;
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        document.getElementById("signup-email-error").style.display = "block";
        email.style.borderColor = "#e74c3c";
        hasError = true;
      }

      // Validate Password
      if (!password.value || password.value.length < 8) {
        document.getElementById("signup-password-error").style.display =
          "block";
        password.style.borderColor = "#e74c3c";
        hasError = true;
      }

      // Validate Confirm Password
      if (!confirmPassword.value || confirmPassword.value !== password.value) {
        document.getElementById("signup-confirm-password-error").style.display =
          "block";
        confirmPassword.style.borderColor = "#e74c3c";
        hasError = true;
      }

      // If validation passes
      if (!hasError) {
        const data = {
          username: username.value,
          fullname: fullname.value,
          email: email.value,
          password: password.value,
        };

        console.log("Form data:", JSON.stringify(data));

        // Your form submission logic here
        // Similar to your commented out code in the previous example

        // Your commented out fetch code remains unchanged
        try {
          const response = await fetch("../../php/register.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const result = await response.json();
          console.log("result \n", result);

          if (result["status"] === "success") {
            Swal.fire({
              icon: "success",
              title: "Account created!",
              text: "You have successfully registered.",
            }).then(function () {
              window.location = "../../index.html";
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: result.message,
            });
          }
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!",
          });
          //alert("Something went wrong.");
        }
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Add login form handler
  const loginFormElement = document.querySelector("#login");

  if (loginFormElement) {
    loginFormElement.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      // const email = this.email.value.trim();
      // const password = this.pswd.value;

      let hasError = false;

      // Simple validation
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        hasError = true;
        document.getElementById("login-email-error").style.display = "block";
      }

      if (!password) {
        hasError = true;
        document.getElementById("login-password-error").style.display = "block";
      }

      if (!hasError) {
        console.log("Login attempt:", { email, password });
        const data = {
          email,
          password,
        };

        console.log(JSON.stringify(data));
        try {
          const response = await fetch("../../php/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include", // IMPORTANT: allows sending/receiving session cookies
          });

          const result = await response.json();
          console.log("result \n", result);

          if (result["status"] === "success") {
            console.log("user logged: ");
            console.log("User is admin:", result.is_admin);
            if (result.is_admin) {
              window.location.href = "../admin/dashboard.html";
            } else {
              window.location.href = "../user/home.html";
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: result.message,
            });
          }
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!",
          });
        }
      }
    });
  }
});

// Add visual feedback to form inputs
const allInputs = document.querySelectorAll("input");
allInputs.forEach((input) => {
  input.addEventListener("focus", function () {
    this.style.borderColor = "#573b8a";
    this.style.boxShadow = "0 0 0 2px rgba(87, 59, 138, 0.2)";
  });

  input.addEventListener("blur", function () {
    this.style.borderColor = "";
    this.style.boxShadow = "";
  });
});
