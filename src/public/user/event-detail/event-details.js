import { showError } from "../../helpers/script.js";
document.addEventListener("DOMContentLoaded", function () {
  // Get event ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");
  let currentUserId = 0;
  // Back button functionality
  document.getElementById("back-button").addEventListener("click", function () {
    window.history.back();
  });

  // Fetch event details
  if (eventId) {
    fetchEventDetails(eventId);
  } else {
    showError("Event ID is missing");
  }

  fetchUserSession().then(() => {
    // Fetch event details
    if (eventId) {
      fetchEventDetails(eventId);
    } else {
      showError("Event ID is missing");
    }
  });

  // Fetch user session data
  function fetchUserSession() {
    return fetch("../../../php/get_session.php")
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          currentUserId = parseInt(data.user_id);
          console.log("user id:", currentUserId);
          return currentUserId;
        } else {
          console.error("Error fetching user session:", data.message);
          return 0;
        }
      })
      .catch((error) => {
        console.error("Error fetching user session:", error);
        return 0;
      });
  }

  function fetchEventDetails(eventId) {
    fetch(`../../../php/events/get_event.php?event_id=${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          renderEventDetails(data);
        } else {
          showError(data.message || "Failed to load event details");
        }
      })
      .catch((error) => {
        console.error("Error fetching event details:", error);
        showError("An error occurred while loading event details");
      });
  }

  function renderEventDetails(data) {
    const event = data.event;
    const categories = data.categories;
    const images = data.images;
    const comments = data.comments;

    const eventDate = new Date(event.event_date);
    const formattedDate =
      eventDate.getDate() +
      " " +
      eventDate.toLocaleString("default", { month: "long" }) +
      " " +
      eventDate.getFullYear() +
      " " +
      eventDate.toLocaleTimeString();

    let eventHtml = `
    <div class="event-details">
      <h2 class="event-title">${event.event_title}</h2>
      
      <div class="event-meta">
        <div class="event-meta-item">
          <i class="fas fa-calendar"></i>
          <span>${formattedDate}</span>
        </div>
        <div class="event-meta-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${event.location}</span>
        </div>
      </div>
      
      <div class="event-description" id="event-description-container">
              <!-- Quill editor will be initialized here -->
        </div>
      
      <div class="event-categories">
        ${categories
          .map(
            (category) => `
          <span class="category-badge">${category.category_name}</span>
        `
          )
          .join("")}
      </div>
      
      ${
        images.length > 0
          ? `
        <div class="event-images">
          ${images
            .map(
              (image) => `
            <img src="${image.url}" alt="Event image" class="event-image">
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
    
    <div class="comments-section">
      <div class="comments-header">
        <h3>Comments (${comments.length})</h3>
      </div>
      
      <div class="comments-list" id="comments-list">
        ${
          comments.length > 0
            ? comments
                .map(
                  (comment) => `
          <div class="comment" data-comment-id="${comment.comment_id}">
            <div class="comment-header">
              <span class="comment-author">${comment.username}</span>
              ${
                parseInt(comment.User_id) === currentUserId
                  ? `
                <button class="delete-comment" data-comment-id="${comment.comment_id}">
                  <i class="fas fa-trash"></i> Delete
                </button>
              `
                  : ""
              }
            </div>
            <div class="comment-text">${comment.comment}</div>
          </div>
        `
                )
                .join("")
            : "<p>No comments yet. Be the first to comment!</p>"
        }
      </div>
      
      <div class="add-comment">
        <h4>Add a comment</h4>
        <textarea id="comment-text" placeholder="Write your comment here..."></textarea>
        <button class="submit-comment" id="submit-comment">Post Comment</button>
      </div>
    </div>
  `;

    document.getElementById("event-container").innerHTML = eventHtml;

    const quillContainer = document.getElementById(
      "event-description-container"
    );
    const quill = new Quill(quillContainer, {
      theme: "snow",
      modules: {
        toolbar: false, // Read-only mode, no toolbar
      },
      readOnly: true,
    });

    // Decode and insert HTML content into Quill
    const decodedHTML = decodeHTMLEntities(event.event_description);
    quill.clipboard.dangerouslyPasteHTML(decodedHTML);

    // Add event listeners for comment functionality
    document
      .getElementById("submit-comment")
      .addEventListener("click", function () {
        submitComment(eventId);
      });

    // Add event listeners for delete buttons
    const deleteButtons = document.querySelectorAll(".delete-comment");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const commentId = this.getAttribute("data-comment-id");
        deleteComment(eventId, commentId);
      });
    });
  }

  function decodeHTMLEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  function submitComment(eventId) {
    const commentText = document.getElementById("comment-text").value.trim();

    if (!commentText) {
      alert("Please enter a comment");
      return;
    }

    // Prepare the comment data
    const commentData = {
      event_id: eventId,
      comment: commentText,
    };

    // Send the comment to the server
    fetch("../../../php/events/add_comment.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commentData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Refresh the event details to show the new comment
          fetchEventDetails(eventId);
        } else {
          alert(data.message || "Failed to add comment");
        }
      })
      .catch((error) => {
        console.error("Error submitting comment:", error);
        alert("An error occurred while submitting your comment");
      });
  }

  function deleteComment(eventId, commentId) {
    Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "Do you really want to delete this comment?",
      showCancelButton: true,
      confirmButtonColor: "#573b8a",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("../../../php/events/delete_comment.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment_id: commentId,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              const commentElement = document.querySelector(
                `.comment[data-comment-id="${commentId}"]`
              );
              if (commentElement) {
                commentElement.remove();
              }
              fetchEventDetails(eventId); // Refresh comment count
            } else {
              Swal.fire(
                "Error",
                data.message || "Failed to delete comment",
                "error"
              );
            }
          })
          .catch((error) => {
            console.error("Error deleting comment:", error);
            Swal.fire(
              "Error",
              "An error occurred while deleting the comment",
              "error"
            );
          });
      }
    });
  }
});
