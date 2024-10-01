i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'es',
        backend: {
            loadPath: '/locales/{{lng}}.json' // Path to your JSON translation files
        }
    }, function (err, t) {
        if (err) {
            console.error('Error initializing i18next:', err);
            return;
        }
        // Translate content
        updateContent();
    });

function updateContent() {
    $('[data-i18n]').each(function () {
        var key = $(this).data('i18n');
        var translation = i18next.t(key);
        $(this).text(translation);
    });
}

// Switch language on button click
$('#switch-language').on('click', function () {
    var currentLang = i18next.language;
    var newLang = currentLang === 'es' ? 'en-US' : 'es'; // Toggle between 'es' and 'en'
    i18next.changeLanguage(newLang, function (err, t) {
        if (err) return console.error(err);
        updateContent();
    });
});

document.addEventListener("DOMContentLoaded", () => {

  // Function to check if cookies are accepted
  function checkCookiesAcceptance() {
    return document.cookie.split(';').some((item) => item.trim().startsWith('cookiesAccepted='));
  }

  // Function to set the cookie
  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/`;
  }

  const cookieBanner = document.getElementById('cookie-banner');
  const acceptCookiesButton = document.getElementById('accept-cookies');
  const learnMoreCookiesButton = document.getElementById('learn-more-cookies');

  // Show the cookie banner if cookies are not accepted
  if (!checkCookiesAcceptance()) {
    cookieBanner.style.display = 'flex';
  }

  // Set the cookie when the user accepts
  acceptCookiesButton.addEventListener('click', () => {
    setCookie('cookiesAccepted', 'true', 365); // Cookie expires in 1 year
    cookieBanner.style.display = 'none';
  });


  learnMoreCookiesButton.addEventListener('click', () => { 
    window.open('/cookie-policy.html', '_blank');
  });


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

// Function to show the cookie banner
function showCookieBanner() {
  console.log('showCookieBanner function called');
  const cookieBanner = document.getElementById('cookieBanner');
  const overlay = document.getElementById('overlay');
  if (cookieBanner && overlay) {
      cookieBanner.style.display = 'block';
      overlay.style.display = 'block';
  } else {
      console.error('Cookie banner or overlay element not found');
  }
}

// Function to hide the cookie banner
function acceptCookies() {
  console.log('acceptCookies function called');
  const cookieBanner = document.getElementById('cookieBanner');
  const overlay = document.getElementById('overlay');
  if (cookieBanner && overlay) {
      cookieBanner.style.display = 'none';
      overlay.style.display = 'none';
      localStorage.setItem('cookiesAccepted', 'true');
  } else {
      console.error('Cookie banner or overlay element not found');
  }
}

// Function to check if cookies have been accepted
function checkCookiesAcceptance() {
  console.log('checkCookiesAcceptance function called');
  showCookieBanner();
}

// Run the check when the page loads

