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

// Job page elements
const profileButton = document.querySelectorAll('.avatar-button');
const profileMenu = document.querySelectorAll('.profile-dropdown');

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
const confirmPostUp = document.getElementById('confirmUpdate')
const previewContainer = document.getElementById('jobImagePreview');
const previewContainerUp = document.getElementById('jobImagePreview-update');

// Job feed Dom elements


// Page containers
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const homePage = document.getElementById('homePage');
const profilePage = document.getElementById('profilePage');

// ==================== apiCall FUNCTION ====================
const apiCall = ({ url, method = 'GET', token = true, body = null }) => {
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
            showNotification(err.message || 'Network error', 'error');
            return Promise.reject(err);
        });

};


// ==================== PAGE NAVIGATION ====================
// Define the Modal for post and update
const modals = {
    post: postJobModal,
    update: updateJobModal
};

// Define the hash routes for each page
const ROUTES = {
    login: '/auth/login',
    register: '/auth/register',
    home: '/job/feed',
    profile: '/user'
};

// Store page DOM elements in an object for easier access
const pages = {
    login: loginPage,
    register: registerPage,
    home: homePage,
    profile: profilePage
};

const showModal = (type) => {
    Object.values(modals).forEach(m => m.classList.add('hide'));
    modals[type].classList.remove('hide');
}

// Define the function that loads the JobFeed (homepage)
const fetchFeed = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Please log in first', 'error');
        showPage('login');
        return;
    }
    apiCall({ url: `${BACKEND_URL}/job/feed?start=0` })
        .then(data => {
            console.log(data)
            renderJobFeed(data);
            // Ensure sidebar is updated when rendering a job card
            renderSidebarUser();
        });
};

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

// Show the selected page and optionally update the URL hash
const showPage = (pageName, updateHash = true) => {
    let currentPage = null;
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
        setTimeout(() => {
            localStorage.removeItem('token'); // Clear saved token
            localStorage.removeItem('userId') // Clear saved userId
            window.location.hash = ROUTES.login;
        }, 100);
    })
})

// Toggle password visibility for registration
toggleConfirmPassword.addEventListener('click', (e) => {
    let confirmType = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    let registerType = registerPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPassword.setAttribute('type', confirmType);
    registerPassword.setAttribute('type', registerType);
    e.currentTarget.textContent = confirmType === 'password' ? 'Show' : 'Hide';
});


// When user want post a new job click the Post a Job button
btnPostJob.forEach(btn => {
    btn.addEventListener('click', () => showModal('post'));
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
}

const DateToUTC = (dateObj) => {
    if (!(dateObj instanceof Date)) {
        throw new Error('Invalid date object');
      }
      return new Date(Date.UTC(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate()
      )).toISOString();
}

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
            fetchFeed();
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
    });
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
    apiCall({
        url: `${BACKEND_URL}/auth/register`,
        method: 'POST',
        token: false,
        body: { email, password, name }
    })
        .then(data => {
            localStorage.setItem('token', data.token);
            showNotification('Registered!', 'success');
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

// Defines a time formatting function
const formatTime = (createdAtStr) => {
    const now = new Date();
    const jobDate = new Date(createdAtStr);
    const diffMs = now - jobDate;

    // If the time is in the future, show the date directly
    if (diffMs < 0) {
        const day = String(jobDate.getDate()).padStart(2, '0');
        const month = String(jobDate.getMonth() + 1).padStart(2, '0');
        const year = jobDate.getFullYear();
        return `${day}/${month}/${year}`;
    }

    const diffHours = Math.floor(diffMs / 3600000); // 1 hour = 3600000ms

    if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / 60000);
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }

    if (diffHours < 24) {
        const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }

    const day = String(jobDate.getDate()).padStart(2, '0');
    const month = String(jobDate.getMonth() + 1).padStart(2, '0');
    const year = jobDate.getFullYear();
    return `${day}/${month}/${year}`;
};

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

const formatDateOnly = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};


// ==================== Render sidebar user profile ====================
const renderSidebarUser = () => {
    const sidebarUser = document.querySelectorAll('.userSidebar');
    const currentUserId = localStorage.getItem('userId');

    apiCall({ url: `${BACKEND_URL}/user/?userId=${currentUserId}` })
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }

            sidebarUser.forEach(btn => {
                // Clear existing sidebar content
                while (btn.firstChild) {
                    btn.removeChild(btn.firstChild);
                }

                // Render avatar or fallback letter
                if (data.img) {
                    const img = document.createElement('img');
                    img.src = data.img;
                    img.alt = 'User Avatar';
                    img.className = 'avatar-img';
                    btn.appendChild(img);
                } else {
                    const fallback = document.createElement('div');
                    fallback.className = 'avatar-fallback';
                    fallback.textContent = data.name[0]?.toUpperCase();
                    btn.appendChild(fallback);
                }

                // Append name and email
                const name = document.createElement('h2');
                name.textContent = data.name || 'User';
                btn.appendChild(name);

                const email = document.createElement('p');
                email.textContent = data.email || '';
                btn.appendChild(email);
            })

            // // Update top-right avatar menu
            const profileMenuButton = document.querySelectorAll('.avatar-button');
            const avatarLetter = document.getElementById('avatarLetter');

            profileMenuButton.forEach((btn) => {
                if (data.img) {
                    while (btn.firstChild) {
                        btn.removeChild(btn.firstChild); // clear previous content
                    }
                    const img = document.createElement('img');
                    img.src = data.img;
                    img.alt = 'avatar';
                    img.className = 'avatar-img';
                    btn.appendChild(img);
                } else {
                    avatarLetter.textContent = data.name[0]?.toUpperCase() || 'U';
                }
            });
        });
};

