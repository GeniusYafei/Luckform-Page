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
const logoutButton = document.querySelectorAll('.LogoutButton');

// Register page elements
const registerEmail = document.getElementById('registerEmail');
const registerName = document.getElementById('registerName');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('ConfirmPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const submitButton = document.getElementById('SubmitButton');
const goToLoginButton = document.getElementById('GoToLogin');

// UserButton DOM elements
const profileButton = document.querySelectorAll('.avatar-button');
const profileMenu = document.querySelectorAll('.profile-dropdown');
const viewProfile = document.querySelectorAll('.viewProfile');
const toggleConfirmPasswordUpdate = document.getElementById('toggleConfirmPasswordUpdate');

// Post Job DOM elements
const postJobModal = document.getElementById('postJobModal');
const updateJobModal = document.getElementById('updateJobModal');
const btnPostJob = document.querySelectorAll('.postJobButton');
const jobTitle = document.getElementById('jobTitle');
const jobTitleUp = document.getElementById('jobTitle-update');
const jobStartDate = document.getElementById('jobStartDate');
const jobStartDateUp = document.getElementById('jobStartDate-update');
const jobDescription = document.getElementById('jobDescription');
const jobDescriptionUp = document.getElementById('jobDescription-update');
const jobImage = document.getElementById('jobImage');
const jobImageUp = document.getElementById('jobImage-update');
const closeModal = document.querySelectorAll('.close-button');
const cancelPost = document.querySelectorAll('.cancel');
const confirmPost = document.getElementById('confirmPost');
const confirmPostUp = document.getElementById('confirmUpdate');
const previewContainer = document.getElementById('jobImagePreview');
const previewContainerUp = document.getElementById('jobImagePreview-update');

// Job feed header Dom elements
const searchUserHome = document.getElementById('searchUser-home');
const searchUserProfile = document.getElementById('searchUser-profile');
const searchButtonHome = document.querySelector('#homePage .search-button');
const searchButtonProfile = document.querySelector('#profilePage .search-button');
const logoPart = document.querySelectorAll('.logo-container');
const homeButton = document.querySelectorAll('.home-icon');
const notificationIcon = document.querySelectorAll('.notification-button');
const notificationPanel = document.getElementById('notificationPanel');

// profile Page elements
const profileModel = document.getElementById('updateProfileModal');
const updateButton = document.querySelector('.Updating');
const watchButton = document.getElementById('watchButton');
const confirmUpButton = document.getElementById('confirmUserUpdate');
const userImage = document.getElementById('userImage');
const userImagePreview = document.getElementById('avatarImagePreview');

// Page containers
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const homePage = document.getElementById('homePage');
const profilePage = document.getElementById('profilePage');

// Declarative variable
let currentStartIndex = 0;
let isLoadingJobs = false;
let allJobsLoaded = false;
let pushInterval = null;
let pollingInterval = null;
let lastRenderedUserId = null;
let currentPage = null;
const loadedJobs = [];
const recentNotifications = [];
const seenJobIds = new Set();
const renderedUserIds = new Set();

// ==================== apiCall FUNCTION ====================
const apiCall = ({ url, method = 'GET', token = true, body = null }) => {

    if (!navigator.onLine) {
        showNotification('You are offline. This action cannot be completed.', 'error');
        return Promise.reject(new Error('Offline mode'));
    }

    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        const savedToken = localStorage.getItem('token');
        if (!savedToken) {
            showNotification('Please log in first.', 'error');
            showPage('login');
            return Promise.reject('No token found');
        }
        headers['Authorization'] = `Bearer ${savedToken}`;
    }

    // Supports GET, POST, PUT, DELETE methods
    return fetch(url, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : null
    })
        .then(res => {
            return res.json().then(data => {
                if (!res.ok) {
                    const errorMsg = data.error || 'Unexpected error';
                    showNotification(errorMsg, 'error');
                    return Promise.reject(new Error(errorMsg));
                }
                return data;
            });
        })
        .catch(err => {
            if (err.message === 'Failed to fetch') {
                showNotification('Server is not responding. Please check backend status.', 'error');
            }
            showNotification(err.message || 'Network error', 'error');
            return Promise.reject(err);
        });

};

// ==================== PAGE NAVIGATION ====================
// Define the Modal for post and update
const modals = {
    post: postJobModal,
    update: updateJobModal,
    profile: profileModel
};

// Define the hash routes for each page
const ROUTES = {
    login: 'login',
    register: 'register',
    feed: 'feed',
    profile: 'profile'
};

// Store page DOM elements in an object for easier access
const pages = {
    login: loginPage,
    register: registerPage,
    home: homePage,
    profile: profilePage
};

// funny loading messages
const loadingMessages = [
    'Connecting you to opportunities...',
    'Polishing your feed ✨',
    'Linking you in...',
    'Assembling job cards 🧱',
    'Fetching new posts...',
    'Dusting off your profile 🧹',
    'Recharging the network 💼',
    'Bringing you closer to success 🚀',
];

const updateLoaderText = () => {
    const textElem = document.getElementById('loading-text');
    if (textElem) {
        const message = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        textElem.textContent = message;
    }
}

const showModal = (type) => {
    if (type === 'update') {
        // If you are not currently on the home page, "borrow" the homePage modal
        if (currentPage !== 'home') {
            homePage.classList.remove('hide');
            homePage.classList.add('fake-hide');
        }
    }
    Object.values(modals).forEach(m => m.classList.add('hide'));
    modals[type].classList.remove('hide');
}

// Add a red dot
const markNotificationUnread = () => {
    notificationIcon.forEach(btn => btn.classList.add('new'));
};

// Remove the red dot (after clicking)
const clearNotificationBadge = () => {
    notificationIcon.forEach(btn => btn.classList.remove('new'));
};

// let currentStartIndex = 0;
// let isLoadingJobs = false;
// let allJobsLoaded = false;
// const loadedJobs = [];
// Define the function that loads the JobFeed (homepage)
const homeFeed = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token) {
        showNotification('Please log in first', 'error');

        showPage('login');
        return;
    }

    if (!navigator.onLine) {
        showNotification('You are offline. Showing cached feed.', 'info');
        const cached = localStorage.getItem('cachedFeed');
        if (cached) {
            const jobs = JSON.parse(cached);
            renderJobFeed(jobs, false); // false mean first load
        } else {
            showNotification('No cached feed available.', 'warning');
        }
        return; // don't proceed with API call
    }

    currentStartIndex = 0;
    isLoadingJobs = false;
    allJobsLoaded = false;
    loadedJobs.length = 0;
    document.getElementById('feedContainer').replaceChildren();

    updateTopAvatar();
    renderUser(userId);
    loadMoreJobs(); // load first page
    window.addEventListener('scroll', handleScroll); // start eventlistener for scroll
    startJobPolling();
    startPushNotifications();
};

// Gain all jobs creatorId
const fetchAllFeedCreatorIds = (callback) => {
    const allCreatorIds = new Set();
    let start = 0;

    const fetchNextBatch = () => {
        apiCall({ url: `${BACKEND_URL}/job/feed?start=${start}` })
            .then(jobs => {
                if (!jobs.length) {
                    // ends
                    callback([...allCreatorIds]);
                    return;
                }

                jobs.forEach(job => {
                    if (job.creatorId != null) {
                        allCreatorIds.add(job.creatorId);
                    }
                });

                start += jobs.length;
                fetchNextBatch(); // The recursion continues to pull
            })
            .catch(err => {
                showNotification('Failed to load feed data', 'error');
                console.error(err);
            });
    };

    fetchNextBatch();
};


