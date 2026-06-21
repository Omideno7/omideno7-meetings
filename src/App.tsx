import { AppShell } from "./components/layout/AppShell";
import { useAppState } from "./app/AppState";
import { pageRegistry } from "./routes/pageRegistry";
import { canOpenRoute, getDefaultRoute } from "./services/routeGuard";

export function App() {
  const { profile, route, setRoute } = useAppState();
  const allowed = canOpenRoute(route, profile);
  const safeRoute = allowed ? route : getDefaultRoute(profile);
  const Page = pageRegistry[safeRoute];

  if (!allowed && safeRoute !== route) {
    queueMicrotask(() => setRoute(safeRoute));
  }

  if (!profile) return <Page />;
  if (safeRoute === "liveMeeting") return <Page />;

  return (
    <AppShell>
      <Page />
    </AppShell>
  );
}
