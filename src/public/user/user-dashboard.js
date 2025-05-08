document.addEventListener("DOMContentLoaded", function () {
  // Check session and load user data
  checkUserSession();

  // Initialize toastr notification library
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 3000,
  };

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

  loadUserEvents(1);
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

function loadUserEvents(page = 1, search = "") {
  // Show loading state
  const eventsContainer = document.getElementById("events-container");
  eventsContainer.innerHTML = '<div class="loading">Loading events...</div>';

  // Build query parameters
  const params = new URLSearchParams();
  params.append("page", page);
  if (search) {
    params.append("search", search);
  }

  // Fetch events from the server
  fetch(`../../php/events/get_events_dashboard.php?${params.toString()}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.status === "success") {
        displayEvents(data.events);
        setupPagination(data.pagination);
      } else {
        eventsContainer.innerHTML = `<div class="error-message">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  ${data.message || "Failed to load events"}
              </div>`;
      }
    })
    .catch((error) => {
      console.error("Error loading events:", error);
      eventsContainer.innerHTML = `<div class="error-message">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Error loading events. Please try again later.
          </div>`;
    });
}

function displayEvents(events) {
  const eventsContainer = document.getElementById("events-container");
  eventsContainer.innerHTML = "";

  if (events.length === 0) {
    eventsContainer.innerHTML = `<div class="no-events">
          <i class="fa-solid fa-calendar-xmark"></i>
          <p>No events found</p>
      </div>`;
    return;
  }

  events.forEach((event) => {
    const eventCard = createEventCard(event);
    eventsContainer.appendChild(eventCard);
  });
}

function createEventCard(event) {
  const eventDate = new Date(event.event_date);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString("default", { month: "short" });

  const hasImage = event.images && event.images.length > 0;
  const imageSource = hasImage
    ? `data:${event.images[0].image_type};base64,${event.images[0].Image_data}`
    : null;

  const imageHTML = hasImage
    ? `<img src="${imageSource}" alt="${event.event_title}" />`
    : `<div class="event-image-placeholder"><i class="fa-solid fa-image fa-3x"></i></div>`;

  const card = document.createElement("div");
  card.className = "event-card";

  card.innerHTML = `
    <div class="event-image">
        ${imageHTML}
        <div class="event-date">
            <span class="day">${day}</span>
            <span class="month">${month}</span>
        </div>
        <button class="heart-btn" data-event-id="${event.event_id}">
            <i class="fa-regular fa-heart"></i>
        </button>
    </div>
    <div class="event-details">
        <h3>${event.event_title}</h3>
        <p class="event-location">
            <i class="fa-solid fa-location-dot"></i> ${event.location}
        </p>
        <p class="event-time">
            <i class="fa-regular fa-clock"></i> ${formatTime(eventDate)}
        </p>
        <div class="event-categories">
            ${renderCategories(event.categories)}
        </div>
        <button class="view-details-btn" data-event-id="${event.event_id}">
            View Details
        </button>
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    card.querySelector(".heart-btn").addEventListener("click", function () {
      likeEvent(event.event_id, this);
    });

    card
      .querySelector(".view-details-btn")
      .addEventListener("click", function () {
        viewEventDetails(event.event_id);
      });
  }, 0);

  return card;
}

function renderCategories(categories) {
  if (!categories || categories.length === 0) {
    return "";
  }

  return categories
    .map(
      (category) =>
        `<span class="category-badge">${category.category_name}</span>`
    )
    .join("");
}

function formatTime(date) {
  return date.toLocaleString("default", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

function setupPagination(pagination) {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;

  const { currentPage, totalPages } = pagination;

  let paginationHTML = '<div class="pagination-controls">';

  // Previous button
  paginationHTML += `<button class="page-btn prev-btn" ${
    currentPage <= 1 ? "disabled" : ""
  } 
      data-page="${currentPage - 1}">
      <i class="fa-solid fa-chevron-left"></i> Previous
  </button>`;

  // Page numbers
  paginationHTML += '<div class="page-numbers">';

  // First page
  if (currentPage > 3) {
    paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
    if (currentPage > 4) {
      paginationHTML += '<span class="page-ellipsis">...</span>';
    }
  }

  // Page numbers around current page
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    paginationHTML += `<button class="page-btn ${
      i === currentPage ? "active" : ""
    }" 
          data-page="${i}">${i}</button>`;
  }

  // Last page
  if (currentPage < totalPages - 2) {
    if (currentPage < totalPages - 3) {
      paginationHTML += '<span class="page-ellipsis">...</span>';
    }
    paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  paginationHTML += "</div>";

  // Next button
  paginationHTML += `<button class="page-btn next-btn" ${
    currentPage >= totalPages ? "disabled" : ""
  } 
      data-page="${currentPage + 1}">
      Next <i class="fa-solid fa-chevron-right"></i>
  </button>`;

  paginationHTML += "</div>";

  paginationContainer.innerHTML = paginationHTML;

  // Add event listeners to pagination buttons
  const pageButtons = paginationContainer.querySelectorAll(".page-btn");
  pageButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (this.hasAttribute("disabled")) return;

      const pageNumber = parseInt(this.getAttribute("data-page"));
      const searchTerm = document.querySelector(".search-bar input").value;
      loadUserEvents(pageNumber, searchTerm);

      // Scroll to top of events section
      document
        .querySelector(".main-content")
        .scrollIntoView({ behavior: "smooth" });
    });
  });
}

function likeEvent(eventId, heartButton) {
  const heartIcon = heartButton.querySelector("i");
  const isLiked = heartIcon.classList.contains("fa-solid");

  // Determine the action (like or unlike)
  const action = isLiked ? "unlike" : "like";

  fetch("../../php/events/like_event.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, action }),
    credentials: "same-origin", // Include session cookies
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.status === "success" || data.status === "info") {
        heartIcon.className = isLiked
          ? "fa-regular fa-heart"
          : "fa-solid fa-heart";

        if (action === "like") {
          toastr.success("Event added to your likes!");
        } else {
          toastr.info("Event removed from your likes");
        }
      } else {
        heartIcon.className = isLiked
          ? "fa-solid fa-heart"
          : "fa-regular fa-heart";
        toastr.error(data.message || "Failed to process request");
      }
    })
    .catch((error) => {
      console.error("Error processing like/unlike:", error);
      heartIcon.className = isLiked
        ? "fa-solid fa-heart"
        : "fa-regular fa-heart";
      toastr.error("Failed to process request. Please try again.");
    });
}

function viewEventDetails(eventId) {
  window.location.href = `event-details.php?id=${eventId}`;
}

function performSearch(searchTerm) {
  loadUserEvents(1, searchTerm); // Reset to page 1 when searching
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