// infinite scroll features function
const loadMoreJobs = () => {
    if (isLoadingJobs || allJobsLoaded) return;
    isLoadingJobs = true;

    apiCall({ url: `${BACKEND_URL}/job/feed?start=${currentStartIndex}` })
        .then(jobs => {
            if (!jobs.length) {
                allJobsLoaded = true;
                if (currentStartIndex === 0) {
                    // empty when first loaded -> Show empty card
                    renderJobFeed([], false);
                }
                return;
            }

            // After successfully loading jobs
            localStorage.setItem('cachedFeed', JSON.stringify(loadedJobs));

            // Cumulative creatorId (for renderUserWatchlist)
            jobs.forEach(job => {
                if (!loadedJobs.find(j => j.id === job.id)) {
                    loadedJobs.push(job);
                    seenJobIds.add(job.id);
                }
            });

            // In descending order of createdAt time
            loadedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Collect all Creatorids and pass them in
            const allCreatorIds = loadedJobs.map(j => j.creatorId);
            renderUserWatchlist([...new Set(allCreatorIds)]);

            renderJobFeed(jobs, currentStartIndex > 0); // Sets append=false for the first round only
            currentStartIndex += jobs.length; // Add up the offset
        })
        .finally(() => {
            isLoadingJobs = false;
        });
};

const handleScroll = () => {
    const bottomOffset = 300; // Load 300px early
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - bottomOffset) {
        loadMoreJobs();
    }
};

// Define the function that Push notification polling function
// let pushInterval = null;
const startPushNotifications = () => {
    if (pushInterval) clearInterval(pushInterval);

    pushInterval = setInterval(() => {
        if (!navigator.onLine) {
            console.log('[Push] Offline - skipping notification check');
            return;
        }
        apiCall({ url: `${BACKEND_URL}/job/feed?start=0` })
            .then(jobs => {
                // just seen first five to avoid scrolling too much
                jobs.slice(0, 5).forEach(job => {
                    if (!seenJobIds.has(job.id)) {
                        seenJobIds.add(job.id);
                        showInPageNotification(job); // pop-up prompt
                        markNotificationUnread();
                    }
                });
            })
            .catch(err => {
                if (err.message === 'Failed to fetch') {
                    showNotification('Server is not responding. Please check backend status.', 'error');
                }

                console.warn('[Push] Error polling for new jobs:', err.message);
            });
    }, 1000);
};

// live update show pop notification function
const showInPageNotification = (job) => {
    const notif = document.createElement('div');
    notif.className = 'notification-popup';

    const strong = document.createElement('strong');
    strong.textContent = 'New Job Posted!';
    notif.appendChild(strong);

    notif.appendChild(document.createElement('br'));

    const title = document.createElement('span');
    title.textContent = job.title;
    notif.appendChild(title);

    notif.addEventListener('click', () => {
        userFeed(job.creatorId); // Go to the publisher's page
        notificationPanel.classList.add('hide');
    });

    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 6000);

    recentNotifications.unshift(job);
    if (recentNotifications.length > 5) recentNotifications.pop();

    markNotificationUnread();
};

// Define the function that job Polling for live update comment and like function
// let pollingInterval = null;
const startJobPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(() => {
        if (!navigator.onLine) {
            console.log('[Polling] Offline – skipping update');
            return;  // It is not requested offline
        }
        console.log('[Polling] Checking updates...');

        const jobIdsToWatch = new Set(loadedJobs.map(job => job.id));

        let start = 0;

        const fetchNextBatch = () => {
            apiCall({ url: `${BACKEND_URL}/job/feed?start=${start}` })
                .then(jobs => {
                    if (!jobs.length) return;

                    jobs.forEach(newJob => {
                        // Only jobs that have been loaded on the current page are processed
                        if (jobIdsToWatch.has(newJob.id)) {
                            const existing = loadedJobs.find(j => j.id === newJob.id);
                            if (existing) {
                                const likesChanged = newJob.likes.length !== existing.likes.length;
                                const commentsChanged = newJob.comments.length !== existing.comments.length;

                                if (likesChanged || commentsChanged) {
                                    console.log(`[Polling] Job ${newJob.id} updated`);
                                    updateJobInteractions(newJob);
                                    Object.assign(existing, newJob);  // update localstorage
                                }
                            }
                        }
                    });

                    // next page
                    start += jobs.length;
                    fetchNextBatch();
                })
                .catch(err => {
                    if (err.message === 'Failed to fetch') {
                        showNotification('Server is not responding. Please check backend status.', 'error');
                    }

                    console.warn('[Push] Error polling for new jobs:', err.message);
                });
        };

        fetchNextBatch(); // start first page
    }, 5000);
};

// stop job Polling
const stopJobPolling = () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('[Polling] Stopped');
    }
};

const stopPushNotifications = () => {
    if (pushInterval) {
        clearInterval(pushInterval);
        pushInterval = null;
        console.log('[Push] Stopped');
    }
};

// Define the function that loads the user information (userPage)
// let lastRenderedUserId = null;
const userFeed = (userId, setHash = true) => {
    const loggedInUserId = localStorage.getItem('userId');

    // Default renders itself if no parameters are given
    const targetUserId = userId || loggedInUserId;

    if (setHash) {
        if (String(targetUserId) === String(loggedInUserId)) {
            window.location.hash = '#' + ROUTES.profile;
        } else {
            window.location.hash = `#${ROUTES.profile}=${targetUserId}`;
        }
    }

    localStorage.setItem('lastViewedUserId', targetUserId);
    if (String(targetUserId) === String(lastRenderedUserId)) {
        console.log(`[userFeed] Skipping repeated render for userId: ${targetUserId}`);
        return;
    }

    lastRenderedUserId = targetUserId;

    if (!targetUserId) {
        showNotification('The user was not found', 'error');
        showPage('home');
        return;
    }

    // Avoid repeated rendering of the current user
    currentPage = 'profile';
    Object.values(pages).forEach(page => page.classList.add('hide'));
    pages['profile'].classList.remove('hide');

    startJobPolling();
    updateTopAvatar();
    renderUser(targetUserId);         // display user information
    renderProfileJobs(targetUserId);  // display job-card
    renderWhoWatchlist(targetUserId);

    // refresh page for debug issues
    // if (!sessionStorage.getItem('profileReloaded')) {
    //     sessionStorage.setItem('profileReloaded', 'true');
    //     // Refresh the profile page after a delay of 100ms
    //     setTimeout(() => {
    //         window.location.reload();
    //     }, 100);
    // } else {
    //     sessionStorage.removeItem('profileReloaded');
    // }


    // Display only your own User Watching list
    const userWatchList = document.getElementById('userWatching');
    const userWatchName = document.getElementById('UserWatchlistName');
    if (String(loggedInUserId) === String(targetUserId)) {
        // Clear and display your list
        userWatchList.replaceChildren();
        userWatchName.textContent = 'your';
        // Get the creatorId list first and then render it
        fetchAllFeedCreatorIds((creatorIds) => {
            renderUserWatchlist(creatorIds);
        });
    } else {
        userWatchList.replaceChildren();
        const message = document.createElement('p');
        message.className = 'privacy-message';
        message.textContent = 'This user\'s followings are private.';
        userWatchList.appendChild(message);
        userWatchName.textContent = 'this user';
    }
};

