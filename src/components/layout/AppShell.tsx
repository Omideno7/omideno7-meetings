import { useAppState } from "../../app/AppState";
import { roles } from "../../config/roles";
import type { AppRouteKey } from "../../types/routes";

const hostLikeRoles = [
  roles.OWNER,
  roles.SENIOR_HOST,
  roles.MEETING_HOST,
  roles.CO_HOST,
  roles.DOOR_SERVANT,
  roles.MEDIA_SERVANT,
  roles.PRAYER_SERVANT,
  roles.CHAT_MODERATOR
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, route, setRoute, logout } = useAppState();
  const isHostLike = profile ? hostLikeRoles.includes(profile.role) : false;

  const mainTabs: { key: AppRouteKey; label: string; icon: string; show: boolean }[] = [
    { key: "memberHome", label: "Home", icon: "⌂", show: true },
    { key: "meetingSchedule", label: "Meetings", icon: "◷", show: true },
    { key: "liveMeeting", label: "Live", icon: "▣", show: true },
    { key: "waitingRoom", label: "Waiting", icon: "⏳", show: true },
    { key: "deviceTest", label: "Media", icon: "🎙", show: true },
    { key: "profile", label: "Profile", icon: "◉", show: true },
    { key: "ownerDashboard", label: "Owner", icon: "✓", show: profile?.role === roles.OWNER },
    { key: "servantDashboard", label: "Host", icon: "◎", show: isHostLike }
  ];

  return (
    <div className="app-shell no-sidebar-shell">
      <header className="top-app-nav">
        <div className="top-brand">
          <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div>
            <strong>OmideNo7 Meetings</strong>
            <span>{profile?.displayName}</span>
          </div>
        </div>

        <nav>
          {mainTabs.filter((item) => item.show).map((item) => (
            <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className="top-logout" onClick={logout}>Logout</button>
      </header>

      <main className="main-content full-main-content">{children}</main>

      <nav className="mobile-bottom-tabs" aria-label="Main mobile navigation">
        {mainTabs.filter((item) => item.show).slice(0, 5).map((item) => (
          <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
