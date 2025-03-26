import { BACKEND_URL } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
import { showNotification } from './notification.js';

// ==================== DOM ELEMENTS ====================

// Login page elements
const loginEmail = document.getElementById('LoginEmail');
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

// Job page elements
const profileButton = document.getElementById('profileMenuButton');
const profileMenu = document.getElementById('profileMenu');

// Post Job DOM elements
const postJobModal = document.getElementById('postJobModal');
const btnPostJob = document.getElementById('postJobButton');
const closeModal = document.getElementById('closeModal');
const cancelPost = document.getElementById('cancelPost');

// Page containers
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const homePage = document.getElementById('homePage');

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

// Define the function that loads the JobFeed (homepage)
const fetchFeed = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Please log in first', 'error');
        showPage('login');
        return;
    }

    fetch(`${BACKEND_URL}/job/feed?start=0`, {
        // method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            console.log('job list: ', data)
            renderJobFeed(data);
        })
        .catch(err => {
            showNotification(err.message, 'error');
        });
}

// Toggle on click
profileButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevents bubbling, preventing click events that trigger the document
    profileMenu.classList.toggle('hide');
});

// Hide the menu when click elsewhere on the page
document.addEventListener('click', (event) => {
    if (!profileMenu.classList.contains('hide')) {
        profileMenu.classList.add('hide');
    }
});

// Preventing clicking on the menu itself also triggers hiding
profileMenu.addEventListener('click', (event) => {
    event.stopPropagation();
});

// Show the selected page and optionally update the URL hash
let currentPage = null;
const showPage = (pageName, updateHash = true) => {
    if (currentPage === pageName) {
        return;
    }
    // Hide all pages
    Object.values(pages).forEach(page => (page.style.display = 'none'));

    // Update URL hash if needed
    if (updateHash) {
        const targetHash = '#' + ROUTES[pageName];
        if (window.location.hash !== targetHash) {
            window.location.hash = targetHash;
        }
    }

    // Display the selected page
    pages[pageName].style.display = 'block';
    currentPage = pageName;

    // If the home page is displayed, load the job feed
    if (pageName === 'home') {
        fetchFeed();
    }
};

// Route to the correct page based on the current URL hash
const routeToPage = () => {
    const hash = window.location.hash;
    const token = localStorage.getItem('token');
    // If hash is empty or just '#', go to login
    if (!hash || hash === '#') {
        window.location.hash = ROUTES.login;
        return;
    }

    // Loop through ROUTES to find a match
    for (const [page, route] of Object.entries(ROUTES)) {
        if (hash === '#' + route) {
            // If accessing home page but no token, redirect to login
            if (page === 'home' && !token) {
                showNotification('Please log in first.', 'error');
                window.location.hash = ROUTES.login;
                return;
            }
            return showPage(page, false);
        }
    }

    // If no route matches, update to default login route
    window.location.hash = ROUTES.login;
};

// On page load, set the default hash if needed and route accordingly
window.addEventListener('load', () => {
    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = ROUTES.login;
    } else {
        routeToPage();
    }
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
    showNotification('Logged out!', 'info')
    setTimeout(() => {
        localStorage.removeItem('token'); // Clear saved token
        window.location.hash = ROUTES.login;
    }, 100);
});

// Toggle password visibility for registration
toggleConfirmPassword.addEventListener('click', () => {
    let confirmType = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    let registerType = registerPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPassword.setAttribute('type', confirmType);
    registerPassword.setAttribute('type', registerType);
    this.textContent = confirmType === 'password' ? 'Show' : 'Hide';
});

// When user want post a new job click the Post a Job button
btnPostJob.addEventListener('click', () => {
    postJobModal.classList.remove('hide');
});

// User can closed the modal of Post
closeModal.addEventListener('click', () => {
    postJobModal.classList.add('hide');
});

// User also can cancel Post
cancelPost.addEventListener('click', () => {
    postJobModal.classList.add('hide');
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
    fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                showNotification('Registered!', 'success');
                showPage('login');
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
    const email = loginEmail.value;
    const password = loginPassword.value;

    fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
        .then(res => res.json())
        .then(data => {
            if (!data.token) {
                showNotification(data.error ?? 'Login failed', 'error');
                return Promise.reject('No token returned');
            }

            // If the login succeeds, save the token and userId
            console.log('userId:', data.userId);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('token', data.token);

            // later usersWhoWatch
            return fetch(`${BACKEND_URL}/user/watch`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`
                },
                body: JSON.stringify({ email, turnon: true }),
            });
        })
        .then(res => res.json())
        .then(result => {
            if (result?.error) {
                console.log('Watch error:', result.error);
                showNotification(result.error, 'error');
                return;
            }

            // Log in and watch successfully
            showNotification('Logged in!', 'success');
            showPage('home');
        })
        .catch(err => {
            console.error('Login flow error:', err);
            showNotification('Something went wrong during login.', 'error');
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

const createJobCard = (job) => {
    const token = localStorage.getItem('token');
    const card = document.createElement('div');
    card.className = 'job-card';

    const title = document.createElement('h2');
    title.textContent = job.title;
    card.appendChild(title);

    const author = document.createElement('p');
    author.textContent = `Posted by: ${job.userId}`;
    card.appendChild(author);

    const time = document.createElement('p');
    // const formattedDate = new Date(job.createdAt).toLocaleString();
    const formattedDate = formatTime(job.createdAt)
    time.textContent = `Posted at: ${formattedDate}`;
    card.appendChild(time);

    if (job.image) {
        const img = document.createElement('img');
        img.className = 'id-img'
        img.src = job.image;
        img.alt = 'Job image';
        card.appendChild(img);
    }

    const desc = document.createElement('p');
    desc.textContent = job.description;
    card.appendChild(desc);

    const likesButton = document.createElement('button');
    likesButton.textContent = `Like ❤️ ${job.likes.length}`;
    likesButton.className = 'like-button';
    card.appendChild(likesButton);

    const currentUserId = localStorage.getItem('userId');
    let liked = !!job.likes?.find(user => user.userId === Number(currentUserId));
    let likeCount = job.likes.length;
    const updateLikeButton = () => {
        likesButton.textContent = `${liked ? 'Like ❤️' : 'Like ❤️'} ${likeCount}`;
        likesButton.className = liked ? 'like-button btn-primary' : 'like-button btn-outline-primary';
    };

    updateLikeButton();

    likesButton.addEventListener('click', () => {
        fetch(`${BACKEND_URL}/job/like`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id: job.id,
                turnon: !liked,
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.error) {
                    showNotification(data.error, 'error');
                    return;
                }

                liked = !liked;
                likeCount += liked ? 1 : -1;
                updateLikeButton();
                showNotification(liked ? 'Liked!' : 'Unliked!', 'success');
            })
            .catch(() => {
                showNotification('Network error', 'error');
            });
    });

    const commentsButton = document.createElement('button');
    commentsButton.textContent = `Comment 💬 ${job.comments.length}`;
    commentsButton.className = 'comment-button';
    card.appendChild(commentsButton);

    return card;
}


const renderJobFeed = (jobs) => {
    const container = document.getElementById('feedContainer');

    // Clear previous content
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    jobs.forEach(job => {
        const jobCard = createJobCard(job);
        container.appendChild(jobCard);
    });
}