// Define the function that loads the userProfile (profilePage)
// let currentPage = null;
// Show the selected page and optionally update the URL hash
const showPage = (pageName, updateHash = true) => {
    // Prevent re-render
    if (currentPage === pageName) return;
    // Update current page
    currentPage = pageName;

    // Hide all pages
    Object.values(pages).forEach(page => page.classList.add('hide'));
    pages[pageName].classList.remove('hide');

    // Update URL hash if needed
    if (updateHash) {
        let targetHash = '';
        if (pageName === 'home') {
            targetHash = '#' + ROUTES.feed;
        } else if (pageName === 'profile') {
            targetHash = '#' + ROUTES.profile;
        } else if (pageName === 'login') {
            targetHash = '#' + ROUTES.login;
        } else if (pageName === 'register') {
            targetHash = '#' + ROUTES.register;
        }
        if (window.location.hash !== targetHash) {
            window.location.hash = targetHash;
        }
    }

    // If the home page is displayed, load the job feed
    if (pageName === 'home') {
        const homePage = document.getElementById('homePage');
        homePage.classList.remove('fake-hide');
        homeFeed();
    }
    updateTopAvatar();
    // if (pageName === 'profile' && !window._skipAutoUserFeed) {
    //     userFeed(); // only run if not overridden
    // }

};

// Route to the correct page based on the current URL hash
const routeToPage = () => {
    const hash = window.location.hash;
    const token = localStorage.getItem('token');

    // If hash is empty or just '#', go to login
    if (!hash || hash === '#') {
        window.location.hash = token ? '#' + ROUTES.feed : '#' + ROUTES.login;
        return;
    }

    // login page route
    if (hash === '#' + ROUTES.login) {
        showPage('login', false);
        return;
    }

    // register page route
    if (hash === '#' + ROUTES.register) {
        showPage('register', false);
        return;
    }

    // feed page route
    if (hash === '#' + ROUTES.feed) {
        if (!token) {
            showNotification('Please log in first.', 'error');
            window.location.hash = '#' + ROUTES.login;
            return;
        }
        showPage('home', false);
        return;
    }

    // current login user profile page
    if (hash === '#' + ROUTES.profile) {
        const userId = localStorage.getItem('userId');
        if (userId) {
            showPage('profile', false);
            userFeed(userId, false);
        } else {
            showNotification('Please log in first.', 'error');
            window.location.hash = '#' + ROUTES.login;
        }
        return;
    }

    // specific user profile page via "#profile={userId}"
    if (hash.startsWith('#' + ROUTES.profile + '=')) {
        const userId = hash.split('=')[1];
        if (userId) {
            // showPage('profile', false);
            userFeed(userId, false);
        }
        return;
    }

    // If there is no match, you jump to the login page by default
    window.location.hash = token ? '#' + ROUTES.feed : '#' + ROUTES.login;
};

// On page load, set the default hash if needed and route accordingly
window.addEventListener('load', () => {
    const loader = document.getElementById('loading');

    updateLoaderText();

    // Set a random time between 0.5 and 5.5 seconds
    const randomDelay = Math.floor(Math.random() * 5000) + 500;

    // The delay makes loading disappear, making sure it actually shows up
    setTimeout(() => {
        loader.classList.add('hidden');
    }, randomDelay);

    // Page routing jumps are then processed
    if (!window.location.hash) {
        if (localStorage.getItem('token')) {
            window.location.hash = '#' + ROUTES.feed;
        } else {
            window.location.hash = '#' + ROUTES.login;
        }
    } else {
        routeToPage();
    }
});

// listen for the user whether is offline or online
window.addEventListener('offline', () => {
    showNotification('You are offline. Some features may not work.', 'warning');
    startJobPolling();
});

window.addEventListener('online', () => {
    showNotification('Back online!', 'success');
});

// Listen for hash changes (e.g., when using back/forward buttons)
// window.addEventListener('hashchange', routeToPage);
window.addEventListener('hashchange', () => {
    const loader = document.getElementById('loading');
    loader.classList.remove('hidden');

    updateLoaderText();
    // Set a random time between 0.5 and 5.5 seconds
    const randomDelay = Math.floor(Math.random() * 5000) + 500;

    // The delay makes loading disappear, making sure it actually shows up
    setTimeout(() => {
        loader.classList.add('hidden');
    }, randomDelay);

    routeToPage();
    lastRenderedUserId = null;
});

// ==================== NAVIGATION BUTTON EVENT LISTENERS ====================

// user click the notification icon
notificationIcon.forEach(btn => {
    btn.addEventListener('click', () => {
        notificationPanel.classList.toggle('hide');
        clearNotificationBadge();
        renderNotificationPanel();
    })
})
// notificationIcon.addEventListener('click', () => {
//     notificationPanel.classList.toggle('hide');
//     clearNotificationBadge();
//     renderNotificationPanel();
// });

// User using the search button to view userprofile
const SearchView = (input, button) => {
    if (!input || !button) return;

    button.addEventListener('click', () => {
        const userInput = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const numberRegex = /^[0-9]+$/;

        if (!userInput) {
            showNotification('Please enter the user ID or email.', 'info');
        } else if (numberRegex.test(userInput) && userInput.length < 5) {
            showNotification('User ID must be at least 5 digits.', 'info');
        } else if (numberRegex.test(userInput)) {
            // Search by user ID
            apiCall({ url: `${BACKEND_URL}/user?userId=${userInput}` })
                .then(data => {
                    if (data && data.id) {
                        userFeed(data.id);
                    } else {
                        showNotification('User not found.', 'error');
                    }
                })
        } else if (emailRegex.test(userInput)) {
            // Watch by email
            apiCall({
                url: `${BACKEND_URL}/user/watch`,
                method: 'PUT',
                body: { email: userInput, turnon: true }
            })
                .then(() => {
                    showNotification('Watching by email successful.', 'success');
                    loadMoreJobs();
                })
                .catch(() => {
                    showNotification('Failed to watch this email.', 'error');
                });
        } else {
            showNotification('Please enter a valid user ID or email.', 'info');
        }
    });
};


SearchView(searchUserHome, searchButtonHome);
SearchView(searchUserProfile, searchButtonProfile);

// jump to homePage button
logoPart.forEach(btn => {
    btn.addEventListener('click', () => showPage('home'));
});

homeButton.forEach(btn => {
    btn.addEventListener('click', () => showPage('home'));
});

// When the register button is clicked, update the hash to trigger the register page
registerButton.addEventListener('click', () => {
    window.location.hash = '#' + ROUTES.register;
});

// When the "back to login" button is clicked, update the hash to trigger the login page
goToLoginButton.addEventListener('click', () => {
    window.location.hash = '#' + ROUTES.login;
});

// When logout is clicked, clear the token and navigate to the login page
// logoutButton.addEventListener('click', () => {
//     showNotification('Logged out!', 'info')
//     setTimeout(() => {
//         localStorage.removeItem('token'); // Clear saved token
//         localStorage.removeItem('userId') // Clear saved userId
//         window.location.hash = ROUTES.login;
//     }, 100);
// });
logoutButton.forEach(btn => {
    btn.addEventListener('click', () => {
        showNotification('Logged out!', 'info')
        // Stop background polling
        stopJobPolling();
        stopPushNotifications();

        setTimeout(() => {
            localStorage.removeItem('token'); // Clear saved token
            localStorage.removeItem('userId') // Clear saved userId
            window.location.hash = '#' + ROUTES.login;
        }, 100);
    })
})


