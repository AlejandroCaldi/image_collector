const secretKey = 'claveSecreta123'; -> Esta clave ha de cambiarse


// Función para establecer una cookie cifrada
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; Secure; SameSite=Strict";
}


// Función para cifrar datos utilizando AES
function encryptData(data, secretKey) {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
}


// Función para manejar el formulario cuando el usuario hace clic en "Iniciar Sesión"
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();  // Previene la recarga de la página al enviar el formulario


    // Recoge los valores de los campos de entrada
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;


    // Cifra el nombre de usuario y la contraseña
    const encryptedUsername = encryptData(username, secretKey);
    const encryptedPassword = encryptData(password, secretKey);


    // Establece las cookies cifradas con una duración de 7 días
    setCookie('encryptedUsername', encryptedUsername, 7);
    setCookie('encryptedPassword', encryptedPassword, 7);


    // Confirmación en consola de que se han guardado las cookies (no mostraría estos datos en producción)
    console.log('Usuario y contraseña cifrados guardados en cookies.');
});
