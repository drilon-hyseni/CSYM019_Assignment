document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const categoriesTable = document.getElementById("categories-table");
  const categoriesTableBody = document.getElementById("categories-table-body");
  const loadingSpinner = document.getElementById("loading-spinner");
  const noCategoriesMessage = document.getElementById("no-categories");
  const searchInput = document.getElementById("search-input");
  const backToDashboardBtn = document.getElementById("back-to-dashboard");
  const addBtn = document.getElementById("add-btn");
  const editCategoryModal = document.getElementById("edit-category-modal");
  const addCategoryModal = document.getElementById("add-category-modal");
  const editCategoryForm = document.getElementById("edit-category-form");
  const addCategoryForm = document.getElementById("add-category-form");

  // Modal close buttons
  const closeModalButtons = document.querySelectorAll(".close-modal");

  // State variables
  let categories = [];
  let filteredCategories = [];
  const itemsPerPage = 10;
  let currentPage = 1;

  // Initialize
  fetchCategories();

  // Event Listeners
  backToDashboardBtn.addEventListener("click", function () {
    window.location.href = "../dashboard.html";
  });

  searchInput.addEventListener("input", function () {
    filterCategories(this.value);
  });

  addBtn.addEventListener("click", function () {
    window.location.href = "add_event.html";
  });

  // Close modals when clicking close buttons
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", function () {
      editCategoryModal.style.display = "none";
      addCategoryModal.style.display = "none";
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === editCategoryModal) {
      editCategoryModal.style.display = "none";
    }
    if (event.target === addCategoryModal) {
      addCategoryModal.style.display = "none";
    }
  });

  // Form submissions
  editCategoryForm.addEventListener("submit", function (e) {
    e.preventDefault();
    updateCategory();
  });

  addCategoryForm.addEventListener("submit", function (e) {
    e.preventDefault();
    createCategory();
  });

  // Fetch categories from API
  function fetchCategories() {
    showLoading();

    fetch("../../../php/categories/get_categories.php", {
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
          categories = data.categories;
          filteredCategories = [...categories];
          renderCategories();
        } else {
          showError(data.message || "Error fetching categories");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("Failed to load categories. Please try again.");
      })
      .finally(() => {
        hideLoading();
      });
  }

  // Display loading spinner
  function showLoading() {
    loadingSpinner.style.display = "flex";
    categoriesTable.style.display = "none";
    noCategoriesMessage.style.display = "none";
  }

  // Hide loading spinner
  function hideLoading() {
    loadingSpinner.style.display = "none";
    if (filteredCategories.length > 0) {
      categoriesTable.style.display = "table";
      noCategoriesMessage.style.display = "none";
    } else {
      categoriesTable.style.display = "none";
      noCategoriesMessage.style.display = "block";
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

  // Filter categories based on search input
  function filterCategories(searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    if (!searchTerm) {
      filteredCategories = [...categories];
    } else {
      filteredCategories = categories.filter((category) =>
        category.category_name.toLowerCase().includes(searchTerm)
      );
    }

    currentPage = 1; // Reset to first page when filtering
    renderCategories();
  }

  // Render categories table
  function renderCategories() {
    // Clear existing table content
    categoriesTableBody.innerHTML = "";

    // Check if there are any categories to display
    if (filteredCategories.length === 0) {
      categoriesTable.style.display = "none";
      noCategoriesMessage.style.display = "block";
      return;
    }

    const paginatedCategories = filteredCategories;

    // Generate table rows
    paginatedCategories.forEach((category) => {
      const row = document.createElement("tr");

      // Format date
      const createdDate = new Date(category.created_at);
      const formattedDate = createdDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      row.innerHTML = `
                    <td>#${category.category_id}</td>
                    <td>${category.category_name}</td>
                    <td>
                      <span class="status-badge ${
                        category.is_valid ? "status-active" : "status-inactive"
                      }">
                        ${category.is_valid ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>${formattedDate}</td>
                    <td class="action-buttons">
                      <button class="btn btn-edit" onclick="editCategory(${
                        category.category_id
                      })">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete" onclick="deleteCategory(${
                        category.category_id
                      })">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  `;

      categoriesTableBody.appendChild(row);
    });

    // Display table
    categoriesTable.style.display = "table";
    noCategoriesMessage.style.display = "none";
  }

  window.editCategory = function (categoryId) {
    const category = categories.find((c) => c.category_id === categoryId);
    if (!category) return;

    // Populate form fields
    document.getElementById("edit-category-id").value = category.category_id;
    document.getElementById("edit-name").value = category.category_name;
    document.getElementById("edit-valid").checked =
      category.is_valid === 1 || category.is_valid === true;

    // Show modal
    editCategoryModal.style.display = "block";
  };

  // Update category function
  function updateCategory() {
    const categoryId = document.getElementById("edit-category-id").value;
    const categoryData = {
      name: document.getElementById("edit-name").value,
      valid: document.getElementById("edit-valid").checked ? 1 : 0,
    };

    fetch(`../../../php/categories/update_category.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: categoryId, ...categoryData }),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Update local categories array
          const categoryIndex = categories.findIndex((c) => c.id == categoryId);
          if (categoryIndex !== -1) {
            categories[categoryIndex] = {
              ...categories[categoryIndex],
              ...categoryData,
            };
            filteredCategories = [...categories]; // Reset filtered list
            renderCategories();
          }

          // Close modal and show success message
          editCategoryModal.style.display = "none";
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Category has been updated successfully.",
          });
        } else {
          showError(data.message || "Failed to update category");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("An error occurred while updating the category");
      });
  }

  // Create category function
  function createCategory() {
    const categoryData = {
      name: document.getElementById("add-name").value,
      valid: document.getElementById("add-valid").checked ? 1 : 0,
    };

    fetch("../../../php/categories/add_category.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Add new category to array and refresh display
          if (data.category) {
            categories.push(data.category);
            filteredCategories = [...categories];
            renderCategories();
          } else {
            // If server didn't return the category, refetch all categories
            fetchCategories();
          }

          // Close modal and show success message
          addCategoryModal.style.display = "none";
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "New category has been created successfully.",
          });
        } else {
          showError(data.message || "Failed to create category");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("An error occurred while creating the category");
      });
  }

  // Delete category function
  window.deleteCategory = function (categoryId) {
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
        fetch("../../../php/categories/delete_category.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: categoryId }),
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              // Remove category from array
              categories = categories.filter(
                (category) => category.category_id != categoryId
              );
              filteredCategories = filteredCategories.filter(
                (category) => category.category_id != categoryId
              );
              renderCategories();

              Swal.fire(
                "Deleted!",
                "The category has been deleted.",
                "success"
              );
            } else {
              showError(data.message || "Failed to delete category");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            showError("An error occurred while deleting the category");
          });
      }
    });
  };
});
