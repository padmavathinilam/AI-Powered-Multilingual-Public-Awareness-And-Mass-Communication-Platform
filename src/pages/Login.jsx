import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

const LANGUAGES = [
  { native: "English", name: "English" },
  { native: "తెలుగు", name: "Telugu" },
  { native: "हिन्दी", name: "Hindi" },
  { native: "தமிழ்", name: "Tamil" },
  { native: "ಕನ್ನಡ", name: "Kannada" },
  { native: "മലയാളം", name: "Malayalam" },
  { native: "मराठी", name: "Marathi" },
];

const FLOATING_LANGUAGES = [
  { native: "नमस्ते", name: "Hindi", className: "float-hindi" },
  { native: "నమస్కారం", name: "Telugu", className: "float-telugu" },
  { native: "வணக்கம்", name: "Tamil", className: "float-tamil" },
  { native: "ಕನ್ನಡ", name: "Kannada", className: "float-kannada" },
  { native: "മലയാളം", name: "Malayalam", className: "float-malayalam" },
  { native: "मराठी", name: "Marathi", className: "float-marathi" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeLanguage, setActiveLanguage] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveLanguage((current) => (current + 1) % LANGUAGES.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password.trim()) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);

      const role =
        typeof user.role === "string"
          ? user.role
          : user.role?.name;

      if (!role) {
        throw new Error(
          "Your account role was not returned by the server."
        );
      }

      localStorage.setItem("user_role", role);
      localStorage.setItem("user_email", user.email || email);

      const userId = user.id ?? user.user_id;

      if (userId !== undefined && userId !== null) {
        localStorage.setItem("user_id", String(userId));
      }

      if (user.name) {
        localStorage.setItem("user_name", user.name);
      }

      setSuccess("Login successful! Opening your dashboard...");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_role");

      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (status === 403) {
        setError(
          typeof detail === "string"
            ? detail
            : "Your account is inactive or you do not have permission."
        );
      } else if (Array.isArray(detail)) {
        setError(
          detail.map((item) => item.msg || "Invalid input").join(", ")
        );
      } else if (typeof detail === "string") {
        setError(detail);
      } else if (err.code === "ERR_NETWORK") {
        setError(
          "Cannot connect to the backend. Make sure FastAPI is running."
        );
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-badge">
          AI-POWERED PUBLIC AWARENESS
        </div>

        <h1>
          Connect every
          <br />
          <span>voice. Every</span>
          <br />
          <span>language.</span>
        </h1>

        <p className="auth-description">
          Welcome back to AI PublicConnect. Create meaningful
          public awareness campaigns and reach communities in
          their own languages.
        </p>

        <div className="auth-benefits">
          <div className="benefit">
            <div className="benefit-icon">AI</div>
            <div>
              <strong>AI-powered communication</strong>
              <p>Create and manage awareness campaigns.</p>
            </div>
          </div>

          <div className="benefit">
            <div className="benefit-icon">ML</div>
            <div>
              <strong>Multilingual messaging</strong>
              <p>Reach people in their preferred languages.</p>
            </div>
          </div>
        </div>

        <div className="auth-languages">
          {LANGUAGES.map((language, index) => (
            <span
              key={language.name}
              className={`language-chip ${
                activeLanguage === index ? "language-active" : ""
              }`}
            >
              {language.native}
            </span>
          ))}
        </div>

        {/* Animated AI globe */}
        <div className="login-globe-scene">
          <div className="login-globe-orbit login-orbit-outer" />
          <div className="login-globe-orbit login-orbit-middle" />
          <div className="login-globe-orbit login-orbit-inner" />

          <div className="login-globe-halo" />

          <div className="login-globe-sphere">
            <div className="login-globe-shine" />

            <div className="login-globe-core">
              <span className="login-globe-sparkle">✦</span>
              <strong>AI</strong>
              <span className="login-globe-brand">
                PUBLIC
                <br />
                CONNECT
              </span>
            </div>
          </div>

          {FLOATING_LANGUAGES.map((language, index) => (
            <div
              key={language.name}
              className={`login-floating-language ${language.className}`}
              style={{ "--float-delay": `${index * -0.7}s` }}
            >
              <span className="login-language-icon">◎</span>
              <span className="login-language-text">
                <strong>{language.native}</strong>
                <small>{language.name}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card login-card">
          <div className="form-eyebrow">WELCOME BACK</div>

          <h2>Sign in to your account</h2>

          <p className="form-subtitle">
            Continue making a difference with AI PublicConnect.
          </p>

          {error && (
            <div className="auth-message error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message success" role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={updateField}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                className="show-password"
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </p>

          <div className="auth-card-footer">
            AI PublicConnect - Multilingual public awareness
          </div>
        </div>
      </section>
    </main>
  );
}
