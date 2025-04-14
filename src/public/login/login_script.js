document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("signup-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const form = e.target;

      const data = {
        username: form.username.value,
        name: form.name.value,
        email: form.email.value,
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
      };
      console.log("data \n", JSON.stringify(data));

      if (data.password !== data.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      try {
        const response = await fetch("../../php/register.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        // Swal alert is used for better UI.
        Swal.fire({
          icon: "success",
          title: "Account created!",
          text: "You have successfully registered.",
        }).then(function () {
          window.location = "index.html";
        });
        //alert(result.message || "Signup complete.");
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
        //alert("Something went wrong.");
      }
    });
});
