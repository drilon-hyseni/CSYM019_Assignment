document.addEventListener("DOMContentLoaded", () => {
  const userList = document.getElementById("user-list");

  fetch("php/backend.php")
    .then((response) => response.json())
    .then((users) => {
      users.forEach((user) => {
        const userDiv = document.createElement("div");
        userDiv.textContent = `${user.username} (${user.email})`;
        userList.appendChild(userDiv);
      });
    })
    .catch((error) => {
      console.error("Error:", error);
      userList.textContent = "Failed to load users";
    });
});
