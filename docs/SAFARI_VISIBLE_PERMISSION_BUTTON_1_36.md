# OmideNo7 Meetings 1.36.0 — Safari Visible Permission Button

This update adds a visible Safari camera/microphone test card directly inside LiveMeetingPage, before LiveKit starts.

Why:
- The previous Safari permission test was inside RealLiveKitRoom and was not visible enough in the tested UI.
- This version makes it impossible to miss: users press "Test Safari camera/mic" first.
- It requests audio+video directly from the user's click before Enter Live.

Also:
- Adds Permissions-Policy header for camera/microphone/display-capture/autoplay.
- Keeps last stable Live page behavior.

If Safari still does not show permission popup:
- The issue is Safari/macOS site permission state, not LiveKit.
- Check Safari > Settings > Websites > Camera/Microphone for the site.
- Reset with Terminal:
  tccutil reset Camera com.apple.Safari
  tccutil reset Microphone com.apple.Safari
