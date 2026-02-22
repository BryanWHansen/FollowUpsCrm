import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";

const SendTodayFollowupsModal = ({ open, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (loading) return;
    setError("");
    onClose();
  };

  const handleConfirm = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await onConfirm();

      if (result.success) {
        handleClose();
      } else {
        setError(result.error || "Failed to send today's follow-ups");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Today's Follow-Ups</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
          <TodayIcon color="primary" sx={{ fontSize: 40, mt: 0.5 }} />
          <Box>
            <Typography variant="body1" gutterBottom>
              You are about to send all follow-ups scheduled for today via
              email.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will send an email digest containing all pending follow-ups
              that are scheduled for today and mark them as sent.
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          This action cannot be undone. The follow-ups will be marked as "sent"
          after the email is delivered.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={24} /> : "Confirm & Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendTodayFollowupsModal;
