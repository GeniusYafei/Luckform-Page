import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// get all elements DOM
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('LoginPassword');
const loginButton = document.getElementById('LoginButton');
const registerButton = document.getElementById('RegisterButton');
const logoutButton = document.getElementById('LogoutButton')

const registerEmail = document.getElementById('registerEmail');
const registerName = document.getElementById('registerName');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('ConfirmPassword');
const submitButton = document.getElementById('SubmitButton');
const goToLoginButton = document.getElementById('GoToLogin');


// Pages container
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const homePage = document.getElementById('homePage');

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
    if (registerPassword.value !== confirmPassword.value) {
        alert('Passwords do not match');
        return;
    }

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
                alert('Registration failed: ' + data.error);
            }
        });
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
                alert('Login failed: ' + data.error);
            }
        });
});


// Page jump Eventlistener
registerButton.addEventListener('click', () => showPage('register'));
goToLoginButton.addEventListener('click', () => showPage('login'));
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('token');
  showPage('login');
});


// Initial page display
if (localStorage.getItem('token')) {
    showPage('home');
} else {
    showPage('login');
}
