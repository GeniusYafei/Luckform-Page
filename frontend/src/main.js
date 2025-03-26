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
const jobTitle = document.getElementById('jobTitle')
const jobStartDate = document.getElementById('jobStartDate');
const jobDescription = document.getElementById('jobDescription');
const jobImage = document.getElementById('jobImage')
const closeModal = document.getElementById('closeModal');
const cancelPost = document.getElementById('cancelPost');
const confirmPost = document.getElementById('confirmPost')
const previewContainer = document.getElementById('jobImagePreview');

// Job feed Dom elements
const avatarLetter = document.getElementById('avatarLetter');
const profileName = document.getElementById('profileName');
const profileMenuButton = document.getElementById('profileMenuButton');

// Page containers
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const homePage = document.getElementById('homePage');

// Token
const token = localStorage.getItem('token');
// userId
const currentUserId = localStorage.getItem('userId');
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
        method: 'GET',
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
};

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

jobImage.addEventListener('change', (event) => {
    const imageFile = event.target.files[0];
    if (!imageFile) return;

    fileToDataUrl(imageFile).then(fileBase64 => {
        const img = document.createElement('img');
        img.src = fileBase64;
        img.className = 'preview-image';
        img.alt = 'job-image-preview';
        while (previewContainer.firstChild) {
            previewContainer.removeChild(previewContainer.firstChild);
        }
        previewContainer.appendChild(img);
    })
});

