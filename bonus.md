(optional) TODO!

1. **Display of Followers and Followings**
   Users can see the number and list of users who are watching them (followers), as well as who they are watching (followings). Followings are private to each user.

2. **Public Profile Viewer**
   Clicking on the avatar or name in the feed, comments, or like sections will direct to the corresponding user’s profile page.

3. **Dynamic Profile Sidebar Rendering**
   The profile sidebar shows user details and conditionally displays either an "Update Profile" button (for self) or a "Watch / Unwatch" toggle (for others).

4. **Watch and Unwatch Functionality**
   A fully functioning button on user profiles allows watching or unwatching users, reflecting real-time changes.

5. **Email-Based User Watching**
   Users can input an email in a popup modal on the feed page to watch another user directly, without needing to visit their profile.

6. **Custom Avatar Fallback**
   When a user hasn’t uploaded a profile picture, their avatar is replaced with a fallback letter using the first character of their name.

7. **Improved Job Card Header**
   Author info (avatar, name, time posted) in each job card header is clickable and dynamically rendered.

8. **Interactive Like & Comment Sections**
   Like and comment buttons toggle the corresponding section visibility with animations and smooth UI feedback.

9. **Live Likes and Comments Update (Polling)**
   Likes and comments update in real-time using polling, avoiding the need for manual page refreshes.

10. **Infinite Scroll on Feed**
   The homepage implements Infinite Scroll that progressively loads more job posts as the user scrolls down.

11. **User Watchlist with Creator IDs**
   "User Watching" is intelligently generated using all creator IDs from the feed, reflecting users you follow.

12. **Follow Privacy Protection**
   "User Watching" is visible only when users view their own profile. On others’ profiles, a privacy message is shown instead.

13. **Loader Message Feedback**
   A small loader or feedback message is displayed when waiting for asynchronous data to load (e.g., job feed or user info).

14. **Debounced Feed Re-rendering**
   When clicking repeatedly on the same user profile, re-rendering is skipped to prevent unnecessary DOM updates.

15. **Avatar and Email Click Navigation**
   Clicking on avatars or names in any context (like, comment, watchlist) will navigate to the corresponding user’s profile.

16. **Custom Notification Icon for Job Posts**
   A custom notification popup is implemented to alert the user when someone they follow posts a new job, simulating push notifications via polling.
