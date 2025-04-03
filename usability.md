TODO!

# Usability & Accessibility

This application has been carefully designed with usability and accessibility in mind. Here are the key efforts and improvements made:

## ✅ Clear Navigation and Page Routing

- The app supports **hash-based routing**, allowing users to navigate between pages (login, register, home, profile) intuitively via URL hashes.
- Navigation elements like logo, avatar, and menu buttons are consistently placed and provide smooth transitions between views.
- Redirects unauthenticated users to the login page automatically, avoiding broken pages.

## ✅ Dynamic Feedback and Error Handling

- Uses a **notification system** (`showNotification`) to provide real-time feedback for user actions (e.g., login, comment, like, error, offline mode).
- Gracefully handles offline scenarios by displaying cached data and prompting the user.
- Alerts users of invalid inputs using precise error messages during registration, login, and job creation.

## ✅ Visual Feedback and Loading Experience

- A **loading screen** is shown with rotating motivational messages to engage users during load times.
- Feedback is provided when actions complete (e.g., job posted, profile updated).

## ✅ Interactive and Intuitive UI

- Modals are used for **posting/updating jobs and profile editing**, ensuring users don’t navigate away.
- Dropdown buttons for update/delete actions improve clarity and reduce accidental deletions.
- Scroll-based **infinite loading** ensures a smooth experience without overwhelming the user.

## ✅ Live Interactions Without Refresh

- **Live updates** for likes and comments are achieved through polling, ensuring that changes are reflected without page reloads.
- Comment and like sections toggle with buttons, keeping the interface uncluttered.

## ✅ Push Notifications

- In-app **push notifications** inform users when someone they follow posts a new job.
- A notification bell shows a red badge when new jobs arrive.
- Clicking on the notification redirects the user to the job creator’s profile.

## ✅ Accessibility Considerations

- All interactive elements include semantic HTML: buttons, labels, etc.
- Avatar components use fallback initials for users without profile images.
- All images include meaningful `alt` attributes for screen readers.
- Colors and text contrasts are chosen to be **WCAG-friendly** for better visibility.
- Avatar letters and fallback UI provide accessibility for users with visual impairments.

## ✅ Responsive Error Handling

- Handles offline/online switching gracefully and notifies the user.
- Provides confirmation prompts before destructive actions (e.g., job deletion).

## ✅ Input Validation

- Forms for registration and posting validate inputs (email format, password strength, date format).
- Friendly error messages guide users toward proper usage.