// toggleConfirmPassword.addEventListener('click', (e) => {
//     let confirmType = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
//     let registerType = registerPassword.getAttribute('type') === 'password' ? 'text' : 'password';
//     confirmPassword.setAttribute('type', confirmType);
//     registerPassword.setAttribute('type', registerType);
//     e.currentTarget.textContent = confirmType === 'password' ? 'Show' : 'Hide';
// });

// Toggle password visibility for registration
const togglePasswordVisibility = (password, passwordConfirm, toggleBtn) => {
    const type = password.type === 'password' ? 'text' : 'password';
    password.type = type;
    passwordConfirm.type = type;
    toggleBtn.textContent = type === 'password' ? 'Show' : 'Hide';
};

// registerPage format
toggleConfirmPassword.addEventListener('click', (e) => {
    togglePasswordVisibility(registerPassword, confirmPassword, e.currentTarget);
});

// Profile Modal format
toggleConfirmPasswordUpdate.addEventListener('click', (e) => {
    togglePasswordVisibility(updaterPassword, UpConfirmPassword, e.currentTarget);
});

// When user want post a new job click the Post a Job button
btnPostJob.forEach(btn => {
    btn.addEventListener('click', () => showModal('post'));
});

// When user updating their profile
updateButton.addEventListener('click', () => showModal('profile'))

// Toggle on click
// profileButton.addEventListener('click', (event) => {
//     event.stopPropagation(); // Prevents bubbling, preventing click events that trigger the document
//     profileMenu.classList.toggle('hide');
// });
profileButton.forEach((btn, index) => {
    btn.addEventListener('click', (event) => {
        event.stopPropagation();
        profileMenu[index].classList.toggle('hide');
    });
});

// Preventing clicking on the menu itself also triggers hiding
// profileMenu.addEventListener('click', (event) => {
//     event.stopPropagation();
// });
profileMenu.forEach((menu) => {
    menu.addEventListener('click', (event) => {
        event.stopPropagation();
    });
});

viewProfile.forEach(btn => {
    btn.addEventListener('click', () => {
        const userId = localStorage.getItem('userId');
        userFeed(userId);;
    });
});

// When a user selects an image file, preview it before posting
// ==================== IMAGE PREVIEW HANDLER ====================
const handleImagePreview = (inputElement, previewContainer) => {
    inputElement.addEventListener('change', (event) => {
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
        });
    });
};

// Call for both uploaders
handleImagePreview(jobImage, previewContainer);
handleImagePreview(jobImageUp, previewContainerUp);
handleImagePreview(userImage, userImagePreview)

const validateJobForm = (dateStr) => {
    if (!dateStr) return { error: 'Job Start Date is required.' };


    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        return { error: 'Invalid date format. Please use DD/MM/YYYY.' };
    }
    const [day, month, year] = dateStr.split('/').map(Number);
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(year, month, 0).getDate();
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
        return { error: 'Please input a valid date' };
    }

    if (inputDate < today) {
        return { error: "Job Start Date can't be earlier than today." };
    }

    return { date: inputDate };
};

const DateToUTC = (dateObj) => {
    if (!(dateObj instanceof Date)) {
        throw new Error('Invalid date object');
    }
    return new Date(Date.UTC(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate()
    )).toISOString();
};

// handleJob Post function
const handleJobSubmit = ({ mode, jobId = null }) => {
    // Select input elements based on mode
    const isUpdate = mode === 'update';
    const titleInput = isUpdate ? jobTitleUp : jobTitle;
    const descInput = isUpdate ? jobDescriptionUp : jobDescription;
    const dateInput = isUpdate ? jobStartDateUp : jobStartDate;
    const imageInput = isUpdate ? jobImageUp : jobImage;
    const modalToHide = isUpdate ? updateJobModal : postJobModal;

    const title = titleInput.value;
    const description = descInput.value;
    const startDateStr = dateInput.value;
    const imageFile = imageInput.files[0];

    // === Validate ===
    if (!title) return showNotification('Job Title cannot be empty.', 'error');
    const result = validateJobForm(startDateStr);
    if (result.error) return showNotification(result.error, 'error');
    const inputDate = result.date;
    if (!description) return showNotification('Job Description cannot be empty.', 'error');
    if (!imageFile) return showNotification('Please upload a Job Image.', 'error');

    // const result = validateJobForm(startDateStr);
    // if (result.error) return showNotification(result.error, 'error');
    // const inputDate = result.date;

    // === Convert Image and Submit ===
    fileToDataUrl(imageFile).then(imageBase64 => {
        const data = {
            title,
            description,
            start: DateToUTC(inputDate),
            image: imageBase64
        };

        if (isUpdate) {
            data.id = jobId;
        }

        apiCall({
            url: `${BACKEND_URL}/job`,
            method: isUpdate ? 'PUT' : 'POST',
            body: data
        }).then(data => {
            showNotification(
                isUpdate ? 'Job updated successfully!' : 'Job posted successfully!',
                'success'
            );
            console.log('job id:', data.id);
            const userId = localStorage.getItem('userId');
            homeFeed();
            renderProfileJobs(userId);

            modalToHide.classList.add('hide');
        });
    });
};

confirmPost.addEventListener('click', () => {
    handleJobSubmit({ mode: 'post' });
});

// User can closed the modal of Post
closeModal.forEach(btn => {
    btn.addEventListener('click', () => {
        postJobModal.classList.add('hide');
        updateJobModal.classList.add('hide');
        profileModel.classList.add('hide');
    });
});

// User also can cancel Post
// cancelPost.addEventListener('click', () => {
//     postJobModal.classList.add('hide');
// });
cancelPost.forEach(btn => {
    btn.addEventListener('click', () => {
        postJobModal.classList.add('hide');
        updateJobModal.classList.add('hide');
        profileModel.classList.add('hide');
    });
});

// validate user form
const validateForm = (email, name, password, confirm) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email validation
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'warning');
        return false;
    }

    // Name length validation
    if (name.length < 3 || name.length > 50) {
        showNotification('Full name must be between 3 and 50 characters.', 'warning');
        return false;
    }

    // Password strength validation
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'warning');
        return false;
    }

    // Password consistency check
    if (password !== confirm) {
        showNotification('Passwords do not match.', 'warning');
        return false;
    }

    return true;
};

// updating Profile EventListener
confirmUpButton.addEventListener('click', () => {
    const updateEmail = document.getElementById('updateEmail').value.trim();
    const updateName = document.getElementById('updateName').value.trim();
    const updatePassword = document.getElementById('updaterPassword').value;
    const confirm = document.getElementById('UpConfirmPassword').value;
    const imageInput = document.getElementById('userImage').files[0];

    // validate user input
    if (!validateForm(updateEmail, updateName, updatePassword, confirm)) {
        return;
    }

    // Submit update user profile request
    const data = {};
    if (updateEmail) data.email = updateEmail;
    if (updatePassword) data.password = updatePassword;
    if (updateName) data.name = updateName;
    const userId = localStorage.getItem('userId');
    // if user upload the image
    if (imageInput) {
        fileToDataUrl(imageInput)
            .then(imageBase64 => {
                data.image = imageBase64;

                return apiCall({
                    url: `${BACKEND_URL}/user`,
                    method: 'PUT',
                    body: data
                });
            })
            .then(() => {
                showNotification('Update user profile successful!', 'success');
                profileModel.classList.add('hide');
                renderUser(userId);
                renderProfileJobs(userId);
            })
            .catch(err => {
                showNotification(err.message || 'Failed to update profile', 'error');
            });
    } else {
        // Send the API request directly without uploading the image
        apiCall({
            url: `${BACKEND_URL}/user`,
            method: 'PUT',
            body: data
        })
            .then(() => {
                showNotification('Update user profile successful!', 'success');
                profileModel.classList.add('hide');
                renderUser(userId);
                renderProfileJobs(userId);
            })
            .catch(err => {
                showNotification(err.message || 'Failed to update profile', 'error');
            });
    }
});

