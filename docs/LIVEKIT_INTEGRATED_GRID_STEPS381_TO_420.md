# OmideNo7 Meetings — LiveKit Integrated Video Grid Steps 381–420

Purpose:
- Move LiveKit from a separate "real room test card" toward the main meeting experience.
- When the user clicks Join Real Room, the real LiveKit grid becomes the main video area.
- Demo/profile participant tiles are hidden after LiveKit connection.
- LiveKit's real VideoConference grid shows real camera tiles for participants.
- Camera and microphone are requested/published automatically after joining.
- Participants who turn on camera should appear as real video tiles instead of only profile/avatar tiles.

Still pending:
- Fully custom OmideNo7 participant tiles using low-level LiveKit track rendering.
- Host force-mute via server RoomService.
- Recording/Egress.

Version:
1.18.0-livekit-integrated-video-grid
