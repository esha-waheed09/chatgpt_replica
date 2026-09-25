import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(
        email.trim(),
        password
      );

      navigate("/dashboard");
    } catch (err) {
      console.error(
        "Login page error:",
        err
      );

      const responseData =
        err?.response?.data;

      /*
       * Django REST Framework / SimpleJWT
       */
      if (responseData?.detail) {
        setError(responseData.detail);
      } else if (
        responseData?.non_field_errors
      ) {
        setError(
          responseData.non_field_errors[0]
        );
      } else if (
        responseData?.email
      ) {
        setError(
          Array.isArray(responseData.email)
            ? responseData.email[0]
            : responseData.email
        );
      } else if (
        responseData?.password
      ) {
        setError(
          Array.isArray(
            responseData.password
          )
            ? responseData.password[0]
            : responseData.password
        );
      } else if (
        err?.message
      ) {
        setError(err.message);
      } else {
        setError(
          "Unable to log in. Please try again."
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
          Welcome back
        </h1>

        <p className="auth-subtitle">
          Log in to continue to ChatGPT Replica
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
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password">
                Password
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  setError(
                    "Password reset is not available yet."
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Password"
              autoComplete="current-password"
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
              ? "Logging in..."
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
              "Google login will be available later."
            )
          }
        >
          <span className="google-icon">
            G
          </span>

          Continue with Google
        </button>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Sign up
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

export default Login;