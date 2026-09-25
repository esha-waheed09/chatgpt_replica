import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

function VerifyOTP() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEmail =
    searchParams.get("email") || "";

  const [email, setEmail] =
    useState(initialEmail);

  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] =
    useState(false);

  const [codeSent, setCodeSent] =
    useState(false);

  const sendOTP = async () => {
    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    setError("");
    setSuccess("");
    setSendingCode(true);

    try {
      await axios.post(
        `${API_URL}/auth/send-verification-otp/`,
        {
          email: email.trim(),
        }
      );

      setCodeSent(true);

      setSuccess(
        "A verification code has been sent to your email."
      );
    } catch (error) {
      console.error(
        "Send OTP error:",
        error
      );

      const responseData =
        error?.response?.data;

      let message =
        "Unable to send the verification code. Please try again.";

      if (responseData?.detail) {
        message = responseData.detail;
      } else if (
        responseData?.non_field_errors
      ) {
        message =
          responseData.non_field_errors[0];
      } else if (responseData) {
        const messages = Object.values(
          responseData
        )
          .flat()
          .join(" ");

        if (messages) {
          message = messages;
        }
      }

      setError(message);
    } finally {
      setSendingCode(false);
    }
  };

  useEffect(() => {
    if (initialEmail) {
      sendOTP();
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (otp.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/auth/verify-otp/`,
        {
          email: email.trim(),
          otp,
        }
      );

      setSuccess(
        "Email verified successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error(
        "Verify OTP error:",
        error
      );

      const responseData =
        error?.response?.data;

      let message =
        "Verification failed. Please try again.";

      if (responseData?.detail) {
        message = responseData.detail;
      } else if (
        responseData?.non_field_errors
      ) {
        message =
          responseData.non_field_errors[0];
      } else if (responseData) {
        const messages = Object.values(
          responseData
        )
          .flat()
          .join(" ");

        if (messages) {
          message = messages;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setOtp(value);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <span>✦</span>
        </div>

        <h1 className="auth-title">
          Verify your email
        </h1>

        <p className="auth-subtitle">
          Enter the 6-digit code we sent to
          your email address.
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
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="otp">
              Verification code
            </label>

            <input
              id="otp"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus={Boolean(initialEmail)}
              required
            />

            <p className="field-hint">
              Enter the 6-digit code from your
              email.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              otp.length !== 6
            }
          >
            {loading
              ? "Verifying..."
              : "Verify email"}
          </button>
        </form>

        <div className="otp-resend">
          <span>
            Didn't receive a code?
          </span>

          <button
            type="button"
            className="resend-button"
            onClick={sendOTP}
            disabled={sendingCode}
          >
            {sendingCode
              ? "Sending..."
              : "Resend code"}
          </button>
        </div>

        <p className="auth-footer">
          Already verified?{" "}
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

export default VerifyOTP;