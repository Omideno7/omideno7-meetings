import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { profileSettingsService } from "../services/profileSettingsService";

export function ProfilePage() {
  const { profile, setRoute, refreshProfile, logout } = useAppState();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [message, setMessage] = useState("Ready");

  useEffect(() => {
    profileSettingsService.load(profile).then((settings) => {
      if (settings.displayName) setDisplayName(settings.displayName);
      if (settings.avatarUrl) setAvatarUrl(settings.avatarUrl);
    });
  }, [profile?.id]);

  async function saveProfile(nextName = displayName, nextAvatar = avatarUrl) {
    if (!profile) return;
    await profileSettingsService.save(profile, {
      displayName: nextName.trim() || profile.displayName,
      avatarUrl: nextAvatar || undefined
    });
    await refreshProfile();
    setMessage("Profile saved. If you logout/login, it should remain.");
  }

  function chooseAvatar() {
    fileRef.current?.click();
  }

  function handleAvatarFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 650000) {
      setMessage("Image is too large. Choose a smaller photo for now.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setAvatarUrl(dataUrl);
      saveProfile(displayName, dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="page-grid profile-mobile-safe">
      <Card>
        <h1>Profile</h1>
        <p>Manage your display name, avatar, account status, and meeting identity.</p>
        <div className="profile-hero-clean">
          <div className="profile-avatar-large">
            {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : <span>{profile?.displayName?.slice(0, 1) || "O"}</span>}
          </div>
          <div>
            <h2>{displayName || profile?.displayName}</h2>
            <p>{profile?.email}</p>
            <p>{profile?.role?.replaceAll("_", " ")} · {profile?.status}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2>Edit profile</h2>
        <div className="profile-form-clean">
          <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label>Avatar data / URL<input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} /></label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
        </div>
        <div className="button-row">
          <Button onClick={() => saveProfile()}>Save Profile</Button>
          <Button variant="secondary" onClick={chooseAvatar}>Choose Photo</Button>
          <Button variant="ghost" onClick={refreshProfile}>Refresh Profile</Button>
        </div>
        <p className="auth-message">{message}</p>
      </Card>

      <Card>
        <h2>Account</h2>
        <div className="profile-actions-list">
          <button onClick={() => setRoute("deviceTest")}>Audio / Video Test</button>
          <button onClick={() => setRoute("meetingSchedule")}>My Meetings</button>
          <button onClick={() => setRoute("testingCenter")}>Report a problem</button>
          <button onClick={() => setRoute("releaseReadiness")}>About / Version 1.16.0</button>
          <button className="danger" onClick={logout}>Logout</button>
        </div>
      </Card>
    </div>
  );
}