// cancelPostUp.addEventListener('click', () => {
//     updateJobModal.classList.add('hide');
// });

// Registration submission
submitButton.addEventListener('click', () => {
    const email = registerEmail.value.trim();
    const name = registerName.value.trim();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;

    if (!validateForm(email, name, password, confirm)) {
        return;
    }

    // Submit registration request
    apiCall({
        url: `${BACKEND_URL}/auth/register`,
        method: 'POST',
        token: false,
        body: { email, password, name }
    })
        .then(data => {
            localStorage.setItem('token', data.token);
            showNotification('Registered!', 'success');
            loginEmail.value = email;
            loginPassword.value = password;
            showPage('login');
        });
});

// Login submission
loginButton.addEventListener('click', () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    if (!email) {
        showNotification('Please enter email', 'info');
        return;
    };
    if (!password) {
        showNotification('Please enter password', 'info');
        return;
    };

    apiCall({
        url: `${BACKEND_URL}/auth/login`,
        method: 'POST',
        token: false,
        body: { email, password }
    })
        .then(data => {
            // If the login succeeds, save the token and userId
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            apiCall({ url: `${BACKEND_URL}/user/?userId=${data.userId}` })
                .then(user => {
                    localStorage.setItem('userName', user.name || 'User');
                });
            // later usersWhoWatch
            return apiCall({
                url: `${BACKEND_URL}/user/watch`,
                method: 'PUT',
                body: { email, turnon: true }
            });
        })
        .then(() => {
            showNotification('Logged in!', 'success');
            // updateUser();
            showPage('home');
        })
        .catch(err => {
            // Catch login error like "invalid Email & password"
            if (err === 'Invalid Email & password' || err === 'Invalid input') {
                showNotification('Invalid email or password.', 'error');
            }
        });
});

// Defines a time formatting function for createdAtStr time
const formatCreatedTime = (createdAtStr) => {
    const now = new Date();
    const createdDate = new Date(createdAtStr);

    const diffMs = now - createdDate;
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 24) {
        const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }

    // Else return formatted date
    const day = String(createdDate.getDate()).padStart(2, '0');
    const month = String(createdDate.getMonth() + 1).padStart(2, '0');
    const year = createdDate.getFullYear();
    return `${day}/${month}/${year}`;
};

// Defines a time formatting function for dataStart time
const formatDateOnly = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// ==================== Render EmptyJobCar ====================
// render a empty jobCar for their new register user
const createEmptyJobCard = () => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.id = 'emptyJobCard';

    const header = document.createElement('div');
    header.className = 'header-information';

    const title = document.createElement('h2');
    title.textContent = 'Are you ready to create a job?';

    const img = document.createElement('img');
    img.src = 'styles/illustration.png';
    img.alt = 'img-illustration';
    img.className = 'illustration';

    const button = document.createElement('button');
    button.className = 'postJobButton';
    button.textContent = 'Post a Job';
    button.addEventListener('click', () => showModal('post'));

    header.appendChild(title);
    header.appendChild(img);
    header.appendChild(button);
    card.appendChild(header);
    return card;
};

// ==================== Render Notification Panel Job ====================
const renderNotificationPanel = () => {
    notificationPanel.replaceChildren();

    if (recentNotifications.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'notification-empty';
        empty.textContent = 'No new job notifications.';
        notificationPanel.appendChild(empty);
        return;
    }

    recentNotifications.forEach(job => {
        const item = document.createElement('div');
        item.className = 'notification-item';

        const title = document.createElement('div');
        title.textContent = `${job.title} by user ${job.creatorId}`;
        item.appendChild(title);

        item.addEventListener('click', () => {
            userFeed(job.creatorId);
            notificationPanel.classList.add('hide');
        });

        notificationPanel.appendChild(item);
    });
};


// ==================== Render userProfiles Job ====================
// Only the jobs posted by the user are displayed on the profile page
const renderProfileJobs = (userId) => {
    const container = document.getElementById('userJobFeed');
    container.replaceChildren(); // clear old content

    // const currentUserId = localStorage.getItem('userId');

    apiCall({ url: `${BACKEND_URL}/user?userId=${userId}` }).then(data => {
        const userJobs = data.jobs || [];
        // Only the jobs published by the user are kept
        if (userJobs.length === 0) {
            // const empty = document.createElement('p');
            // empty.textContent = 'This user has not posted any jobs yet.';
            // empty.className = 'empty-jobs-message';
            // container.appendChild(empty);
            const emptyCard = document.createElement('div');
            emptyCard.className = 'job-card empty-profile-job';

            const header = document.createElement('div');
            header.className = 'header-information';

            const title = document.createElement('h2');
            title.textContent = 'This user has not posted any jobs yet.';

            const illustration = document.createElement('img');
            illustration.src = 'styles/illustration_1.png';
            illustration.alt = 'Empty Illustration';
            illustration.className = 'illustration';

            header.appendChild(title);
            header.appendChild(illustration);
            emptyCard.appendChild(header);

            container.appendChild(emptyCard);
            return;
        }
        userJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // userJobs.forEach(job => {
        //     if (!loadedJobs.find(j => j.id === job.id)) {
        //         loadedJobs.push(job);
        //     }
        //     const jobCard = createJobCard(job);
        //     container.appendChild(jobCard);
        // });
        userJobs.forEach(job => {
            if (!loadedJobs.find(j => j.id === job.id)) {
                loadedJobs.push(job);
                seenJobIds.add(job.id);
            }
            const jobCard = createJobCard(job);
            container.appendChild(jobCard);
        });
        // const jobCard = createJobCard(job);
        // container.appendChild(jobCard);
    });
};

// ==================== Render UserWatch list ====================
// const renderedUserIds = new Set();
const renderUserWatchlist = (userId) => {
    const userWatchList = document.getElementById('userWatching');
    userWatchList.replaceChildren(); // It is cleared with each refresh
    renderedUserIds.clear(); // Clear the rendered ID record

    userId.forEach(id => {
        if (renderedUserIds.has(id)) return;
        renderedUserIds.add(id);

        apiCall({ url: `${BACKEND_URL}/user/?userId=${id}` })
            .then(data => {
                if (data.error) {
                    showNotification(data.error, 'error');
                    return;
                }

                const avatarWrapper = document.createElement('div');
                avatarWrapper.className = 'avatar-wrapper';

                if (data.image) {
                    const img = document.createElement('img');
                    img.src = data.image;
                    img.alt = 'User Avatar';
                    img.className = 'avatar-img clickable-user';
                    img.setAttribute('data-user-id', data.id);
                    avatarWrapper.appendChild(img);
                } else {
                    const avatarLetter = document.createElement('div');
                    avatarLetter.className = 'avatar-button clickable-user';
                    avatarLetter.setAttribute('data-user-id', data.id);
                    avatarLetter.textContent = data.name[0].toUpperCase();
                    avatarWrapper.appendChild(avatarLetter);
                }

                const userInfo = document.createElement('div');
                userInfo.className = 'author-info';

                const name = document.createElement('h5');
                name.className = 'author-name';
                name.textContent = data.name || 'User';

                const email = document.createElement('p');
                email.textContent = data.email || '';

                userInfo.appendChild(name);
                userInfo.appendChild(email);

                userWatchList.appendChild(avatarWrapper);
                userWatchList.appendChild(userInfo);
            });
    });
}

