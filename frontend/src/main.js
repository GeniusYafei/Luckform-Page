import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// get all elements DOM
// All login page DOM elements
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('LoginPassword');
const loginButton = document.getElementById('LoginButton');
const registerButton = document.getElementById('RegisterButton');
const logoutButton = document.getElementById('LogoutButton')

// All register page DOM elements
const registerEmail = document.getElementById('registerEmail');
const registerName = document.getElementById('registerName');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('ConfirmPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const submitButton = document.getElementById('SubmitButton');
const goToLoginButton = document.getElementById('GoToLogin');

// All Error popup DOM elements
const errorPopup = document.getElementById('errorPopup');
const errorMessage = document.getElementById('errorMessage');
const closeErrorPopup = document.getElementById('closeErrorPopup');

// Pages container DOM elements
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const homePage = document.getElementById('homePage');

// Error function showing
function showErrorPopup(message) {
    errorMessage.innerText = message;
    errorPopup.classList.remove('hide');
}

// closing the Error page
closeErrorPopup.addEventListener('click', () => {
    errorPopup.classList.add('hide');
});

// Page jump Eventlistener
registerButton.addEventListener('click', () => showPage('register'));
goToLoginButton.addEventListener('click', () => showPage('login'));
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    showPage('login');
});

// Page jump function
function showPage(pageName) {
    loginPage.style.display = 'none';
    registerPage.style.display = 'none';
    homePage.style.display = 'none';

    if (pageName === 'login') loginPage.style.display = 'block';
    if (pageName === 'register') registerPage.style.display = 'block';
    if (pageName === 'home') homePage.style.display = 'block';
}

// Register button Eventlistener
submitButton.addEventListener('click', () => {
    // validate the email name password, first get their value
    const email = registerEmail.value.trim();
    const name = registerName.value.trim();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;

    // validate the format of email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showErrorPopup('Please enter a valid email address.');
        return;
    }
    // validate the format length of name
    if (name.length < 3 || name.length > 50) {
        showErrorPopup('Full name must be between 3 and 50 characters.');
        return;
    }
    // validate the password security strength
    if (password.length < 6) {
        showErrorPopup('Password must be at least 6 characters long.');
        return;
    }
    // Two password consistency checks
    if (password !== confirm) {
        showErrorPopup('Passwords do not match.');
        return;
    }

    // If all validations are passed, call the registration API
    fetch('http://192.168.1.101:5005/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: registerEmail.value,
            password: registerPassword.value,
            name: registerName.value,
        }),
    }).then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                alert('Registered!');
                showPage('home');
            } else {
                // The back end returned an error and error popup
                showErrorPopup(data.error || 'Registration failed.');
            }
        })
        .catch(err => {
            console.error('Register Error:', err);
            showErrorPopup('Network error. Please try again later.');
        });
});

// show or hide the registerPassword
toggleConfirmPassword.addEventListener('click', function () {
    let type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    let types = registerPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPassword.setAttribute('type', type);
    registerPassword.setAttribute('type', types);
    this.textContent = type === 'password' ? 'Show' : 'Hide';
});

// Login button Eventlistener
loginButton.addEventListener('click', () => {
    fetch('http://192.168.1.101:5005/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: loginEmail.value,
            password: loginPassword.value,
        }),
    }).then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                alert('Logged in!');
                showPage('home');
            } else {
                showErrorPopup(data.error ?? 'Login failed');
            }
        });
});

// Initial page display
if (localStorage.getItem('token')) {
    showPage('home');
} else {
    showPage('login');
}
