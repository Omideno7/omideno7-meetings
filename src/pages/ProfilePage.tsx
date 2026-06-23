import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { profileSettingsService } from "../services/profileSettingsService";

export function ProfilePage() {
  const { profile, setRoute, refreshProfile, updateProfile, logout } = useAppState();
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
    const cleanName = nextName.trim() || profile.displayName;
    const cleanAvatar = nextAvatar || undefined;

    updateProfile({ displayName: cleanName, fullName: cleanName, avatarUrl: cleanAvatar });
    localStorage.setItem("omideno7.profile.override", JSON.stringify({ displayName: cleanName, avatarUrl: cleanAvatar }));

    await profileSettingsService.save(profile, {
      displayName: cleanName,
      avatarUrl: cleanAvatar
    });

    setAvatarUrl(cleanAvatar || "");
    setDisplayName(cleanName);
    await refreshProfile();
    setMessage("Profile saved.");
  }

  function resizeAvatarFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Could not read image."));
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 512;
          const ratio = Math.min(max / img.width, max / img.height, 1);
          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not prepare image."));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let quality = 0.82;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length > 560000 && quality > 0.45) {
            quality -= 0.08;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Could not open image."));
        img.src = String(reader.result || "");
      };

      reader.readAsDataURL(file);
    });
  }

  function chooseAvatar() {
    fileRef.current?.click();
  }

  async function handleAvatarFile(file: File | undefined) {
    if (!file) return;

    try {
      setMessage("Preparing photo...");
      const dataUrl = await resizeAvatarFile(file);
      setAvatarUrl(dataUrl);
      await saveProfile(displayName, dataUrl);
    } catch (error: any) {
      setMessage(error?.message || "Could not save this photo.");
    }
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
          <button onClick={() => setMessage("Problem report dialog will be connected in the next support step.")}>Report a problem</button>
          <button onClick={() => setMessage("OmideNo7 Meetings version 1.21.0")}>About / Version 1.21.0</button>
          <button className="danger" onClick={logout}>Logout</button>
        </div>
      </Card>
    </div>
  );
}
