document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the default form submission
    console.log("Form submitted"); // Log when the form is submitted

    const email = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data); // Log the response data

      if (response.ok) {
        // Redirect on successful login
        window.location.href = data.redirectTo;
      } else {
        alert(data.message); // Show error message
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during login.");
    }
  });
});
