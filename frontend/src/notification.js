/**
 * Display a notification message on the top-right of the screen.
 * @param {string} message - The message content to display.
 * @param {'info' | 'success' | 'warning' | 'error'} type - Type of the notification.
 * @param {number} duration - Duration in ms before auto-hide (default 5000ms).
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing container if any
    const existing = document.getElementById('notification-container');
    if (existing) existing.remove();

    // Create container
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = 1080; // Bootstrap default modal z-index is 1050

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert ${getAlertClass(type)} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        <strong>${getIcon(type)}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Append and show
    container.appendChild(alert);
    document.body.appendChild(container);

    // Auto-dismiss after duration
    setTimeout(() => {
        alert.classList.remove('show');
        alert.classList.add('hide');
        setTimeout(() => container.remove(), 300); // wait for fade out
    }, duration);
}

// Get Bootstrap alert class based on type
function getAlertClass(type) {
    const classes = {
        info: 'alert-info',
        success: 'alert-success',
        warning: 'alert-warning',
        error: 'alert-danger',
    };
    return classes[type] || classes.info;
}

// Get Unicode icon based on type
function getIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
    };
    return icons[type] || icons.info;
}
