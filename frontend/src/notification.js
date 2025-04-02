/**
 * Display a notification message on the top-right of the screen.
 * @param {string} message - The message content to display.
 * @param {'info' | 'success' | 'warning' | 'error'} type - Type of the notification.
 * @param {number} duration - Duration in ms before auto-hide (default 5000ms).
 */
let lastNotificationCache = {
    message: '',
    type: '',
    timestamp: 0
};

export function showNotification(message, type = 'info', duration = 3000) {
    const now = Date.now();
    const container = document.getElementById('notification-container');

    // If the message is repeated and within 3 seconds, it is skipped
    if (
        message === lastNotificationCache.message &&
        type === lastNotificationCache.type &&
        now - lastNotificationCache.timestamp < 1000
    ) {
        return;
    }

    lastNotificationCache = { message, type, timestamp: now };

    // Maximum 5 error messages
    if (container.children.length >= 5) return;
    // Create container
    const notif = document.createElement('div');
    notif.classList.add('notification', `notification-${type}`);

    // Create alert element
    const icon = document.createElement('div');
    icon.textContent = getIcon(type);
    notif.appendChild(icon);

    // error msg
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.textContent = message;
    notif.appendChild(msg);

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => notif.remove();
    notif.appendChild(closeBtn);

    container.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, duration);
}

// Get Unicode icon based on type
function getIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
    };
    return icons[type] || '';
}