// ==================== Render user WhoWatch list ====================
const renderWhoWatchlist = (userId) => {
    const WhoWatchlistName = document.getElementById('WhoWatchlistName');
    const whoWatchList = document.getElementById('whoWatching');
    whoWatchList.replaceChildren();

    apiCall({ url: `${BACKEND_URL}/user/?userId=${userId}` })
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            };
            WhoWatchlistName.textContent = data.name;

            const WatchMeUser = data.usersWhoWatchMeUserIds || [];
            console.log('[WatchMeUserIds]', WatchMeUser);

            if (WatchMeUser) {
                WatchMeUser.forEach(id => {
                    const watchMeUserId = id;
                    console.log(watchMeUserId)
                    apiCall({ url: `${BACKEND_URL}/user/?userId=${watchMeUserId}` })
                        .then(data => {
                            const avatarWrapper = document.createElement('div');

                            avatarWrapper.className = 'avatar-wrapper';
                            // Render avatar or fallback letter
                            if (data.image) {
                                const img = document.createElement('img');
                                img.src = data.image;
                                img.alt = 'User Avatar';
                                img.className = 'avatar-img';
                                img.classList.add('avatar-img', 'clickable-user');
                                img.setAttribute('data-user-id', data.id);
                                avatarWrapper.appendChild(img);
                            } else {
                                const avatarLetter = document.createElement('div');
                                avatarLetter.className = 'avatar-button';
                                avatarLetter.classList.add('avatar-img', 'clickable-user');
                                avatarLetter.setAttribute('data-user-id', data.id);
                                avatarLetter.textContent = data.name[0].toUpperCase();
                                avatarWrapper.appendChild(avatarLetter);
                            }

                            // Append name and email
                            const userInfo = document.createElement('div');
                            userInfo.className = 'author-info';
                            const name = document.createElement('h5');
                            name.className = 'author-name'
                            name.textContent = data.name || 'User';
                            userInfo.appendChild(name);

                            const email = document.createElement('p');
                            email.textContent = data.email || '';
                            userInfo.appendChild(email);

                            whoWatchList.appendChild(avatarWrapper);
                            whoWatchList.appendChild(userInfo);

                        });
                });
            }
        });
}

// ==================== Render user profile sidebar ====================
const renderUser = (userId) => {
    const sidebarUser = document.querySelectorAll('.userSidebar');
    const loggedInUserId = Number(localStorage.getItem('userId'));

    apiCall({ url: `${BACKEND_URL}/user/?userId=${userId}` })
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }

            // ========== Render Sidebar ==========
            sidebarUser.forEach(avatar => {
                // Clear existing sidebar content
                avatar.replaceChildren();

                const UserWatched = data.usersWhoWatchMeUserIds;
                const WatchNumber = UserWatched.length;

                const headerInfo = document.createElement('div');
                headerInfo.className = 'header-info';
                const watchInfo = document.createElement('p');
                watchInfo.textContent = `👁️ Watched by: ${WatchNumber}`;
                const jobInfo = document.createElement('p');
                jobInfo.textContent = `📄 Jobs posted: ${data.jobs.length}`;
                headerInfo.appendChild(watchInfo);
                headerInfo.appendChild(jobInfo);
                avatar.appendChild(headerInfo);

                // Render avatar or fallback letter
                if (data.image) {
                    const img = document.createElement('img');
                    img.src = data.image;
                    img.alt = 'User Avatar';
                    img.className = 'avatar-img';
                    avatar.appendChild(img);
                } else {
                    const fallback = document.createElement('div');
                    fallback.className = 'avatar-fallback';
                    fallback.textContent = data.name[0]?.toUpperCase();
                    avatar.appendChild(fallback);
                }

                // Append name and email
                const name = document.createElement('h2');
                name.textContent = data.name || 'User';
                avatar.appendChild(name);

                const email = document.createElement('p');
                email.textContent = data.email || '';
                avatar.appendChild(email);
            });


            // ========== Handle Buttons ==========
            if (String(loggedInUserId) === String(userId)) {
                updateButton.classList.remove('hide');
                watchButton.classList.add('hide');
            } else {
                updateButton.classList.add('hide');
                watchButton.classList.remove('hide');

                const isFollowing = data.usersWhoWatchMeUserIds.includes(loggedInUserId);
                watchButton.classList.remove('watch-mode', 'unwatch-mode');
                watchButton.classList.add(isFollowing ? 'unwatch-mode' : 'watch-mode');
                watchButton.textContent = isFollowing ? 'Unwatch' : 'Watch';

                watchButton.onclick = () => {
                    const turnOn = watchButton.textContent === 'Watch';
                    apiCall({
                        url: `${BACKEND_URL}/user/watch`,
                        method: 'PUT',
                        body: {
                            email: data.email,
                            turnon: turnOn
                        }
                    }).then(() => {
                        showNotification(`${turnOn ? 'Watching' : 'Unwatched'} successfully`, 'success');
                        renderUser(userId, false);
                        renderWhoWatchlist(userId);
                    });
                };
            }
        });
};

// ==================== Render login user avatar ====================
const updateTopAvatar = () => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    apiCall({ url: `${BACKEND_URL}/user/?userId=${currentUserId}` })
        .then(data => {
            const profileMenuButtons = document.querySelectorAll('.avatar-button');
            profileMenuButtons.forEach(btn => {
                btn.replaceChildren();
                if (data.image) {
                    const img = document.createElement('img');
                    img.src = data.image;
                    img.alt = 'avatar';
                    img.className = 'avatar-img';
                    btn.appendChild(img);
                } else {
                    const span = document.createElement('span');
                    span.className = 'avatar-letter';
                    span.textContent = data.name[0]?.toUpperCase() || 'U';
                    btn.appendChild(span);
                }
            });
        });
};


// ==================== Render job card header (author info) ====================
const renderJobCardHeader = (job, headerElement) => {
    // Prevent multiple renders
    // if (headerElement.querySelector('.avatar-wrapper')) return;

    apiCall({ url: `${BACKEND_URL}/user?userId=${job.creatorId}` })
        .then(data => {
            // console.log(data)
            const avatarWrapper = document.createElement('div');
            avatarWrapper.className = 'avatar-wrapper';

            if (data.image) {
                const avatar = document.createElement('img');
                avatar.src = data.image;
                avatar.alt = 'avatar';
                avatar.className = 'user-avatar';
                avatar.setAttribute('data-user-id', data.id);
                avatar.classList.add('clickable-user');
                avatarWrapper.appendChild(avatar);
            } else {
                const avatarLetter = document.createElement('div');
                avatarLetter.className = 'avatar-button';
                avatarLetter.setAttribute('data-user-id', data.id);
                avatarLetter.classList.add('clickable-user');
                avatarLetter.textContent = data.name[0].toUpperCase();
                avatarWrapper.appendChild(avatarLetter);
            }

            const authorInfo = document.createElement('div');
            authorInfo.className = 'author-info';

            const name = document.createElement('p');
            name.textContent = data.name;
            name.className = 'author-name';

            const time = document.createElement('p');
            time.textContent = formatCreatedTime(job.createdAt);
            time.className = 'post-time';

            authorInfo.appendChild(name);
            authorInfo.appendChild(time);

            headerElement.appendChild(avatarWrapper);
            headerElement.appendChild(authorInfo);
        });
};