// ==================== Render job card header (author info) ====================
const renderJobHeader = (job, headerElement) => {
    apiCall({ url: `${BACKEND_URL}/user?userId=${job.creatorId}` })
        .then(data => {
            console.log(data)
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
                avatarLetter.className = 'avatar-button';
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
function createInteractionSection(job, currentUserId, currentUserName) {
    const wrapper = document.createElement('div');
    wrapper.className = 'interaction-wrapper';

    // ========== Like Button ========== //
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-button';

    let liked = !!job.likes?.find(user => user.userId === Number(currentUserId));
    let likeCount = job.likes.length;

    const updateLikeButton = () => {
        likeBtn.textContent = `Like ❤️ ${likeCount}`;
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
            updateLikeButton();
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

    job.comments.forEach(comment => {
        const item = document.createElement('div');
        item.className = 'comment-item';

        const name = document.createElement('strong');
        name.textContent = comment.userName;

        const content = document.createElement('span');
        content.textContent = `: ${comment.comment}`;

        item.appendChild(name);
        item.appendChild(content);
        commentList.appendChild(item);
    });

    const commentInput = document.createElement('div');
    commentInput.className = 'comment-input';

    const commentAvatar = document.createElement('div');
    commentAvatar.className = 'avatar-letter';
    commentAvatar.textContent = currentUserName?.[0]?.toUpperCase() || 'U';

    const input = document.createElement('input');
    input.type = 'text';
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
            fetchFeed();
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

    wrapper.appendChild(likeBtn);
    wrapper.appendChild(toggleLikesBtn);
    wrapper.appendChild(likeList);
    wrapper.appendChild(toggleCommentsBtn);
    wrapper.appendChild(commentSection);

    return wrapper;
}

// ==================== Create Job Card (composed component) ====================
const createJobCard = (job) => {
    const currentUserId = localStorage.getItem('userId');

    const card = document.createElement('div');
    card.className = 'job-card';

    const title = document.createElement('h1');
    title.textContent = job.title;
    card.appendChild(title);

    const startingDate = document.createElement('h6');
    startingDate.textContent = `Job StartDate: ${formatDateOnly(job.start)}`;
    card.appendChild(startingDate);

    const header = document.createElement('div');
    header.className = 'header-information';
    card.insertBefore(header, title);
    renderJobHeader(job, header);

    if (job.image) {
        const img = document.createElement('img');
        img.className = 'id-img';
        img.src = job.image;
        img.alt = 'Job image';
        card.appendChild(img);
    }

    const desc = document.createElement('p');
    desc.textContent = job.description;
    card.appendChild(desc);

    // const likeButton = createLikeButton(job, currentUserId);
    // card.appendChild(likeButton);

    // Only show update/delete for creator
    if (Number(currentUserId) === job.creatorId) {
        const actionButtons = createActionButtons(
            job,
            () => {
                apiCall({
                    url: `${BACKEND_URL}/job`,
                    method: 'DELETE',
                    body: { id: job.id }
                }).then(() => {
                    showNotification('Successfully deleted!', 'success');
                    fetchFeed();
                });
            },
            (job) => {
                jobTitleUp.value = job.title;
                jobStartDateUp.value = formatDateOnly(job.start);
                jobDescriptionUp.value = job.description;
                previewContainerUp
                showModal('update');
                confirmPostUp.onclick = () => {
                    handleJobSubmit({ mode: 'update', jobId: job.id });
                };
            }
        );
        card.appendChild(actionButtons);
    }

    // Get the current user name and insert it into the interactive bar
    apiCall({
        url: `${BACKEND_URL}/user/?userId=${currentUserId}`,
        method: 'GET',
    }).then(data => {
        const currentUserName = data.name || 'User';
        const interaction = createInteractionSection(job, currentUserId, currentUserName);
        card.appendChild(interaction);
    })

    return card;
};

// Clears and repopulates job feed container with fresh job cards
const renderJobFeed = (jobs) => {
    const container = document.getElementById('feedContainer');
    const emptyCard = document.getElementById('emptyJobCard');

    // If there is a Job, remove the empty card and render the Job list
    if (jobs.length > 0) {
        if (emptyCard) {
            emptyCard.remove();
        }

        container.replaceChildren(); // empty container
        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            container.appendChild(jobCard);
        });
    } else {
        // Append each job card to container
        container.replaceChildren();
        if (emptyCard) {
            container.appendChild(emptyCard);
        }
    }
};

// ==================== INITIALIZATION ====================

// Determine initial page based on URL or saved token
if (localStorage.getItem('token')) {
    window.location.hash = '/job/feed';
}
routeToPage();

// ==================== GLOBAL EVENTLISTENER  ====================

// Hide the menu when click elsewhere on the page
// document.addEventListener('click', (event) => {
//     // --- Profile Menu hide ---
//     if (!profileMenu.classList.contains('hide')) {
//         profileMenu.classList.add('hide');
//     }
// })
document.addEventListener('click', () => {
    profileMenu.forEach((menu) => {
        menu.classList.add('hide');
    });
});

