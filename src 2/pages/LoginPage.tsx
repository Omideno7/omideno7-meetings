import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { dataMode } from "../config/dataMode";
import { isSupabaseConfigured } from "../services/supabaseClient";

export function LoginPage() {
  const { loginAs, setRoute, signIn, signUp, authLoading, authMessage } = useAppState();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("Apostle Yuhana");
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
            <p>Real Supabase Auth is active. Use your approved account to enter the app.</p>

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
              <Button onClick={submitRealAuth} disabled={authLoading || !email || !password}>
                {authLoading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
              <Button variant="ghost" onClick={() => setRoute("requestAccess")}>Request Access</Button>
            </div>

            <div className="demo-separator">Owner setup note</div>
            <p className="small-note">
              First create the Apostle Yuhana account here. Then run the Owner Bootstrap SQL in Supabase to approve this email as Owner.
            </p>
          </>
        ) : (
          <>
            <p>This React starter uses safe demo logins until Supabase Auth is connected.</p>
            <div className="stack">
              <Button onClick={() => loginAs("owner")}>Demo Login as Apostle Yuhana / Owner</Button>
              <Button variant="secondary" onClick={() => loginAs("member")}>Demo Login as Approved Member</Button>
              <Button variant="secondary" onClick={() => loginAs("pending")}>Demo Login as Pending User</Button>
              <Button variant="ghost" onClick={() => setRoute("requestAccess")}>Request Access</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