// ==================== Create Action Buttons (Update/Delete) ====================
const createActionButtons = (job, onDelete, onUpdate) => {
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'action-buttons';

    // Create update dropdown button
    const updateButton = document.createElement('button');
    updateButton.className = 'update-button';

    const updateIcon = document.createElement('img');
    updateIcon.src = 'styles/horizontal.svg';
    updateIcon.alt = 'Update';
    updateIcon.className = 'update-icon';
    updateButton.appendChild(updateIcon);

    const updateDropdown = document.createElement('div');
    updateDropdown.className = 'update-dropdown hide';

    const updateOption = document.createElement('button');
    updateOption.textContent = 'Update';
    updateOption.className = 'dropdown-item';
    updateDropdown.appendChild(updateOption);

    updateButton.addEventListener('click', () => {
        updateDropdown.classList.toggle('hide');
    });

    updateOption.addEventListener('click', () => {
        updateDropdown.classList.add('hide');
        if (typeof onUpdate === 'function') onUpdate(job);
    });

    const updateWrapper = document.createElement('div');
    updateWrapper.className = 'update-wrapper';
    updateWrapper.appendChild(updateButton);
    updateWrapper.appendChild(updateDropdown);
    actionWrapper.appendChild(updateWrapper);

    // Create delete button
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

    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this post?')) {
            if (typeof onDelete === 'function') onDelete();
        }
    });

    actionWrapper.appendChild(deleteButton);

    // Global listener to close dropdown when clicking elsewhere
    document.addEventListener('click', (event) => {
        // close the dropdown item
        if (
            !updateButton.contains(event.target) &&
            !updateDropdown.contains(event.target)
        ) {
            updateDropdown.classList.add('hide');
        }
    });

    return actionWrapper;
};

// ==================== Create Like and Comment Section ====================
const createInteractionSection = (job, currentUserId, currentUserName) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'interaction-wrapper';

    // ========== Like Button ========== //
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-button';

    let liked = !!job.likes?.find(user => user.userId === Number(currentUserId));
    let likeCount = job.likes.length;

    const likeCountSpan = document.createElement('span');
    likeCountSpan.className = 'like-count';
    likeCountSpan.textContent = `${job.likes.length} Likes`;
    likeBtn.appendChild(likeCountSpan);

    const updateLikeButton = () => {
        likeBtn.textContent = liked ? `❤️ Liked (${likeCount})` : `🤍 Like (${likeCount})`;
        likeBtn.className = liked
            ? 'like-button btn-primary'
            : 'like-button btn-outline-primary';
    };

    updateLikeButton();

    likeBtn.addEventListener('click', () => {
        apiCall({
            url: `${BACKEND_URL}/job/like`,
            method: 'PUT',
            body: { id: job.id, turnon: !liked }
        }).then(() => {
            liked = !liked;
            likeCount += liked ? 1 : -1;
            likeCountSpan.textContent = `${likeCount} Likes`;
            updateLikeButton();

            const existingIndex = job.likes.findIndex(like => like.userId === Number(currentUserId));
            if (liked) {
                if (existingIndex === -1) {
                    job.likes.push({
                        userId: Number(currentUserId),
                        userName: currentUserName,
                    });
                }
            } else {
                if (existingIndex !== -1) {
                    job.likes.splice(existingIndex, 1);
                }
            }


            // // Update local data & re-render this card manually
            // job.likes.push({
            //     userId: Number(currentUserId),
            //     userName: currentUserName,
            // });
            updateJobInteractions(job);
            const userId = localStorage.getItem('userId');
            // renderProfileJobs(userId);
            showNotification(liked ? 'Liked!' : 'Unliked!', 'success');
        });
    });

    // ========== Show Likes Toggle ========== //
    const likeList = document.createElement('div');
    likeList.className = 'like-list hide';

    const toggleLikesBtn = document.createElement('button');
    toggleLikesBtn.textContent = 'Show Likes';
    toggleLikesBtn.className = 'toggle-likes-button';

    toggleLikesBtn.addEventListener('click', () => {
        const isHidden = likeList.classList.contains('hide');
        likeList.classList.toggle('hide');
        toggleLikesBtn.textContent = isHidden ? 'Hide Likes' : 'Show Likes';

        if (isHidden) {
            likeList.replaceChildren();

            job.likes.forEach(user => {
                const item = document.createElement('div');
                item.className = 'like-item';

                const avatar = document.createElement('div');
                avatar.className = 'avatar-letter';
                avatar.setAttribute('data-user-id', user.userId);
                avatar.classList.add('clickable-user');
                avatar.textContent = user.userName?.[0]?.toUpperCase() || '?';

                const name = document.createElement('span');
                name.textContent = user.userName || user.userEmail;

                item.appendChild(avatar);
                item.appendChild(name);
                likeList.appendChild(item);
            });
        }
    });

    // ========== Comment Section ========== //
    const commentSection = document.createElement('div');
    commentSection.className = 'comment-section hide';

    const toggleCommentsBtn = document.createElement('button');
    toggleCommentsBtn.textContent = 'Comment 💬 ' + job.comments.length;
    toggleCommentsBtn.className = 'comment-button';

    const commentList = document.createElement('div');
    commentList.className = 'comment-list';

    const commentContainer = document.createElement('div');
    commentContainer.className = 'comment-container';

    job.comments.forEach(comment => {
        const item = document.createElement('div');
        item.className = 'comment-item';

        // const name = document.createElement('strong');
        // name.textContent = comment.userName;
        const userName = document.createElement('span');
        userName.textContent = comment.userName;
        userName.setAttribute('data-user-id', comment.userId);
        userName.classList.add('clickable-user');

        const content = document.createElement('span');
        content.textContent = `: ${comment.comment}`;

        item.appendChild(userName);
        item.appendChild(content);
        commentList.appendChild(item);
    });
    commentSection.appendChild(commentContainer);

    const commentInput = document.createElement('div');
    commentInput.className = 'comment-input';

    const commentAvatar = document.createElement('div');
    commentAvatar.className = 'avatar-letter';
    commentAvatar.textContent = currentUserName?.[0]?.toUpperCase() || 'U';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'comment';
    input.placeholder = 'Add a comment...';

    const send = document.createElement('button');
    send.textContent = 'Send';
    send.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) {
            showNotification('Comment not added', 'info');
            return;
        }
        apiCall({
            url: `${BACKEND_URL}/job/comment`,
            method: 'POST',
            body: { id: job.id, comment: text }
        }).then(() => {
            // homeFeed();
            job.comments.push({
                userId: Number(currentUserId),
                userName: currentUserName,
                comment: text
            });
            updateJobInteractions(job);
            const userId = localStorage.getItem('userId');
            // renderProfileJobs(userId);
            showNotification('Comment added!', 'success');
        });
        input.value = '';
    });

    commentInput.appendChild(commentAvatar);
    commentInput.appendChild(input);
    commentInput.appendChild(send);

    commentSection.appendChild(commentList);
    commentSection.appendChild(commentInput);

    toggleCommentsBtn.addEventListener('click', () => {
        commentSection.classList.toggle('hide');
    });

    // Append only buttons to wrapper
    wrapper.appendChild(likeBtn);
    wrapper.appendChild(toggleLikesBtn);
    // wrapper.appendChild(likeList);
    wrapper.appendChild(toggleCommentsBtn);
    // wrapper.appendChild(commentSection);

    return {
        interactionWrapper: wrapper,
        likeList,
        commentSection,
    };
};

