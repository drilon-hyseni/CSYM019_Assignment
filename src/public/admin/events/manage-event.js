document.addEventListener("DOMContentLoaded", function () {
  // Check if we're in edit mode by looking for event_id in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");
  const isEditMode = !!eventId;
  // Update page title and button text based on mode
  const pageTitle = document.getElementById("page-title");
  const saveButton = document.getElementById("save-button");
  // Initialize variables to store event data
  let cachedEventData = null;
  if (isEditMode) {
    pageTitle.textContent = "Edit Event";
    saveButton.innerHTML = '<i class="fas fa-save"></i> Update Event';
    document.getElementById("event-id").value = eventId;
    // Load event data first, THEN fetch categories
    loadEventData(eventId)
      .then((eventData) => {
        cachedEventData = eventData;
        return fetchCategories();
      })
      .then(() => {
        // Now that categories are loaded, populate the form
        if (cachedEventData) {
          populateEventForm(cachedEventData);
        }
      })
      .catch((error) => {
        showError(error.message);
      });
  } else {
    pageTitle.textContent = "Add New Event";
    saveButton.innerHTML = '<i class="fas fa-save"></i> Save Event';
    // For new events, just fetch categories
    fetchCategories();
  }
  // Initialize Quill editor
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
  // Initialize Select2
  $(document).ready(function () {
    $("#event-categories").select2({
      placeholder: "Select categories",
      allowClear: true,
      width: "100%",
    });
    // Only fetch categories here if we're not in edit mode (otherwise we already did it)
    if (!isEditMode) {
      fetchCategories();
    }
  });
  // DOM elements
  const manageEventForm = document.getElementById("manage-event-form");
  const backButton = document.getElementById("back-to-dashboard");

  const imageInput = document.querySelector(".image-input");
  const removeImageButton = document.querySelector(".remove-image");
  // Event listeners
  backButton.addEventListener("click", function () {
    window.location.href = "events.html";
  });
  manageEventForm.addEventListener("submit", function (e) {
    e.preventDefault();
    submitEventForm(isEditMode);
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
    return fetch("../../../php/categories/get_categories.php", {
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
          populateCategoriesDropdown(data.categories);
          return data.categories;
        } else {
          showError(data.message || "Error fetching categories");
          throw new Error(data.message || "Error fetching categories");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("Failed to load categories. Please try again.");
        throw error;
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
  }
  function loadEventData(eventId) {
    // Show loading indicator
    Swal.fire({
      title: "Loading Event Data...",
      html: "Please wait while we fetch the event details.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    // Fetch event data from server
    return fetch(`../../../php/events/get_event.php?event_id=${eventId}`, {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        Swal.close();
        if (data.status === "success") {
          const eventWithCategories = {
            ...data.event,
            categories: data.categories || [],
            images: data.images || [],
          };
          return eventWithCategories;
        } else {
          showError(data.message || "Error loading event data");
          return null;
        }
      })
      .catch((error) => {
        Swal.close();
        console.error("Error:", error);
        showError("Failed to load event data. Please try again.");
        throw error;
      });
  }
  function decodeHTMLEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }
  function populateEventForm(event) {
    // Populate basic information
    document.getElementById("event-title").value = event.event_title;
    const decodedHTML = decodeHTMLEntities(event.event_description);
    quill.clipboard.dangerouslyPasteHTML(decodedHTML);
    document.getElementById("event-location").value = event.location;
    // Format date for datetime-local input
    if (event.event_date) {
      const eventDate = new Date(event.event_date);
      const formattedDate = eventDate.toISOString().slice(0, 16);
      document.getElementById("event-date").value = formattedDate;
    }
    // Set selected categories
    if (Array.isArray(event.categories)) {
      const categoryIds = event.categories.map((cat) =>
        cat.category_id.toString()
      );
      // Ensure the Select2 is initialized before setting values
      if ($.fn.select2 && $("#event-categories").data("select2")) {
        $("#event-categories").val(categoryIds).trigger("change");
        console.log("Categories selected:", categoryIds);
      } else {
        console.warn("Select2 not initialized yet, trying once more");
        setTimeout(() => {
          $("#event-categories").val(categoryIds).trigger("change");
        }, 100);
      }
    } else {
      console.warn("event.categories is not an array:", event.categories);
    }

    // Load image if available
    if (
      event.images &&
      Array.isArray(event.images) &&
      event.images.length > 0
    ) {
      // Just use the first image in the array
      const image = event.images[0];

      const uploadBox = document.querySelector(".image-upload-box");
      const previewImage = uploadBox.querySelector(".preview-image");
      const placeholder = uploadBox.querySelector(".upload-placeholder");
      const removeButton = uploadBox.querySelector(".remove-image");
      const existingImageInput = document.getElementById("existing-image");

      if (existingImageInput) {
        // Store image id in hidden field
        existingImageInput.value = image.image_id;
      } else {
        // Create a hidden input to store the image ID if it doesn't exist
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.id = "existing-image";
        hiddenInput.name = "existing_image_id";
        hiddenInput.value = image.image_id;
        uploadBox.appendChild(hiddenInput);
      }

      // Set the image preview
      previewImage.src = image.url;
      previewImage.style.display = "block";
      placeholder.style.display = "none";
      removeButton.style.display = "flex";

      console.log("Image loaded:", image.image_id);
    }
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

    // Clear existing image ID since we're uploading a new image
    const existingImageInput = document.getElementById("existing-image");
    if (existingImageInput) {
      existingImageInput.value = "";
    }

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
    const existingImageInput = document.getElementById("existing-image");

    // Reset file input and hide preview
    input.value = "";
    previewImage.src = "#";
    previewImage.style.display = "none";
    placeholder.style.display = "flex";
    removeButton.style.display = "none";

    // Clear existing image ID
    if (existingImageInput) {
      existingImageInput.value = "";
    }
  }
  function submitEventForm(isEditMode) {
    // Create FormData object to handle file uploads
    const formData = new FormData(manageEventForm);

    // Get Quill content and append it manually
    const eventDescriptionHTML = quill.root.innerHTML;
    formData.set("event_description", eventDescriptionHTML);

    // Add a field to indicate if we're editing or adding
    formData.append("is_edit_mode", isEditMode ? "1" : "0");

    // Check that at least one category is selected
    const categories = $("#event-categories").val();
    if (!categories || categories.length === 0) {
      showError("Please select at least one category");
      return;
    }

    console.log("=== FormData Being Sent ===");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: [File] name=${value.name}, size=${value.size}`);
      } else {
        console.log(`${key}:`, value);
      }
    }
    console.log("=== End of FormData ===");

    // Show loading indicator
    Swal.fire({
      title: isEditMode ? "Updating Event..." : "Saving Event...",
      html: "Please wait while we process your request.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Choose the appropriate endpoint based on mode
    const endpoint = isEditMode
      ? "../../../php/events/update_event.php"
      : "../../../php/events/add_event.php";

    // Submit the form data to the server
    fetch(endpoint, {
      method: "POST",
      body: formData,
      credentials: "include",
    })
      .then((response) => {
        // Log the raw response for debugging
        return response.text().then((text) => {
          console.log("Raw API response:", text);
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("JSON parse error:", e);
            throw new Error("Invalid JSON response from server");
          }
        });
      })
      .then((data) => {
        if (data.status === "success") {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: isEditMode
              ? "Event has been updated successfully."
              : "Event has been created successfully.",
            confirmButtonColor: "#573b8a",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "events.html"; // Redirect to events page
            }
          });
        } else {
          showError(
            data.message ||
              `Failed to ${isEditMode ? "update" : "create"} event`
          );
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError(
          `An error occurred while ${
            isEditMode ? "updating" : "saving"
          } the event. Please try again.`
        );
      });
  }
  function showError(message) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: message,
      confirmButtonColor: "#573b8a",
    });
  }
});
