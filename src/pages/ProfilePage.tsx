import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { profileSettingsService } from "../services/profileSettingsService";

export function ProfilePage() {
  const { profile, setRoute, updateProfile, logout } = useAppState();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [message, setMessage] = useState("Ready");

  useEffect(() => {
    setDisplayName(profile?.displayName || "");
    setAvatarUrl(profile?.avatarUrl || "");

    profileSettingsService.load(profile).then((settings) => {
      if (settings.displayName) setDisplayName(settings.displayName);
      if (settings.avatarUrl) setAvatarUrl(settings.avatarUrl);
    });
  }, [profile?.id]);

  async function saveProfile(nextName = displayName, nextAvatar = avatarUrl, closeAfterSave = true) {
    if (!profile) return;
    const cleanName = nextName.trim() || profile.displayName;
    const cleanAvatar = nextAvatar || undefined;

    setDisplayName(cleanName);
    setAvatarUrl(cleanAvatar || "");
    updateProfile({ displayName: cleanName, fullName: cleanName, avatarUrl: cleanAvatar });

    const override = { profileId: profile.id, displayName: cleanName, avatarUrl: cleanAvatar || "" };
    localStorage.setItem("omideno7.profile.override", JSON.stringify(override));
    localStorage.setItem(`omideno7.profile.settings.v2.${profile.id}`, JSON.stringify({ displayName: cleanName, avatarUrl: cleanAvatar }));

    await profileSettingsService.save(profile, {
      displayName: cleanName,
      avatarUrl: cleanAvatar
    });

    setMessage("Profile saved.");
    if (closeAfterSave) {
      window.setTimeout(() => setRoute("memberHome"), 550);
    }
  }

  function resizeAvatarFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Could not read image."));
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 384;
          const ratio = Math.min(max / img.width, max / img.height, 1);
          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not prepare image."));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let quality = 0.78;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length > 360000 && quality > 0.42) {
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

  async function handleAvatarFile(file: File | undefined) {
    if (!file) return;

    try {
      setMessage("Preparing photo...");
      const dataUrl = await resizeAvatarFile(file);
      setAvatarUrl(dataUrl);
      await saveProfile(displayName, dataUrl, false);
      setMessage("Photo selected. Press Save Profile to close.");
    } catch (error: any) {
      setMessage(error?.message || "Could not save this photo.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
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
          <input ref={fileRef} type="file" accept="image/*" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
        </div>
        {avatarUrl && <img className="profile-preview-image" src={avatarUrl} alt="Selected profile preview" />}
        <div className="button-row">
          <Button onClick={() => saveProfile(displayName, avatarUrl, true)}>Save Profile</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Choose Photo</Button>
          <Button variant="ghost" onClick={() => setRoute("memberHome")}>Close</Button>
        </div>
        <p className="auth-message">{message}</p>
      </Card>

      <Card>
        <h2>Account</h2>
        <div className="profile-actions-list">
          <button onClick={() => setRoute("meetingSchedule")}>My Meetings</button>
          <button className="danger" onClick={logout}>Logout</button>
        </div>
      </Card>
    </div>
  );
}
