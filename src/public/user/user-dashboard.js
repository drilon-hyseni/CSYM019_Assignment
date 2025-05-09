document.addEventListener("DOMContentLoaded", function () {
  // Check session and load user data
  checkUserSession();

  // Initialize filter state
  const filters = {
    search: "",
    dateStart: null,
    dateEnd: null,
    categories: [],
    likedOnly: false,
  };

  // Initialize toastr notification library
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 3000,
  };

  // Setup navigation links
  const allEventsLink = document.getElementById("all-events-link");
  const likedEventsLink = document.getElementById("liked-events-link");

  allEventsLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (filters.likedOnly) {
      filters.likedOnly = false;
      allEventsLink.classList.add("active");
      likedEventsLink.classList.remove("active");
      document.getElementById("page-title").textContent = "Upcoming Events";
      updateFilterTags();
      loadUserEvents(1);
    }
  });

  likedEventsLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (!filters.likedOnly) {
      filters.likedOnly = true;
      likedEventsLink.classList.add("active");
      allEventsLink.classList.remove("active");
      document.getElementById("page-title").textContent = "Liked Events";
      updateFilterTags();
      loadUserEvents(1);
    }
  });

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

  // Setup logout
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      logoutUser();
    });
  }

  // Setup search functionality
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");

  searchButton.addEventListener("click", function () {
    filters.search = searchInput.value.trim();
    updateFilterTags();
    loadUserEvents(1);
  });

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      filters.search = searchInput.value.trim();
      updateFilterTags();
      loadUserEvents(1);
    }
  });

  // Initialize date range picker
  $("#date-range").daterangepicker({
    autoUpdateInput: false,
    locale: {
      cancelLabel: "Clear",
      format: "YYYY-MM-DD",
    },
  });

  $("#date-range").on("apply.daterangepicker", function (ev, picker) {
    $(this).val(
      picker.startDate.format("YYYY-MM-DD") +
        " to " +
        picker.endDate.format("YYYY-MM-DD")
    );
    filters.dateStart = picker.startDate.format("YYYY-MM-DD");
    filters.dateEnd = picker.endDate.format("YYYY-MM-DD");
    updateFilterTags();
    loadUserEvents(1);
  });

  $("#date-range").on("cancel.daterangepicker", function () {
    $(this).val("");
    clearDateFilter();
  });

  $("#clear-date-filter").on("click", function () {
    $("#date-range").val("");
    clearDateFilter();
  });

  function clearDateFilter() {
    filters.dateStart = null;
    filters.dateEnd = null;
    updateFilterTags();
    loadUserEvents(1);
  }

  // Initialize Select2 for categories
  $("#category-filter").select2({
    placeholder: "Select categories",
    allowClear: true,
    width: "100%",
  });

  // Load categories on init
  fetchCategories();

  // Handle category filter changes
  $("#category-filter").on("change", function () {
    filters.categories = $(this).val() || [];
    updateFilterTags();
    loadUserEvents(1);
  });

  // Load initial events
  loadUserEvents(1);

  /**
   * Loads events based on pagination and filter criteria
   */
  function loadUserEvents(page = 1) {
    // Show loading state
    const eventsContainer = document.getElementById("events-container");
    eventsContainer.innerHTML = '<div class="loading">Loading events...</div>';

    // Build query parameters
    const params = new URLSearchParams();
    params.append("page", page);

    if (filters.search) {
      params.append("search", filters.search);
    }

    if (filters.categories.length > 0) {
      filters.categories.forEach((categoryId) => {
        params.append("categories[]", categoryId);
      });
    }

    if (filters.dateStart) {
      params.append("date_start", filters.dateStart);
    }

    if (filters.dateEnd) {
      params.append("date_end", filters.dateEnd);
    }

    // Add liked_only parameter
    if (filters.likedOnly) {
      params.append("liked_only", "1");
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

  /**
   * Updates filter tag display
   */
  function updateFilterTags() {
    const filterTagsContainer = document.getElementById("filter-tags");
    filterTagsContainer.innerHTML = "";
    let hasActiveTags = false;

    // Add liked filter tag if active
    if (filters.likedOnly) {
      addFilterTag(filterTagsContainer, "Showing: Liked events only", () => {
        filters.likedOnly = false;
        allEventsLink.classList.add("active");
        likedEventsLink.classList.remove("active");
        document.getElementById("page-title").textContent = "Upcoming Events";
        updateFilterTags();
        loadUserEvents(1);
      });
      hasActiveTags = true;
    }

    // Add search filter tag if active
    if (filters.search) {
      addFilterTag(filterTagsContainer, "Search: " + filters.search, () => {
        document.getElementById("search-input").value = "";
        filters.search = "";
        updateFilterTags();
        loadUserEvents(1);
      });
      hasActiveTags = true;
    }

    // Add date range filter tag if active
    if (filters.dateStart && filters.dateEnd) {
      addFilterTag(
        filterTagsContainer,
        `Dates: ${filters.dateStart} to ${filters.dateEnd}`,
        () => {
          $("#date-range").val("");
          filters.dateStart = null;
          filters.dateEnd = null;
          updateFilterTags();
          loadUserEvents(1);
        }
      );
      hasActiveTags = true;
    }

    // Add category filter tags
    if (filters.categories && filters.categories.length > 0) {
      const categorySelect = document.getElementById("category-filter");
      filters.categories.forEach((categoryId) => {
        const option = categorySelect.querySelector(
          `option[value="${categoryId}"]`
        );
        if (option) {
          addFilterTag(
            filterTagsContainer,
            "Category: " + option.textContent,
            () => {
              // Remove this category from the filter
              const newCategories = filters.categories.filter(
                (id) => id !== categoryId
              );
              filters.categories = newCategories;
              $("#category-filter").val(newCategories).trigger("change");
              updateFilterTags();
              loadUserEvents(1);
            }
          );
          hasActiveTags = true;
        }
      });
    }

    // Show or hide the filter tags section
    filterTagsContainer.style.display = hasActiveTags ? "flex" : "none";

    // Add "Clear All" button if there are active filters
    if (hasActiveTags) {
      const clearAllBtn = document.createElement("button");
      clearAllBtn.className = "clear-all-filters";
      clearAllBtn.innerHTML = "Clear All Filters";
      clearAllBtn.addEventListener("click", clearAllFilters);
      filterTagsContainer.appendChild(clearAllBtn);
    }
  }

  /**
   * Adds a filter tag to the container
   */
  function addFilterTag(container, text, removeCallback) {
    const tag = document.createElement("div");
    tag.className = "filter-tag";
    tag.innerHTML = `
      <span>${text}</span>
      <button class="remove-tag"><i class="fa-solid fa-times"></i></button>
    `;
    tag.querySelector(".remove-tag").addEventListener("click", removeCallback);
    container.appendChild(tag);
  }

  /**
   * Clears all active filters
   */
  function clearAllFilters() {
    // Reset all filters
    document.getElementById("search-input").value = "";
    $("#date-range").val("");
    $("#category-filter").val(null).trigger("change");

    // Reset filter state
    filters.search = "";
    filters.dateStart = null;
    filters.dateEnd = null;
    filters.categories = [];

    // Reset liked events filter if active
    if (filters.likedOnly) {
      filters.likedOnly = false;
      allEventsLink.classList.add("active");
      likedEventsLink.classList.remove("active");
      document.getElementById("page-title").textContent = "Upcoming Events";
    }

    // Update UI and reload events
    updateFilterTags();
    loadUserEvents(1);
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
 * Display events in the container
 */
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

/**
 * Create event card element
 */
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
            <i class="${
              event.is_liked ? "fa-solid" : "fa-regular"
            } fa-heart"></i>
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

/**
 * Render category badges for event
 */
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

/**
 * Format time display
 */
function formatTime(date) {
  return date.toLocaleString("default", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

/**
 * Setup pagination controls
 */
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
      loadUserEvents(pageNumber);

      // Scroll to top of events section
      document
        .querySelector(".main-content")
        .scrollIntoView({ behavior: "smooth" });
    });
  });
}

/**
 * Handle liking/unliking an event
 */
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

          // If we're in the liked events view, reload the events
          // to remove this card if it was just unliked
          if (
            document
              .getElementById("liked-events-link")
              .classList.contains("active")
          ) {
            loadUserEvents(1);
          }
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

/**
 * Navigate to event details page
 */
function viewEventDetails(eventId) {
  window.location.href = `event-detail/event-details.html?id=${eventId}`;
}

/**
 * Fetch categories from server
 */
function fetchCategories() {
  fetch("../../php/categories/get_categories.php", {
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.status === "success") {
        populateCategoryFilter(data.categories);
      } else {
        toastr.error(data.message || "Error fetching categories");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      toastr.error("Failed to load categories. Please try again.");
    });
}

/**
 * Populate category filter dropdown
 */
function populateCategoryFilter(categories) {
  const categorySelect = document.getElementById("category-filter");
  categorySelect.innerHTML = "";

  if (categories && categories.length > 0) {
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.category_id;
      option.textContent = category.category_name;
      categorySelect.appendChild(option);
    });
  }

  // Refresh Select2 to show the new options
  $(categorySelect).trigger("change");
}

/**
 * Log out the current user
 */
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
