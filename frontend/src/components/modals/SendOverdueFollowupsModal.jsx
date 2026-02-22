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
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const SendOverdueFollowupsModal = ({ open, onClose, onConfirm }) => {
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
        setError(result.error || "Failed to send overdue follow-ups");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Overdue Follow-Ups</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
          <WarningAmberIcon color="warning" sx={{ fontSize: 40, mt: 0.5 }} />
          <Box>
            <Typography variant="body1" gutterBottom>
              You are about to send all overdue follow-ups from the past week
              via email.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will send an email digest containing all pending follow-ups
              that were scheduled in the last 7 days and mark them as sent.
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

export default SendOverdueFollowupsModal;
