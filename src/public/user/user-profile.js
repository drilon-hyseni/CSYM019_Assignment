document.addEventListener("DOMContentLoaded", function () {
  // Load user profile data
  loadUserProfile();

  // Form submission handler
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateUserProfile();
    });
  }
});

/**
 * Load user profile data from API
 */
function loadUserProfile() {
  fetch("../../php/users/get_user_detail.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        populateUserData(data.user);
      } else {
        throw new Error(data.message || "Failed to load user data");
      }
    })
    .catch((error) => {
      console.error("Error loading user profile:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load profile data. Please try again.",
        icon: "error",
        confirmButtonColor: "#573b8a",
      });
    });
}

/**
 * Populate form with user data
 */
function populateUserData(user) {
  // Update profile header
  document.getElementById("profile-name-display").textContent = user.name;
  document.getElementById("profile-avatar-display").textContent = user.name
    .charAt(0)
    .toUpperCase();

  // Format created_at date
  const createdDate = new Date(user.created_at);
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById(
    "member-since"
  ).textContent = `Member since: ${formattedDate}`;

  // Update form fields
  document.getElementById("name").value = user.name;
  document.getElementById("username").value = user.username;
  document.getElementById("email").value = user.email;

  // Update username in navbar if available
  const usernameDisplay = document.getElementById("username-display");
  if (usernameDisplay) {
    usernameDisplay.textContent = user.username;
  }

  const userAvatar = document.getElementById("user-avatar");
  if (userAvatar) {
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
}

/**
 * Update user profile
 */
function updateUserProfile() {
  // Validate form first
  if (!validateProfileForm()) {
    return;
  }

  // Get form data
  const formData = new FormData(document.getElementById("profile-form"));

  fetch("../../php/users/update_user_profile.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        Swal.fire({
          title: "Success",
          text: "Profile updated successfully",
          icon: "success",
          confirmButtonColor: "#573b8a",
        }).then(() => {
          // Reload user data
          loadUserProfile();
        });
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to update profile. Please try again.",
        icon: "error",
        confirmButtonColor: "#573b8a",
      });
    });
}

/**
 * Validate profile form
 */
function validateProfileForm() {
  const name = document.getElementById("name").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm_password").value;

  // Check required fields
  if (!name || !username || !email) {
    Swal.fire({
      title: "Error",
      text: "Please fill in all required fields",
      icon: "error",
      confirmButtonColor: "#573b8a",
    });
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Swal.fire({
      title: "Error",
      text: "Please enter a valid email address",
      icon: "error",
      confirmButtonColor: "#573b8a",
    });
    return false;
  }
  if (password.length > 0 && password.length < 8) {
    Swal.fire({
      title: "Error",
      text: "Password length too short. Must be of size 8!",
      icon: "error",
      confirmButtonColor: "#573b8a",
    });
    return false;
  }

  // Check password match if entered
  if (password && password !== confirmPassword) {
    Swal.fire({
      title: "Error",
      text: "Passwords do not match",
      icon: "error",
      confirmButtonColor: "#573b8a",
    });
    return false;
  }

  return true;
}
