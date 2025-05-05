import { showError } from "../../helpers/script.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Select2
  $(document).ready(function () {
    $("#event-categories").select2({
      placeholder: "Select categories",
      allowClear: true,
      width: "100%",
    });

    // Fetch categories for the select dropdown
    fetchCategories();
  });

  var quill = new Quill("#event-description-editor", {
    theme: "snow",
    placeholder: "Write a detailed event description...",
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        ["link", "blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
      ],
    },
  });

  // DOM elements
  const addEventForm = document.getElementById("add-event-form");
  const backButton = document.getElementById("back-to-dashboard");
  const cancelButton = document.getElementById("cancel-button");
  const imageInput = document.querySelector(".image-input");
  const removeImageButton = document.querySelector(".remove-image");

  // Event listeners
  backButton.addEventListener("click", function () {
    window.location.href = "events.html";
  });

  cancelButton.addEventListener("click", function () {
    if (
      confirm(
        "Are you sure you want to cancel? Any unsaved changes will be lost."
      )
    ) {
      window.location.href = "events.html";
    }
  });

  addEventForm.addEventListener("submit", function (e) {
    e.preventDefault();
    submitEventForm();
  });

  // Set up image upload
  imageInput.addEventListener("change", function (e) {
    handleImageUpload(e);
  });

  // Set up image removal
  removeImageButton.addEventListener("click", function (e) {
    e.stopPropagation();
    const uploadBox = this.closest(".image-upload-box");
    removeImage(uploadBox);
  });

  // Click on the upload box to trigger the file input
  document
    .querySelector(".image-upload-box")
    .addEventListener("click", function (e) {
      // Prevent the click if it's already on an input or remove button
      if (
        e.target.classList.contains("image-input") ||
        e.target.classList.contains("remove-image") ||
        e.target.closest(".remove-image")
      ) {
        return;
      }
      this.querySelector(".image-input").click();
    });

  // Functions
  function fetchCategories() {
    fetch("../../../php/categories/get_categories.php", {
      credentials: "include",
    })
      .then((response) => {
        console.log(response);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          populateCategoriesDropdown(data.categories);
        } else {
          showError(data.message || "Error fetching categories");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("Failed to load categories. Please try again.");
      });
  }

  function populateCategoriesDropdown(categories) {
    const dropdown = document.getElementById("event-categories");
    dropdown.innerHTML = "";

    categories.forEach((category) => {
      if (category.is_valid) {
        const option = document.createElement("option");
        option.value = category.category_id;
        option.textContent = category.category_name;
        dropdown.appendChild(option);
      }
    });

    // Refresh Select2 to show the new options
    $(dropdown).trigger("change");
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showError("Image file is too large. Maximum size is 5MB.");
      e.target.value = ""; // Clear the file input
      return;
    }

    // Check file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showError("Only JPG and PNG images are allowed.");
      e.target.value = ""; // Clear the file input
      return;
    }

    const uploadBox = e.target.closest(".image-upload-box");
    const previewImage = uploadBox.querySelector(".preview-image");
    const placeholder = uploadBox.querySelector(".upload-placeholder");
    const removeButton = uploadBox.querySelector(".remove-image");

    // Create preview
    const reader = new FileReader();
    reader.onload = function (event) {
      previewImage.src = event.target.result;
      previewImage.style.display = "block";
      placeholder.style.display = "none";
      removeButton.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  function removeImage(uploadBox) {
    const input = uploadBox.querySelector(".image-input");
    const previewImage = uploadBox.querySelector(".preview-image");
    const placeholder = uploadBox.querySelector(".upload-placeholder");
    const removeButton = uploadBox.querySelector(".remove-image");

    // Reset file input and hide preview
    input.value = "";
    previewImage.src = "#";
    previewImage.style.display = "none";
    placeholder.style.display = "flex";
    removeButton.style.display = "none";
  }

  function submitEventForm() {
    // Create FormData object to handle file uploads
    const formData = new FormData(addEventForm);

    // Get Quill content and append it manually
    const eventDescriptionHTML = quill.root.innerHTML;
    formData.set("event_description", eventDescriptionHTML); // overwrite the form value

    // Check that at least one category is selected
    const categories = $("#event-categories").val();
    if (!categories || categories.length === 0) {
      showError("Please select at least one category");
      return;
    }

    // Show loading indicator
    Swal.fire({
      title: "Saving Event...",
      html: "Please wait while we upload the image and save your event.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    // Submit the form data to the server
    fetch("../../../php/events/add_event.php", {
      method: "POST",
      body: formData,
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
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Event has been created successfully.",
            confirmButtonColor: "#573b8a",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "events.html"; // Redirect to events page
            }
          });
        } else {
          showError(data.message || "Failed to create event");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError(
          "An error occurred while saving the event. Please try again."
        );
      });
  }
});
