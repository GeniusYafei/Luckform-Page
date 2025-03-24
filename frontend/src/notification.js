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
    container.className = 'position-fixed top-0 end-0 p-0';
    container.style.zIndex = 1080; // Bootstrap default modal z-index is 1050

    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${getAlertClass(type)} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');

    // Create strong element for icon
    const iconElem = document.createElement('strong');
    iconElem.textContent = getIcon(type);
    alertDiv.appendChild(iconElem);

    // Add a space and the message text
    const messageText = document.createTextNode(' ' + message);
    alertDiv.appendChild(messageText);

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'alert');
    closeBtn.setAttribute('aria-label', 'Close');
    alertDiv.appendChild(closeBtn);

    // Append alert to container and container to body
    container.appendChild(alertDiv);
    document.body.appendChild(container);

    // Auto-dismiss after duration
    setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.classList.add('hide');
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