confirmPost.addEventListener('click', () => {
    const title = jobTitle.value;
    const description = jobDescription.value;
    const startDateStr = jobStartDate.value;
    const imageFile = jobImage.files[0];
    const [inputDay, inputMonth, inputYear] = startDateStr.split('/').map(num => parseInt(num, 10));
    const inputDate = new Date(inputYear, inputMonth - 1, inputDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!title) return showNotification('Job Title cannot be empty.', 'error');
    if (!startDateStr) {
        showNotification('Job Start Date is required.', 'error');
        return;
    } else {
        // validate the Date
        if (!/[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(jobStartDate.value)) {
            showNotification('Invalid date format. Please use DD/MM/YYYY.', 'info');
            return;
        }
        // validate the date
        if (inputMonth < 1 || inputMonth > 12) {
            showNotification('Please input a valid date', 'info');
            return;
        }
        // Calculate the number of days in the month
        const daysInMonth = new Date(inputYear, inputMonth, 0).getDate();
        if (inputDay < 1 || inputDay > daysInMonth) {
            showNotification('Please input a valid date', 'info');
            return;
        }
        if (inputDate < today) {
            showNotification("Job Start Date can't be earlier than today.", 'error');
            return;
        }
    };
    if (!description) return showNotification('Job Description cannot be empty.', 'error');
    if (!imageFile) return showNotification('Please upload a Job Image.', 'error');

    // Convert image to base64 and submit
    fileToDataUrl(imageFile).then(imageBase64 => {
        const data = {
            title,
            description,
            start: inputDate.toISOString(), // ISO 8601 format
            image: imageBase64
        };

        fetch(`${BACKEND_URL}/job`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    showNotification(data.error, 'error');
                    return;
                }
                showNotification('Post a job success!', 'success');
                console.log('Success', data);
                fetchFeed(); // Refresh the feed
                postJobModal.classList.add('hide');
            });
    });
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

const createJobCard = (job, index) => {
    const card = document.createElement('div');
    card.className = 'job-card';

    const title = document.createElement('h2');
    title.textContent = job.title;
    card.appendChild(title);

    const header = document.createElement('div');
    header.className = 'header-information';

    const sidebarUser = document.getElementById('userSidebar')

    fetch(`${BACKEND_URL}/user/?userId=${currentUserId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }

            // empty sidebarUser content and
            while (sidebarUser.firstChild) {
                sidebarUser.removeChild(sidebarUser.firstChild);
            }

            if (data.img) {
                const img = document.createElement('img');
                img.src = data.img;
                img.alt = 'User Avatar';
                img.className = 'avatar-img';
                sidebarUser.appendChild(img);
            } else {
                const fallback = document.createElement('div');
                fallback.className = 'avatar-fallback';
                fallback.textContent = data.name[0]?.toUpperCase();
                sidebarUser.appendChild(fallback);
            }

            // user name
            const name = document.createElement('h2');
            name.textContent = data.name || 'User';
            sidebarUser.appendChild(name);

            // user email
            const email = document.createElement('p');
            email.textContent = data.email || '';
            sidebarUser.appendChild(email);

            // Set the top avatar letter or picture
            if (data.img) {
                // Clear old avatar letters
                while (profileMenuButton.firstChild) {
                    profileMenuButton.removeChild(profileMenuButton.firstChild);
                }
                const img = document.createElement('img');
                img.src = data.img;
                img.alt = 'avatar';
                img.className = 'avatar-img';
                profileMenuButton.appendChild(img);
            } else {
                avatarLetter.textContent = data.name[0]?.toUpperCase();
            }

        })
        .catch(err => {
            console.error('Failed to load user info:', err);
        });


    fetch(`${BACKEND_URL}/user?userId=${job.creatorId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }).then(res => res.json())
        .then(data => {
            const avatarWrapper = document.createElement('div');
            avatarWrapper.className = 'avatar-wrapper';

            if (data.img) {
                const avatar = document.createElement('img');
                avatar.src = data.img;
                avatar.alt = 'avatar';
                avatar.className = 'user-avatar';
                avatarWrapper.appendChild(avatar);
            } else {
                const avatarLetter = document.createElement('div');
                avatarLetter.className = 'avatar-letter';
                avatarLetter.textContent = data.name[0].toUpperCase();
                avatarWrapper.appendChild(avatarLetter);
            }

            const authorInfo = document.createElement('div');
            authorInfo.className = 'author-info';

            const name = document.createElement('p');
            name.textContent = data.name;
            name.className = 'author-name';

            const time = document.createElement('p');
            time.textContent = formatTime(job.createdAt);
            time.className = 'post-time';

            authorInfo.appendChild(name);
            authorInfo.appendChild(time);

            header.appendChild(avatarWrapper);
            header.appendChild(authorInfo);

            card.insertBefore(header, title); // header before title
        });

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

    let liked = !!job.likes?.find(user => user.userId === Number(currentUserId));
    let likeCount = job.likes.length;
    const updateLikeButton = () => {
        likesButton.textContent = `${liked ? 'Like ❤️' : 'Like ❤️'} ${likeCount}`;
        likesButton.className = liked ? 'like-button btn-primary' : 'like-button btn-outline-primary';
    };

    // delete button logic
    if (Number(currentUserId) === job.creatorId) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';

        const deleteIcon = document.createElement('img');
        deleteIcon.src = 'styles/deleteicon.svg';
        deleteIcon.alt = 'Delete';
        deleteIcon.className = 'delete-icon';

        const deleteIconHover = document.createElement('img');
        deleteIconHover.src = 'styles/deleteicon-hover.svg';
        deleteIconHover.alt = 'Delete';
        deleteIconHover.className = 'delete-icon-hover';

        deleteButton.appendChild(deleteIcon);
        deleteButton.appendChild(deleteIconHover);
        card.appendChild(deleteButton);
        // delete button Eventlistener
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this post?')) {
                fetch(`${BACKEND_URL}/job`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        id: job.id
                    })
                }).then(res => res.json())
                    .then(data => {
                        if (data && data.error) {
                            showNotification(data.error, 'error');
                            return;
                        }
                        showNotification('successfully deleted!', 'success');
                        fetchFeed();
                    })
                    .catch(() => {
                        showNotification('Network error', 'error');
                    });
            }
        });
    };
    updateLikeButton();

    // likesButton Eventlistener
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

    jobs.forEach((job, index) => {
        const jobCard = createJobCard(job, index);
        container.appendChild(jobCard);
    });
}
