import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          ✦
        </div>

        <h1>
          Welcome Back
        </h1>

        <p>
          Sign in to AI PublicConnect
        </p>

        <form>

          <div className="form-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
            />

          </div>

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
            />

          </div>

          <button
            type="submit"
            className="auth-button"
          >
            Sign In
          </button>

        </form>

        <p className="auth-footer">

          Don't have an account?

          {" "}

          <Link to="/register">
            Create Account
          </Link>

        </p>

        <Link
          to="/"
          className="back-link"
        >
          ← Back to Home
        </Link>

      </div>

    </div>
  );
}

export default Login;