document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the default form submission

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

      if (response.ok) {
        // Redirect on successful login, passing the username
        console.log("username: " + data.username);
        window.location.href = `/scraper.html?username=${encodeURIComponent(data.username)}`;
      } else {
        alert(data.message); // Show error message
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during login.");
    }
  });

  // Creación de usuario.
  document.getElementById('create_user').onsubmit = async function(event) { // Make this function async
    event.preventDefault(); // Prevent default form submission first

    const username = document.getElementById('create_username').value;
    const email = document.getElementById('create_email').value;
    const password = document.getElementById('create_password').value;
    const confPassword = document.getElementById('create_password2').value; // Correct reference
    const mensajeError = document.getElementById('mensajeError');

    mensajeError.textContent = '';

    // Validación de longitud del nombre de usuario
    if (username.length < 5) {
      mensajeError.textContent = 'Username must have at least 5 characters.';
      mensajeError.style.visibility="visible";
      return;
    }

    // Validación de formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mensajeError.textContent = 'It must be a valid email address.';
      mensajeError.style.visibility="visible";
      return;
    }

    // Validación de longitud de la contraseña
    if (password.length < 8) {
      mensajeError.textContent = 'Password must have at least 8 characters.';
      mensajeError.style.visibility="visible";
      return;
    }

    // Validar que la contraseña tenga letras, al menos una mayúscula, al menos un número y un carácter especial
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':",.<>\/?]{12,}$/;
    if (!passRegex.test(password)) {
      mensajeError.textContent = 'Password must contain at least an UPPERCASE letter, a lowercase letter, a number, a special character, and at least 12 characters';
      mensajeError.style.visibility="visible";
      return;
    }

    // Check if passwords match
    if (password !== confPassword) { // Correct variable reference
      alert('Las contraseñas no coinciden');
      return;
    }

    // Proceed with registration if all validations pass
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password }) // Include username in the body
      });

      const result = await response.json();
      alert(result.message);

 
    } catch (error) {
      console.error('Error: ', error);
    }


  };
});
