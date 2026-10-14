import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          ✦
        </div>

        <h1>
          Create Account
        </h1>

        <p>
          Join AI PublicConnect
        </p>

        <form>

          <div className="form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
            />

          </div>

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
              placeholder="Create a password"
            />

          </div>

          <button
            type="submit"
            className="auth-button"
          >
            Create Account
          </button>

        </form>

        <p className="auth-footer">

          Already have an account?

          {" "}

          <Link to="/login">
            Sign In
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

export default Register;