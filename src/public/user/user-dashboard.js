document.addEventListener("DOMContentLoaded", function () {
  // Check session and load user data
  checkUserSession();

  // Setup dropdown menu toggle
  const userDropdownToggle = document.getElementById("user-dropdown-toggle");
  const userDropdown = document.getElementById("user-dropdown");

  userDropdownToggle.addEventListener("click", function () {
    userDropdown.classList.toggle("active");
  });

  // Close dropdown when clicking elsewhere
  document.addEventListener("click", function (event) {
    if (
      !userDropdownToggle.contains(event.target) &&
      !userDropdown.contains(event.target)
    ) {
      userDropdown.classList.remove("active");
    }
  });

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      logoutUser();
    });
  }
});

/**
 * Check if user is logged in and get session data
 */
function checkUserSession() {
  fetch("../../php/check_session.php")
    .then((response) => response.json())
    .then((data) => {
      if (!data.logged_in) {
        // Redirect to login page if not logged in
        window.location.href = "../login/login.html";
        return;
      }

      if (data.is_admin) {
        // Redirect to admin dashboard if admin
        window.location.href = "../admin/dashboard.php";
        return;
      }

      // Update UI with username
      document.getElementById("username-display").textContent = data.username;

      // Update avatar with first letter of username
      if (data.username) {
        document.getElementById("user-avatar").textContent = data.username
          .charAt(0)
          .toUpperCase();
      }

      // Load user events (this would be implemented to fetch actual event data)
      // loadUserEvents();
    })
    .catch((error) => {
      console.error("Error checking session:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to check session. Please try again.",
        icon: "error",
        confirmButtonColor: "#573b8a",
      });
    });
}

/**
 * Load user events (placeholder function)
 */
function loadUserEvents() {
  // This would be implemented to fetch actual event data from the server
  // For now, we're using the hardcoded events in the HTML
  // Example implementation:
  /*
    fetch('get_events.php')
        .then(response => response.json())
        .then(events => {
            const eventsContainer = document.getElementById('events-container');
            eventsContainer.innerHTML = '';
            
            events.forEach(event => {
                const eventCard = createEventCard(event);
                eventsContainer.appendChild(eventCard);
            });
        })
        .catch(error => {
            console.error('Error loading events:', error);
        });
    */
}

/**
 * Create an event card element (placeholder function)
 */
function createEventCard(event) {
  // This would create and return a DOM element for an event
  // For now, we're using the hardcoded events in the HTML
}

function logoutUser() {
  fetch("../../php/logout.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        Swal.fire({
          title: "Success",
          text: data.message || "Logged out successfully",
          icon: "success",
          confirmButtonColor: "#573b8a",
          timer: 1500,
          timerProgressBar: true,
          willClose: () => {
            window.location.href = "../login/login.html";
          },
        });
      } else {
        throw new Error(data.message || "Logout failed");
      }
    })
    .catch((error) => {
      console.error("Error during logout:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to logout. Please try again.",
        icon: "error",
        confirmButtonColor: "#573b8a",
      });
    });
}
