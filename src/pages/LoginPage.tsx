import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { dataMode } from "../config/dataMode";
import { isSupabaseConfigured } from "../services/supabaseClient";

export function LoginPage() {
  const { loginAs, setRoute, signIn, signUp, authLoading, authMessage } = useAppState();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const supabaseMode = dataMode === "supabase" && isSupabaseConfigured;

  async function submitRealAuth() {
    if (mode === "signin") {
      await signIn(email, password);
    } else {
      await signUp(email, password, fullName);
    }
  }

  return (
    <div className="public-page">
      <Card className="auth-card">
        <h1>{supabaseMode ? "OmideNo7 Secure Login" : "Welcome Back"}</h1>

        {supabaseMode ? (
          <>
            <p>{mode === "signin" ? "Sign in with your approved OmideNo7 account." : "Create your account once. Your meeting access request will be sent automatically."}</p>

            <div className="auth-toggle">
              <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign In</button>
              <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create Account</button>
            </div>

            <div className="form-grid">
              {mode === "signup" && (
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
              )}
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
            </div>

            {authMessage && <p className="auth-message">{authMessage}</p>}

            <div className="stack">
              <Button onClick={submitRealAuth} disabled={authLoading || !email || !password || (mode === "signup" && !fullName.trim())}>
                {authLoading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
              <Button variant="ghost" onClick={() => setRoute("requestAccess")}>Servant / Host Request</Button>
            </div>

            {mode === "signup" && (
              <p className="small-note">
                After creating the account, confirm your email if asked. The owner will see your access request automatically.
              </p>
            )}
          </>
        ) : (
          <>
            <p>This React starter uses safe demo logins until Supabase Auth is connected.</p>
            <div className="stack">
              <Button onClick={() => loginAs("owner")}>Demo Login as Apostle Yuhana / Owner</Button>
              <Button variant="secondary" onClick={() => loginAs("member")}>Demo Login as Approved Member</Button>
              <Button variant="secondary" onClick={() => loginAs("pending")}>Demo Login as Pending User</Button>
              <Button variant="ghost" onClick={() => setRoute("requestAccess")}>Servant / Host Request</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
