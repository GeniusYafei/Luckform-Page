import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// ==================== DOM ELEMENTS ====================
import { showNotification } from './notification.js';

// Login page elements
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('LoginPassword');
const loginButton = document.getElementById('LoginButton');
const registerButton = document.getElementById('RegisterButton');
const logoutButton = document.getElementById('LogoutButton')

// Register page elements
const registerEmail = document.getElementById('registerEmail');
const registerName = document.getElementById('registerName');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('ConfirmPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const submitButton = document.getElementById('SubmitButton');
const goToLoginButton = document.getElementById('GoToLogin');

// Error popup elements
const errorPopup = document.getElementById('errorPopup');
const errorMessage = document.getElementById('errorMessage');
const closeErrorPopup = document.getElementById('closeErrorPopup');

// Page containers
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const homePage = document.getElementById('homePage');

// ==================== ERROR POPUP FUNCTIONS ====================

// Error function showing
// Show error popup with a custom message
const showErrorPopup = (message) => {
    errorMessage.innerText = message;
    errorPopup.classList.remove('hide');
};

// Close error popup when close button is clicked
closeErrorPopup.addEventListener('click', () => {
    errorPopup.classList.add('hide');
});

// ==================== PAGE NAVIGATION ====================

// Define the hash routes for each page
const ROUTES = {
    login: '/auth/login',
    register: '/auth/register',
    home: '/job/feed',
};

// Store page DOM elements in an object for easier access
const pages = {
    login: loginPage,
    register: registerPage,
    home: homePage,
};

// Show the selected page and optionally update the URL hash
const showPage = (pageName, updateHash = true) => {
    // Hide all pages
    Object.values(pages).forEach(page => (page.style.display = 'none'));

    // Update URL hash if needed
    if (updateHash) {
        window.location.hash = ROUTES[pageName];
    }

    // Display the selected page
    pages[pageName].style.display = 'block';

    // If the home page is displayed, load the job feed
    if (pageName === 'homePage') {
        fetchFeed();
    }
};

// Route to the correct page based on the current URL hash
const routeToPage = () => {
    let hash = window.location.hash;
    // If hash is empty or just '#' then update it to the default login route
    if (!hash || hash === '#') {
        window.location.hash = ROUTES.login;
        return;
    }
    // Loop through ROUTES to find a matching route
    for (const [page, route] of Object.entries(ROUTES)) {
        if (hash === '#' + route) {
            return showPage(page, false);
        }
    }
    // If no route matches, update to default login route
    return showPage('login');
};

// On page load, set the default hash if needed and route accordingly
window.addEventListener('load', () => {
    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = ROUTES.login;
    }
    routeToPage();
});

// Listen for hash changes (e.g., when using back/forward buttons)
window.addEventListener('hashchange', routeToPage);

// ==================== NAVIGATION BUTTON EVENT LISTENERS ====================

// When the register button is clicked, update the hash to trigger the register page
registerButton.addEventListener('click', () => {
    window.location.hash = ROUTES.register;
});

// When the "back to login" button is clicked, update the hash to trigger the login page
goToLoginButton.addEventListener('click', () => {
    window.location.hash = ROUTES.login;
});

// When logout is clicked, clear the token and navigate to the login page
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token'); // Clear saved token
    window.location.hash = ROUTES.login;
});

// Toggle password visibility for registration
toggleConfirmPassword.addEventListener('click', function () {
    let confirmType = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    let registerType = registerPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPassword.setAttribute('type', confirmType);
    registerPassword.setAttribute('type', registerType);
    this.textContent = confirmType === 'password' ? 'Show' : 'Hide';
});

// Registration submission
submitButton.addEventListener('click', () => {
    const email = registerEmail.value.trim();
    const name = registerName.value.trim();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'warning');
        return;
    }

    // Name length validation
    if (name.length < 3 || name.length > 50) {
        showNotification('Full name must be between 3 and 50 characters.', 'warning');
        return;
    }

    // Password strength validation
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'warning');
        return;
    }

    // Password consistency check
    if (password !== confirm) {
        showNotification('Passwords do not match.', 'warning');
        return;
    }

    // Submit registration request
    fetch('http://192.168.1.101:5005/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                alert('Registered!');
                showPage('home');
            } else {
                showNotification(data.error || 'Registration failed.', 'error');
            }
        })
        .catch(err => {
            console.error('Register Error:', err);
            showNotification('Network error. Please try again later.', 'error');
        });
});

// Login submission
loginButton.addEventListener('click', () => {
    fetch('http://192.168.1.101:5005/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: loginEmail.value,
            password: loginPassword.value,
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                alert('Logged in!');
                showPage('home');
            } else {
                showNotification(data.error ?? 'Login failed', 'error');
            }
        });
});

// ==================== INITIALIZATION ====================

// Determine initial page based on URL or saved token
if (localStorage.getItem('token')) {
    window.location.hash = '/job/feed';
}
routeToPage();

// Defines a time formatting function
const formatTime = (createdAtStr) => {
    const now = new Date();
    const jobDate = new Date(createdAtStr);
    const diffMs = now - jobDate;
    const diffHours = Math.floor(diffMs / 3600000); // 1hours = 3600000 millisecond

    // Determine the time of job Posting
    if (diffHours < 24) {
        const diffMinutes = Math.floor((diffMs % 3600000) / 60000); // become the minutes
        return `${diffHours}hour${diffMinutes}minutes ago`;
    } else {
        const day = String(jobDate.getDate()).padStart(2, '0');
        const month = String(jobDate.getMonth() + 1).padStart(2, '0');
        const year = jobDate.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// Define the function that loads the JobFeed (homepage)
const fetchFeed = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        showErrorPopup('Please log in first');
        showPage('login');
        return;
    }

    fetch(`http://192.168.1.101:5005/job/feed?start=0`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }).then(response => {
        console.log(response)
        if (response.status === 403) {
            localStorage.removeItem('token');
            showPage('login');
            throw new Error('Login expired');
        }
        return response.json();
    })
        .then(data => {
            displayJobs(data);
        })
        .catch(error => {
            showErrorPopup(error.message);
        })
        .then(console.log(`${token}`))
}

const displayJobs = (jobs) => {
    const container = document.getElementById('feedContainer');
    container.innerHTML = ''; // initial the content

    jobs.forEach(job => {
        const jobElement = document.createElement('div');
        jobElement.className = 'job-item';

        // title
        const title = document.createElement('h2');
        title.innerText = job.title;
        jobElement.appendChild(title);

        // Publisher (assuming the API returns creatorId, we need to get the username)
        const creator = document.createElement('p');
        creator.innerText = `Publisher: User ID ${job.creatorId}`;
        jobElement.appendChild(creator);

        // Pub date time
        const time = document.createElement('p');
        time.innerText = `Date time:${formatTime(job.createdAt)}`;
        jobElement.appendChild(time);

        // Image
        if (job.image) {
            const image = document.createElement('img');
            image.src = job.image;
            jobElement.appendChild(image);
        }

        // Description
        const description = document.createElement('p');
        description.innerText = job.description;
        jobElement.appendChild(description);

        // Number of likes
        const likes = document.createElement('p');
        likes.innerText = `Like: ${job.likes.length}`;
        jobElement.appendChild(likes);

        // Number of comments
        const comments = document.createElement('p');
        comments.innerText = `number of comments${job.comments.length}`;
        jobElement.appendChild(comments);

        container.appendChild(jobElement);
    });
}
