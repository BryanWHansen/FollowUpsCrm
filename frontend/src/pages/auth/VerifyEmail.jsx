import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, Email, Error } from "@mui/icons-material";
import { authAPI } from "../../api/endpoints";
import { useAuth } from "../../contexts/AuthContext";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get("token");

  // If user lands with a token, verify it immediately
  useEffect(() => {
    if (token && !verified && !verifying) {
      handleVerifyEmail(token);
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken) => {
    setVerifying(true);
    setError("");

    try {
      const response = await authAPI.verifyEmail(verificationToken);
      setVerified(true);

      // If user is logged in, update their context
      if (user && updateUser) {
        await updateUser();
        // Redirect to welcome page after 2 seconds
        setTimeout(() => {
          navigate("/welcome");
        }, 2000);
      } else {
        // User not logged in - redirect to login after verification
        setTimeout(() => {
          navigate("/login", {
            state: { message: "Email verified! Please log in to continue." },
          });
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to verify email. The link may have expired.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError("");

    try {
      await authAPI.resendVerification();
      setResendSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to resend verification email",
      );
    } finally {
      setResendLoading(false);
    }
  };

  if (verifying) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Verifying your email...</Typography>
        </Paper>
      </Container>
    );
  }

  if (verified) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Email Verified!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {user
              ? "Your email has been successfully verified. Redirecting to welcome page..."
              : "Your email has been successfully verified. Redirecting to login..."}
          </Typography>
          <CircularProgress size={24} />
        </Paper>
      </Container>
    );
  }

  // If no token and no user, redirect to login
  if (!token && !user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Email sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Authentication Required
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please log in to access email verification.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/login")}
            fullWidth
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  // Show instructions if no token or if verification failed
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Email sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Verify Your Email
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {user?.email ? (
              <>
                We've sent a verification email to <strong>{user.email}</strong>
              </>
            ) : (
              "We've sent you a verification email"
            )}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Verification email sent! Please check your inbox.
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            Please check your email inbox and click the verification link to
            activate your account.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The verification link will expire in 24 hours.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Can't find the email? Check your spam folder or request a new
            verification email below.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleResendVerification}
            disabled={resendLoading}
            fullWidth
          >
            {resendLoading ? "Sending..." : "Resend Verification Email"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/login")}
            fullWidth
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyEmail;
