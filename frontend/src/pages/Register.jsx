import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/auth/register/`,
        {
          email,
          password,
        }
      );

      navigate(
        `/verify-otp?email=${encodeURIComponent(
          email
        )}`
      );
    } catch (err) {
      const responseData = err?.response?.data;

      if (responseData?.email) {
        setError(responseData.email[0]);
      } else if (responseData?.password) {
        setError(responseData.password[0]);
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else {
        setError(
          "Unable to create your account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <span>✦</span>
        </div>

        <h1 className="auth-title">
          Create your account
        </h1>

        <p className="auth-subtitle">
          Get started with ChatGPT Replica
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-field">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />

            <p className="field-hint">
              Use at least 8 characters.
            </p>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Continue"}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="social-button"
          onClick={() =>
            setError(
              "Google signup will be available later."
            )
          }
        >
          <span className="google-icon">
            G
          </span>

          Continue with Google
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">
            Log in
          </Link>
        </p>

        <p className="auth-legal">
          By continuing, you agree to our{" "}
          <span>Terms of Use</span> and{" "}
          <span>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

export default Register;
