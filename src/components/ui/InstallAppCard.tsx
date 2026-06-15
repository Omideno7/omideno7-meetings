import { Button } from "./Button";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { pwaService } from "../../services/pwaService";

export function InstallAppCard() {
  const { canInstall, install } = useInstallPrompt();
  const platform = typeof window === "undefined" ? "desktop" : pwaService.getPlatform();
  const standalone = typeof window !== "undefined" ? pwaService.isStandalone() : false;

  if (standalone) {
    return (
      <div className="install-card installed">
        <strong>App Installed</strong>
        <p>OmideNo7 Meetings is already running in app mode on this device.</p>
      </div>
    );
  }

  return (
    <div className="install-card">
      <strong>Install OmideNo7 Meetings</strong>
      <p>Install this test version on your phone as a PWA. Live meetings still need internet.</p>

      {canInstall ? (
        <Button onClick={() => install()}>Install App</Button>
      ) : (
        <div className="install-steps">
          {platform === "ios" ? (
            <p><b>iPhone:</b> Open in Safari → tap Share → Add to Home Screen.</p>
          ) : platform === "android" ? (
            <p><b>Android:</b> Open in Chrome → tap menu ⋮ → Install app / Add to Home screen.</p>
          ) : (
            <p><b>Desktop:</b> Use Chrome/Edge install icon in the address bar after deployment.</p>
          )}
        </div>
      )}
    </div>
  );
}
