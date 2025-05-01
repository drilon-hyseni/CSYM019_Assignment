document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const eventsTable = document.getElementById("events-table");
  const eventsBody = document.getElementById("events-body");
  const addEventButton = document.getElementById("add-event-button");
  const backToDashboardButton = document.getElementById("back-to-dashboard");
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const categoryFilter = document.getElementById("category-filter");
  const statusFilter = document.getElementById("status-filter");
  const paginationContainer = document.getElementById("pagination");
  const loadingSpinner = document.getElementById("loading-spinner");

  // State variables
  let currentPage = 1;
  let eventsPerPage = 10;
  let totalPages = 1;
  let currentEvents = [];
  let allCategories = [];
  let allEvents = [];

  // Event listeners
  addEventButton.addEventListener("click", function () {
    window.location.href = "add_event.html";
  });

  backToDashboardButton.addEventListener("click", function () {
    window.location.href = "../dashboard.html";
  });

  searchButton.addEventListener("click", function () {
    filterEvents();
  });

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      filterEvents();
    }
  });

  categoryFilter.addEventListener("change", filterEvents);
  statusFilter.addEventListener("change", filterEvents);

  // Initialize
  fetchCategories();
  fetchEvents();

  // Functions
  function showLoading() {
    loadingSpinner.style.display = "flex";
  }

  function hideLoading() {
    loadingSpinner.style.display = "none";
  }

  function showError(message) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonColor: "#573b8a",
    });
  }

  function fetchCategories() {
    showLoading();
    fetch("../../../php/categories/get_categories.php", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        hideLoading();
        if (data.status === "success") {
          allCategories = data.categories;
          populateCategoryFilter(data.categories);
        } else {
          showError(data.message || "Error fetching categories");
        }
      })
      .catch((error) => {
        hideLoading();
        console.error("Error:", error);
        showError("Failed to load categories. Please try again.");
      });
  }

  function populateCategoryFilter(categories) {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';

    categories.forEach((category) => {
      if (category.is_valid) {
        const option = document.createElement("option");
        option.value = category.category_id;
        option.textContent = category.category_name;
        categoryFilter.appendChild(option);
      }
    });
  }

  function fetchEvents() {
    showLoading();
    fetch("../../../php/events/get_events.php", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        hideLoading();
        if (data.status === "success") {
          allEvents = data.events; // Keep original
          currentEvents = [...allEvents]; // Copy for filtering
          console.log("Events: ", currentEvents);
          totalPages = Math.ceil(currentEvents.length / eventsPerPage);
          renderEvents();
          renderPagination();
        } else {
          showError(data.message || "Error fetching events");
        }
      })
      .catch((error) => {
        hideLoading();
        console.error("Error:", error);
        showError("Failed to load events. Please try again.");
      });
  }

  function filterEvents() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryId = categoryFilter.value;
    const status = statusFilter.value;

    const filteredEvents = allEvents.filter((event) => {
      // Search term filter
      const matchesSearch =
        searchTerm === "" ||
        event.event_title.toLowerCase().includes(searchTerm) ||
        event.event_description.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm);

      // Category filter
      let matchesCategory = true;
      if (categoryId) {
        matchesCategory = event.categories.some(
          (cat) => String(cat.category_id) === String(categoryId)
        );
      }

      // Status filter
      const matchesStatus =
        status === "" || event.is_valid.toString() === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Update display
    currentEvents = filteredEvents;
    currentPage = 1;
    totalPages = Math.ceil(currentEvents.length / eventsPerPage);
    renderEvents();
    renderPagination();
  }

  function renderEvents() {
    eventsBody.innerHTML = "";

    if (currentEvents.length === 0) {
      const noEventsRow = document.createElement("tr");
      noEventsRow.innerHTML = `<td colspan="9" style="text-align: center;">No events found</td>`;
      eventsBody.appendChild(noEventsRow);
      return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = Math.min(startIndex + eventsPerPage, currentEvents.length);
    const paginatedEvents = currentEvents.slice(startIndex, endIndex);

    paginatedEvents.forEach((event) => {
      const row = document.createElement("tr");

      function decodeHtml(html) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
      }
      const tempDiv = document.createElement("div");
      // Extract plain text from HTML content
      const decoded = decodeHtml(event.event_description);
      tempDiv.innerHTML = decoded;
      const plainTextDescription = tempDiv.textContent || tempDiv.innerText;

      // Trim description to a reasonable length
      const trimmedDescription =
        plainTextDescription.length > 100
          ? plainTextDescription.substring(0, 100) + "..."
          : plainTextDescription;

      // Format categories
      const categoryNames = event.categories
        ? event.categories.map((cat) => cat.category_name).join(", ")
        : "";

      // Format dates
      const eventDate = new Date(event.event_date).toLocaleString();
      const dateCreated = new Date(event.date_created).toLocaleDateString();

      // Status badge
      const statusBadge = event.is_valid
        ? '<span class="status-badge status-active">Active</span>'
        : '<span class="status-badge status-inactive">Inactive</span>';

      row.innerHTML = `
              <td>${event.event_id}</td>
              <td>${event.event_title}</td>
              <td class="description-cell">${trimmedDescription}</td>
              <td>${categoryNames}</td>
              <td>${event.location}</td>
              <td>${eventDate}</td>
              <td>${dateCreated}</td>
              <td>${statusBadge}</td>
              <td class="action-buttons">
                  <button class="btn btn-edit" data-id="${event.event_id}"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-delete"  onclick="deleteEvent(${event.event_id})" data-id="${event.event_id}">
                  <i class="fas fa-trash"></i>
                  </button>
              </td>
          `;

      eventsBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const eventId = this.getAttribute("data-id");
        // We're not implementing edit functionality yet as per requirements
        console.log(`Edit event with ID: ${eventId}`);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const eventId = this.getAttribute("data-id");
        // We're not implementing delete functionality yet as per requirements
        console.log(`Delete event with ID: ${eventId}`);
      });
    });
  }

  function renderPagination() {
    paginationContainer.innerHTML = "";

    if (totalPages <= 1) {
      return;
    }

    // Previous page button
    const prevPageLink = document.createElement("span");
    prevPageLink.classList.add("page-link");
    prevPageLink.innerHTML = "&laquo;";
    prevPageLink.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage--;
        renderEvents();
        renderPagination();
      }
    });
    paginationContainer.appendChild(prevPageLink);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
      const pageLink = document.createElement("span");
      pageLink.classList.add("page-link");
      if (i === currentPage) {
        pageLink.classList.add("active");
      }
      pageLink.textContent = i;
      pageLink.addEventListener("click", function () {
        currentPage = i;
        renderEvents();
        renderPagination();
      });
      paginationContainer.appendChild(pageLink);
    }

    // Next page button
    const nextPageLink = document.createElement("span");
    nextPageLink.classList.add("page-link");
    nextPageLink.innerHTML = "&raquo;";
    nextPageLink.addEventListener("click", function () {
      if (currentPage < totalPages) {
        currentPage++;
        renderEvents();
        renderPagination();
      }
    });
    paginationContainer.appendChild(nextPageLink);
  }

  window.deleteEvent = function (eventId) {
    Swal.fire({
      title: "Are you sure you want to delete this event?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("../../../php/events/delete_event.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: eventId }),
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              Swal.fire("Deleted!", "The event has been deleted.", "success");
            } else {
              showError(data.message || "Failed to delete event");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            showError("An error occurred while deleting the event");
          });
      }
    });
  };
});
