(optional) TODO!
# Bonus Features

1. 🧩 A global, reusable **toast notification system** was implemented, providing distinct visual styles for success and error messages to enhance user feedback.

2. 🌐 A **unified and clean API wrapper** was built around `fetch`, simplifying all API requests with consistent error handling and token management.

3. 🛑 **Delete actions are protected** by a confirmation popup, preventing accidental deletions and improving safety.

4. ✅ During **user registration**, the system validates email format, name length, and password strength with real-time feedback.

5. 👁️ A **"Show Password" toggle** was added to the confirm password field, making it easier for users to verify their input.

6. 🎨 A rich set of **custom icons and illustrations** were added, including Home, Notification, Search, Logo, and empty state graphics, greatly improving visual appeal.

7. 🧑‍🤝‍🧑 Implemented a **User Watching List**, allowing users to see which users they follow and navigate to their profiles directly.

8. 📭 For new users who haven’t posted a job yet, a friendly **empty job card** with illustration appears, prompting them to post a job.

9. 🔍 The **Empty Job Card** appears on both the home and profile pages when the user has no posts, guiding users with visuals and text to improve engagement.

10. 🧠 The **Search Input** supports dual functionality:
    - Searching by **email** allows users to follow someone.
    - Searching by **user ID** navigates directly to their profile page.
    - It also includes validation to prevent invalid input.

11. 🔗 **URL-based navigation** is supported — users can manually visit any route such as `/profile?id=123`, `/feed`, etc., and the system will render the correct page accordingly.

12. 🏠 Users can return to the homepage by clicking either the **home icon** or the **site logo**, providing multiple navigation options.

13. 👤 **Clicking any avatar or username** throughout the app (like in job cards, likes, comments, or watch lists) will navigate to that user’s profile page.

14. ⏳ A **loading animation** was implemented to prevent content flashing during page loads. It also cycles through **fun loader messages** to keep users engaged while waiting.

15. 🔔 A custom **Notification Panel** was developed. When users someone follows posts a job:
    - A red dot appears on the notification icon.
    - Clicking the icon reveals a panel listing the **latest 5 job notifications**, linking directly to the poster’s profile.

16. 🛡️ When a user logs out, their **token is cleared**. If they try to access restricted pages via URL (like `/feed`), the system redirects them to the login page for security.
