import { Sidebar } from "./Sidebar";
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
  const { profile, route, setRoute } = useAppState();
  const isHostLike = profile ? hostLikeRoles.includes(profile.role) : false;

  const tabs: { key: AppRouteKey; label: string; icon: string; show: boolean }[] = [
    { key: "memberHome", label: "Home", icon: "⌂", show: true },
    { key: "meetingSchedule", label: "Meetings", icon: "◷", show: true },
    { key: "servantDashboard", label: "Host", icon: "◎", show: isHostLike },
    { key: "profile", label: "Profile", icon: "◉", show: true }
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
      <nav className="mobile-bottom-tabs" aria-label="Main mobile navigation">
        {tabs.filter((item) => item.show).map((item) => (
          <button
            key={item.key}
            className={route === item.key ? "active" : ""}
            onClick={() => setRoute(item.key)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
