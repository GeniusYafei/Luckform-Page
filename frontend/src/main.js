import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
// ==================== DOM ELEMENTS ====================

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

// Show the selected page and update the URL hash if needed
const showPage = (pageName, updateHash = true) => {
    // Hide all pages first
    loginPage.style.display = 'none';
    registerPage.style.display = 'none';
    homePage.style.display = 'none';

    // Update URL hash for routing (optional)
    if (updateHash) {
        if (pageName === 'login') {
            window.location.hash = '/auth/login';
        } else if (pageName === 'register') {
            window.location.hash = '/auth/register';
        } else if (pageName === 'home') {
            window.location.hash = '/job/feed';
        }
    }

    // Display the selected page
    if (pageName === 'login') {
        loginPage.style.display = 'block';
    } else if (pageName === 'register') {
        registerPage.style.display = 'block';
    } else if (pageName === 'home') {
        homePage.style.display = 'block';
        fetchFeed(); // Load job feed when entering home page
    }
};

// Listen for hash changes in the URL (e.g., back/forward buttons)
window.addEventListener('hashchange', () => {
    routeToPage();
});

// Determine which page to display based on URL hash
const routeToPage = () => {
    const hash = window.location.hash;
    if (hash === '#/auth/login') {
        showPage('login', false);
    } else if (hash === '#/auth/register') {
        showPage('register', false);
    } else if (hash === '#/job/feed') {
        showPage('home', false);
    } else {
        // Default page (login)
        showPage('login', false);
    }
};

// Page jump Eventlistener
registerButton.addEventListener('click', () => showPage('register'));
goToLoginButton.addEventListener('click', () => showPage('login'));
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    showPage('login');
});


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

// Initial page display
if (localStorage.getItem('token')) {
    showPage('home');
} else {
    showPage('login');
}
