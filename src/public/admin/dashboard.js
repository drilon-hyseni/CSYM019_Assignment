document.addEventListener("DOMContentLoaded", function () {
  //Checks the user that is logged in.
  //If it is admin then will show the page. If not it will redirect somewhere else.
  fetch("../../php/check_session.php", {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.logged_in || !data.is_admin) {
        window.location.href = "../login/login.html";
      }
    })
    .catch((err) => {
      console.error("Session check failed", err);
      window.location.href = "../login/login.html";
    });

  document
    .getElementById("users-section")
    .addEventListener("click", function () {
      window.location.href = "users/users.html";
    });

  document
    .getElementById("events-section")
    .addEventListener("click", function () {
      window.location.href = "events.html";
    });

  document
    .getElementById("settings-section")
    .addEventListener("click", function () {
      window.location.href = "configuration/configuration.html";
    });

  document
    .getElementById("logout-section")
    .addEventListener("click", function () {
      // Show confirmation dialog
      Swal.fire({
        title: "Are you sure?",
        text: "You will be logged out of your account.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, log out",
      }).then((result) => {
        if (result.isConfirmed) {
          // Call logout.php
          fetch("../../php/logout.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.status === "success") {
                Swal.fire({
                  title: "Logged Out!",
                  text: "You have been logged out.",
                  icon: "success",
                  timer: 1500,
                  showConfirmButton: false,
                }).then(() => {
                  window.location.href = "../login/login.html"; // adjust this path if needed
                });
              }
            })
            .catch((err) => {
              console.error("Logout error:", err);
              Swal.fire(
                "Oops!",
                "Something went wrong while logging out.",
                "error"
              );
            });
        }
      });
    });

  // You could add code here to fetch and display real data for the status bar
  // For example:
  /*
fetch('../../php/admin_stats.php', {
  credentials: 'include'
})
.then(response => response.json())
.then(data => {
  document.querySelector('.status-item:nth-child(1) .value').textContent = data.totalUsers;
  document.querySelector('.status-item:nth-child(2) .value').textContent = data.activeEvents;
  // etc.
});
*/
});
