document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const usersTable = document.getElementById("users-table");
  const usersTableBody = document.getElementById("users-table-body");
  const loadingSpinner = document.getElementById("loading-spinner");
  const noUsersMessage = document.getElementById("no-users");
  const searchInput = document.getElementById("search-user");
  const backToDashboardBtn = document.getElementById("back-to-dashboard");
  const addUserBtn = document.getElementById("add-user-btn");
  const editUserModal = document.getElementById("edit-user-modal");
  const addUserModal = document.getElementById("add-user-modal");
  const editUserForm = document.getElementById("edit-user-form");
  const addUserForm = document.getElementById("add-user-form");

  // Modal close buttons
  const closeModalButtons = document.querySelectorAll(".close-modal");

  // State variables
  let users = [];
  let filteredUsers = [];
  const itemsPerPage = 10;
  let currentPage = 1;

  // Initialize
  fetchUsers();

  // Event Listeners
  backToDashboardBtn.addEventListener("click", function () {
    window.location.href = "../dashboard.html";
  });

  searchInput.addEventListener("input", function () {
    filterUsers(this.value);
  });

  addUserBtn.addEventListener("click", function () {
    showAddUserModal();
  });

  // Close modals when clicking close buttons
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", function () {
      editUserModal.style.display = "none";
      addUserModal.style.display = "none";
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === editUserModal) {
      editUserModal.style.display = "none";
    }
    if (event.target === addUserModal) {
      addUserModal.style.display = "none";
    }
  });

  // Form submissions
  editUserForm.addEventListener("submit", function (e) {
    e.preventDefault();
    updateUser();
  });

  addUserForm.addEventListener("submit", function (e) {
    e.preventDefault();
    createUser();
  });

  // Fetch users from API
  function fetchUsers() {
    showLoading();

    fetch("../../../php/users/get_users.php", {
      credentials: "include", // Include session cookies
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          users = data.users;
          filteredUsers = [...users];
          renderUsers();
        } else {
          showError(data.message || "Error fetching users");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("Failed to load users. Please try again.");
      })
      .finally(() => {
        hideLoading();
      });
  }

  // Display loading spinner
  function showLoading() {
    loadingSpinner.style.display = "flex";
    usersTable.style.display = "none";
    noUsersMessage.style.display = "none";
  }

  // Hide loading spinner
  function hideLoading() {
    loadingSpinner.style.display = "none";
    if (filteredUsers.length > 0) {
      usersTable.style.display = "table";
      noUsersMessage.style.display = "none";
    } else {
      usersTable.style.display = "none";
      noUsersMessage.style.display = "block";
    }
  }

  // Show error with SweetAlert
  function showError(message) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: message,
    });
  }

  // Filter users based on search input
  function filterUsers(searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    if (!searchTerm) {
      filteredUsers = [...users];
    } else {
      filteredUsers = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
      );
    }

    currentPage = 1; // Reset to first page when filtering
    renderUsers();
  }

  // Render users table
  function renderUsers() {
    // Clear existing table content
    usersTableBody.innerHTML = "";

    // Check if there are any users to display
    if (filteredUsers.length === 0) {
      usersTable.style.display = "none";
      noUsersMessage.style.display = "block";
      paginationContainer.innerHTML = "";
      return;
    }

    const paginatedUsers = filteredUsers;

    // Generate table rows
    paginatedUsers.forEach((user) => {
      const row = document.createElement("tr");

      // Format date
      const createdDate = new Date(user.created_at);
      const formattedDate = createdDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      row.innerHTML = `
              <td>#${user.id}</td>
              <td>${user.name}</td>
              <td>${user.username}</td>
              <td>${user.email}</td>
              <td>${formattedDate}</td>
              <td>
                <span class="status-badge ${
                  user.valid ? "status-active" : "status-inactive"
                }">
                  ${user.valid ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <span class="status-badge ${
                  user.is_admin ? "status-admin" : "status-user"
                }">
                  ${user.is_admin ? "Admin" : "User"}
                </span>
              </td>
              <td class="action-buttons">
                <button class="btn btn-edit" onclick="editUser(${user.id})">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteUser(${user.id})">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;

      usersTableBody.appendChild(row);
    });

    // Display table
    usersTable.style.display = "table";
    noUsersMessage.style.display = "none";

    // Render pagination
    //renderPagination();
  }

  window.editUser = function (userId) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Populate form fields
    document.getElementById("edit-user-id").value = user.id;
    document.getElementById("edit-name").value = user.name;
    document.getElementById("edit-username").value = user.username;
    document.getElementById("edit-email").value = user.email;
    document.getElementById("edit-admin").checked =
      user.is_admin === 1 || user.is_admin === true;

    // Show modal
    editUserModal.style.display = "block";
  };

  // Show add user modal
  function showAddUserModal() {
    // Reset form
    document.getElementById("add-user-form").reset();
    // Show modal
    addUserModal.style.display = "block";
  }

  // Update user function
  function updateUser() {
    const userId = document.getElementById("edit-user-id").value;
    const userData = {
      name: document.getElementById("edit-name").value,
      username: document.getElementById("edit-username").value,
      email: document.getElementById("edit-email").value,
      is_admin: document.getElementById("edit-admin").checked ? 1 : 0,
    };

    fetch(`../../../php/users/update_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...userData }),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Update local users array
          const userIndex = users.findIndex((u) => u.id == userId);
          if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...userData };
            filteredUsers = [...users]; // Reset filtered list
            renderUsers();
          }

          // Close modal and show success message
          editUserModal.style.display = "none";
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "User has been updated successfully.",
          });
        } else {
          showError(data.message || "Failed to update user");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("An error occurred while updating the user");
      });
  }

  // Create user function
  function createUser() {
    const userData = {
      name: document.getElementById("add-name").value,
      username: document.getElementById("add-username").value,
      email: document.getElementById("add-email").value,
      password: document.getElementById("add-password").value,
      is_admin: document.getElementById("add-admin").checked ? 1 : 0,
    };

    fetch("../../../php/users/add_user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Add new user to array and refresh display
          if (data.user) {
            users.push(data.user);
            filteredUsers = [...users];
            renderUsers();
          } else {
            // If server didn't return the user, refetch all users
            fetchUsers();
          }

          // Close modal and show success message
          addUserModal.style.display = "none";
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "New user has been created successfully.",
          });
        } else {
          showError(data.message || "Failed to create user");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("An error occurred while creating the user");
      });
  }

  // Delete user function
  window.deleteUser = function (userId) {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("../../../php/users/delete_user.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              // Remove user from array
              users = users.filter((user) => user.id != userId);
              filteredUsers = filteredUsers.filter((user) => user.id != userId);
              renderUsers();

              Swal.fire("Deleted!", "The user has been deleted.", "success");
            } else {
              showError(data.message || "Failed to delete user");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            showError("An error occurred while deleting the user");
          });
      }
    });
  };
});
