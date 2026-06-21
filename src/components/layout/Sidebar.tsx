import { useAppState } from "../../app/AppState";
import { roles } from "../../config/roles";
import type { AppRouteKey } from "../../types/routes";

const hostRoles = [
  roles.OWNER,
  roles.SENIOR_HOST,
  roles.MEETING_HOST,
  roles.CO_HOST,
  roles.DOOR_SERVANT,
  roles.MEDIA_SERVANT,
  roles.PRAYER_SERVANT,
  roles.CHAT_MODERATOR
];

const ownerRoutes: { key: AppRouteKey; label: string }[] = [
  { key: "ownerDashboard", label: "Owner" },
  { key: "approvals", label: "Approvals" },
  { key: "permissionTemplates", label: "Permissions" },
  { key: "securityCenter", label: "Security" }
];

export function Sidebar() {
  const { profile, route, setRoute, logout } = useAppState();

  if (!profile) return null;

  const isHost = hostRoles.includes(profile.role);
  const isOwner = profile.role === roles.OWNER;

  const mainRoutes: { key: AppRouteKey; label: string }[] = [
    { key: "memberHome", label: "Home" },
    { key: "meetingSchedule", label: "Meetings" },
    { key: "profile", label: "Profile" },
    { key: "waitingRoom", label: "Waiting Room" },
    { key: "liveMeeting", label: "Live Meeting" }
  ];

  const hostRoutes: { key: AppRouteKey; label: string }[] = [
    { key: "servantDashboard", label: "Host Panel" },
    { key: "deviceTest", label: "Audio / Video Test" },
    { key: "mediaLibrary", label: "Recordings" },
    { key: "reports", label: "Reports" }
  ];

  return (
    <aside className="sidebar simplified-sidebar">
      <div className="brand">
        <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        <div>
          <strong>OmideNo7</strong>
          <span>{profile.displayName}</span>
        </div>
      </div>

      <nav>
        <p className="sidebar-section-title">Main</p>
        {mainRoutes.map((item) => (
          <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
            {item.label}
          </button>
        ))}

        {isHost && (
          <>
            <p className="sidebar-section-title">Host</p>
            {hostRoutes.map((item) => (
              <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
                {item.label}
              </button>
            ))}
          </>
        )}

        {isOwner && (
          <>
            <p className="sidebar-section-title">Owner</p>
            {ownerRoutes.map((item) => (
              <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
                {item.label}
              </button>
            ))}
          </>
        )}
      </nav>

      <button className="logout" onClick={logout}>Logout</button>
    </aside>
  );
}
