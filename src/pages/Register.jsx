
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

const ROLES = [
  "Admin",
  "Campaign Manager",
  "Communication Team",
];

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization_name: "",
    role: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const passwordChecks = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ];

  const strengthScore = passwordChecks.filter(Boolean).length;

  const strengthLabel = [
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ][strengthScore];

  // Handle form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // Handle registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (loading) return;

    // Validate required fields. Organization is optional.
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.role ||
      !form.password ||
      !form.confirm_password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Phone validation
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError("Please enter a valid phone number.");
      return;
    }

    // Password length validation
    if (form.password.length < 8 || form.password.length > 72) {
      setError("Password must contain between 8 and 72 characters.");
      return;
    }

    // Password strength validation
    if (strengthScore !== 5) {
      setError(
        "Password must contain an uppercase letter, lowercase letter, number, and special character."
      );
      return;
    }

    // Confirm password validation
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    // Role validation
    if (!ROLES.includes(form.role)) {
      setError("Please select a valid role.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        organization_name: form.organization_name.trim() || null,
        password: form.password,
        role: form.role,
      };

      // POST /auth/register
      const response = await api.post("/auth/register", payload);

      setSuccess(
        response.data?.message ||
          "Registration successful! Redirecting to Login..."
      );

      // Clear password fields
      setForm((previousForm) => ({
        ...previousForm,
        password: "",
        confirm_password: "",
      }));

      // Redirect to Login
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const statusCode = err.response?.status;
      const detail = err.response?.data?.detail;

      if (statusCode === 409) {
        setError(
          "This email is already registered. Please use another email."
        );
      } else if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg || item.message || "Invalid input")
            .join(", ")
        );
      } else if (typeof detail === "string") {
        setError(detail);
      } else if (err.code === "ERR_NETWORK") {
        setError(
          "Cannot connect to the backend. Please make sure the FastAPI server is running."
        );
      } else {
        setError(
          "Registration failed. Please check your details and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>Create Your Account</h1>
          <p>
            Join AI PublicConnect to create and manage public awareness
            campaigns.
          </p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="full_name">Full Name *</label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={handleChange}
              autoComplete="name"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
            />
          </div>

          {/* Organization is optional */}
          <div className="form-group">
            <label htmlFor="organization_name">
              Organization Name (Optional)
            </label>
            <input
              id="organization_name"
              type="text"
              name="organization_name"
              placeholder="Enter your organization name (optional)"
              value={form.organization_name}
              onChange={handleChange}
              autoComplete="organization"
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Select Role *</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="">Choose your role</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />

            <small>
              Use at least 8 characters, including uppercase and lowercase
              letters, a number, and a special character.
            </small>

            {/* Live password strength indicator */}
            <div className="password-strength" aria-live="polite">
              <div className="password-strength-track">
                <div
                  className={`password-strength-fill strength-${strengthScore}`}
                  style={{
                    width: `${strengthScore * 20}%`,
                  }}
                />
              </div>

              <small>
                Password strength:{" "}
                {form.password ? strengthLabel : "Not entered"} (
                {strengthScore}/5)
              </small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirm Password *</label>
            <input
              id="confirm_password"
              type="password"
              name="confirm_password"
              placeholder="Re-enter your password"
              value={form.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />

            {form.confirm_password && (
              <small
                className={
                  form.password === form.confirm_password
                    ? "password-match"
                    : "password-mismatch"
                }
                role="status"
              >
                {form.password === form.confirm_password
                  ? "Passwords match."
                  : "Passwords do not match."}
              </small>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading && (
              <span
                className="loading-spinner"
                aria-hidden="true"
              />
            )}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