// ==================== Create Job Card (composed component) ====================
const createJobCard = (job) => {
    const currentUserId = localStorage.getItem('userId');
    const currentUserName = localStorage.getItem('userName') || 'User';

    const card = document.createElement('div');
    card.className = 'job-card';
    card.setAttribute('data-job-id', job.id);

    // ----- Header -----
    const header = document.createElement('div');
    header.className = 'header-information';
    renderJobCardHeader(job, header);
    card.appendChild(header);

    // ----- Action buttons -----
    let actionButtons;
    if (Number(currentUserId) === job.creatorId) {
        actionButtons = createActionButtons(
            job,
            () => {
                apiCall({
                    url: `${BACKEND_URL}/job`,
                    method: 'DELETE',
                    body: { id: job.id }
                }).then(() => {
                    showNotification('Successfully deleted!', 'success');
                    if (currentPage === 'profile') {
                        renderProfileJobs(currentUserId);
                    } else {
                        homeFeed();  // will call renderJobFeed inside
                    }
                });
            },
            (job) => {
                jobTitleUp.value = job.title;
                jobStartDateUp.value = formatDateOnly(job.start);
                jobDescriptionUp.value = job.description;
                showModal('update');
                confirmPostUp.onclick = () => {
                    handleJobSubmit({ mode: 'update', jobId: job.id });
                };
            }
        );
        card.appendChild(actionButtons);
    }

    // ----- Content section -----
    const content = document.createElement('div');
    content.className = 'job-content';

    const title = document.createElement('h1');
    title.textContent = job.title;
    content.appendChild(title);

    const startingDate = document.createElement('h6');
    startingDate.textContent = `Job StartDate: ${formatDateOnly(job.start)}`;
    content.appendChild(startingDate);

    // const header = document.createElement('div');
    // header.className = 'header-information';
    // card.insertBefore(header, title);
    // renderJobCardHeader(job, header);

    if (job.image) {
        const img = document.createElement('img');
        img.className = 'id-img';
        img.src = job.image;
        img.alt = 'Job image';
        content.appendChild(img);
    }

    const desc = document.createElement('p');
    desc.textContent = job.description;
    content.appendChild(desc);
    card.appendChild(content);

    // ----- Interaction section -----
    // Get the current user name and insert it into the interactive bar
    // apiCall({
    //     url: `${BACKEND_URL}/user/?userId=${currentUserId}`,
    //     method: 'GET',
    // }).then(data => {
    //     const currentUserName = data.name || 'User';
    //     const interaction = createInteractionSection(job, currentUserId, currentUserName);
    //     card.appendChild(interaction);
    // })
    const { interactionWrapper, likeList, commentSection } = createInteractionSection(job, currentUserId, currentUserName);
    card.appendChild(interactionWrapper);   // put button
    card.appendChild(likeList);
    card.appendChild(commentSection);
    return card;
};

// update job-card content
const updateJobCard = (job) => {
    const oldCard = document.querySelector(`.job-card[data-job-id="${job.id}"]`);
    if (!oldCard) return;

    const newCard = createJobCard(job);
    oldCard.replaceWith(newCard);
};

const updateJobInteractions = (job) => {
    let container;
    if (currentPage === 'profile') {
        container = document.getElementById('userJobFeed');
    } else if (currentPage === 'home') {
        container = document.getElementById('feedContainer');
    } else {
        container = document;
    }

    const card = document.querySelector(`.job-card[data-job-id="${job.id}"]`);
    if (!card) return;

    // Update Like Count
    const likeCountSpan = card.querySelector('.like-count');
    if (likeCountSpan) {
        likeCountSpan.textContent = `${job.likes.length} Likes`;
    }

    // Update Like List (if visible)
    const likeList = card.querySelector('.like-list');
    if (likeList && !likeList.classList.contains('hide')) {
        likeList.replaceChildren();
        job.likes.forEach(user => {
            const item = document.createElement('div');
            item.className = 'like-item';

            const avatar = document.createElement('div');
            avatar.className = 'avatar-letter';
            avatar.textContent = user.userName?.[0]?.toUpperCase() || '?';
            avatar.setAttribute('data-user-id', user.userId);
            avatar.classList.add('clickable-user');

            const name = document.createElement('span');
            name.textContent = user.userName || user.userEmail;

            item.appendChild(avatar);
            item.appendChild(name);
            likeList.appendChild(item);
        });
    }

    // Update Comment Section (if visible)
    const commentList = card.querySelector('.comment-list');
    if (commentList && !commentList.closest('.comment-section')?.classList.contains('hide')) {
        commentList.replaceChildren();
        job.comments.forEach(comment => {
            const item = document.createElement('div');
            item.className = 'comment-item';

            const userName = document.createElement('span');
            userName.textContent = comment.userName;
            userName.setAttribute('data-user-id', comment.userId);
            userName.classList.add('clickable-user');

            const content = document.createElement('span');
            content.textContent = `: ${comment.comment}`;

            item.appendChild(userName);
            item.appendChild(content);
            commentList.appendChild(item);
        });
    }

    // Update comment count number
    const commentToggleBtn = card.querySelector('.comment-button');
    if (commentToggleBtn) {
        commentToggleBtn.textContent = `Comment 💬 ${job.comments.length}`;
    }
};


// Clears and repopulates job feed container with fresh job cards
const renderJobFeed = (jobs, append = false) => {
    const container = document.getElementById('feedContainer');
    if (!append) container.replaceChildren(); // Empty during initial loading

    if (jobs.length === 0 && !append) {
        const emptyCard = createEmptyJobCard();
        container.appendChild(emptyCard);
        return;
    }

    jobs.forEach(job => {
        const jobCard = createJobCard(job);
        container.appendChild(jobCard);
    });
};

// ==================== INITIALIZATION ====================

// Determine initial page based on URL or saved token
// if (localStorage.getItem('token')) {
//     window.location.hash = '/job/feed';
// }
// routeToPage();

// ==================== GLOBAL EVENTLISTENER  ====================

// Hide the menu when click elsewhere on the page
// document.addEventListener('click', (event) => {
//     // --- Profile Menu hide ---
//     if (!profileMenu.classList.contains('hide')) {
//         profileMenu.classList.add('hide');
//     }
// })
document.addEventListener('click', (event) => {
    const target = event.target.closest('.clickable-user');
    if (target && target.dataset.userId) {
        const userId = target.dataset.userId;
        userFeed(userId);
    };
    profileMenu.forEach((menu) => {
        menu.classList.add('hide');
    });


    // close the notification Panel
    const clickedNotificationIcon = Array.from(notificationIcon).some(btn =>
        btn.contains(event.target)
    );

    if (!notificationPanel.contains(event.target) && !clickedNotificationIcon) {
        notificationPanel.classList.add('hide');
    }
});

