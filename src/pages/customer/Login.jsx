import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import "./Login.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const googleScriptUrl = "https://accounts.google.com/gsi/client";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedName, setAuthenticatedName] = useState("");
  const [googleLoadError, setGoogleLoadError] = useState(false);
  const googleButtonRef = useRef(null);

  const finishSignIn = useCallback((result) => {
    window.sessionStorage.setItem("apnaMartToken", result.token);
    setAuthenticatedName(result.user.name);
    setIsAuthenticated(true);
    setFormError("");
  }, []);

  const handleGoogleCredential = useCallback(async (credential) => {
    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Google sign-up failed.");
      }

      finishSignIn(result);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Google sign-up failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [finishSignIn]);

  useEffect(() => {
    if (!googleClientId) return undefined;

    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => handleGoogleCredential(credential),
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "signup_with",
        shape: "rectangular",
        width: Math.min(336, googleButtonRef.current.clientWidth),
      });
    };

    let script = document.querySelector(`script[src="${googleScriptUrl}"]`);
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else if (script) {
      script.addEventListener("load", initializeGoogleSignIn);
      script.addEventListener("error", () => setGoogleLoadError(true), {
        once: true,
      });
    } else {
      script = document.createElement("script");
      script.src = googleScriptUrl;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => setGoogleLoadError(true);
      document.head.appendChild(script);
    }

    return () => {
      script?.removeEventListener("load", initializeGoogleSignIn);
    };
  }, [handleGoogleCredential]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegistering
      ? { name, username, phone, password }
      : { identifier, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to continue.");
      }

      finishSignIn(result);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to continue.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleButtonClick = () => {
    setFormError(
      googleClientId
        ? "Google sign-up could not load. Check your connection and try again."
        : "Google sign-up needs a Google OAuth client ID. Configure VITE_GOOGLE_CLIENT_ID and backend GOOGLE_CLIENT_ID.",
    );
  };

  if (isAuthenticated) {
    return (
      <main className="login-page">
        <section className="login-card signed-in-card" aria-live="polite">
          <div className="brand-logo">
            <div className="logo-icon">
              <ShoppingBasket size={30} />
            </div>
            <h1>APNA <span>MART</span></h1>
          </div>
          <h2>Welcome, {authenticatedName}!</h2>
          <p>You are signed in.</p>
          <button
            type="button"
            className="back-button"
            onClick={() => {
              window.sessionStorage.removeItem("apnaMartToken");
              setIsAuthenticated(false);
              setPassword("");
            }}
          >
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-logo">
          <div className="logo-icon">
            <ShoppingBasket size={30} />
          </div>
          <h1>APNA <span>MART</span></h1>
          <p>Apni Dukaan, Ab Aapke Paas.</p>
        </div>

        <div className="login-heading">
          <h2>{isRegistering ? "Create your account" : "Welcome Back!"}</h2>
          <p>
            {isRegistering
              ? "Create an account to continue shopping."
              : "Sign in with your username or mobile number."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegistering ? (
            <>
              <label htmlFor="account-name">Full Name</label>
              <input
                id="account-name"
                className="auth-input"
                type="text"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <label htmlFor="account-username">Username</label>
              <input
                id="account-username"
                className="auth-input"
                type="text"
                autoComplete="username"
                minLength={3}
                maxLength={30}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />

              <label htmlFor="account-phone">Mobile Number (optional)</label>
              <input
                id="account-phone"
                className="auth-input"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, ""))
                }
              />
            </>
          ) : (
            <>
              <label htmlFor="login-identifier">Username or Mobile Number</label>
              <input
                id="login-identifier"
                className="auth-input"
                type="text"
                autoComplete="username"
                placeholder="Enter username or 10-digit number"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="auth-input"
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={isRegistering ? 8 : undefined}
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {formError && <p className="form-error" role="alert">{formError}</p>}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : <>{isRegistering ? "Create account" : "Continue"} <ArrowRight size={19} /></>}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        {googleClientId && !googleLoadError ? (
          <div className="google-button-container" ref={googleButtonRef} />
        ) : (
          <button
            type="button"
            className="google-fallback-button"
            onClick={handleGoogleButtonClick}
            disabled={isSubmitting}
          >
            <span className="google-mark" aria-hidden="true">G</span>
            Sign up with Google
          </button>
        )}

        <p className="auth-switch">
          {isRegistering ? "Already have an account?" : "New to Apna Mart?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormError("");
            }}
          >
            {isRegistering ? "Sign in" : "Create account"}
          </button>
        </p>

        <div className="login-footer">
          By continuing, you agree to our
          <br />
          <a href="/terms">Terms of Service</a> and{" "}
          <a href="/privacy">Privacy Policy</a>
        </div>
      </section>
    </main>
  );
}
