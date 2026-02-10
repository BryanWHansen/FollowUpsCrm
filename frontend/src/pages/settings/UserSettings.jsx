import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import ChangePasswordModal from "../../components/modals/ChangePasswordModal";
import { userPreferencesAPI } from "../../api/endpoints";

const UserSettings = () => {
  const { user, updateUser, changePassword, deleteAccount } = useAuth();
  const [selectedTab, setSelectedTab] = useState("general");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Email preferences state
  const [emailPreferences, setEmailPreferences] = useState({
    emailDigestEnabled: true,
    emailDigestTime: "08:00",
    emailDigestTimezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  // General settings state
  const [generalFormData, setGeneralFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  // Security settings state
  const [securityFormData, setSecurityFormData] = useState({
    email: user?.email || "",
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userPreferencesAPI.getProfile();
      const profile = response.data;
      setEmailPreferences({
        emailDigestEnabled: profile.emaildigestenabled ?? true,
        emailDigestTime: profile.emaildigesttime?.substring(0, 5) || "08:00",
        emailDigestTimezone: profile.emaildigesttimezone || "America/New_York",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setGeneralError("");
    setGeneralSuccess("");
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSecurityError("");
    setSecuritySuccess("");
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setGeneralLoading(true);
    setGeneralError("");
    setGeneralSuccess("");

    if (!generalFormData.firstName.trim() || !generalFormData.lastName.trim()) {
      setGeneralError("First name and last name are required");
      setGeneralLoading(false);
      return;
    }

    try {
      const result = await updateUser({
        ...generalFormData,
        email: user.email, // Keep current email
      });
      if (result.success) {
        setGeneralSuccess("General settings updated successfully");
      } else {
        setGeneralError(result.error || "Failed to update settings");
      }
    } catch (err) {
      setGeneralError("An error occurred while updating settings");
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityLoading(true);
    setSecurityError("");
    setSecuritySuccess("");

    if (!securityFormData.email.trim()) {
      setSecurityError("Email is required");
      setSecurityLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(securityFormData.email)) {
      setSecurityError("Please enter a valid email address");
      setSecurityLoading(false);
      return;
    }

    try {
      const result = await updateUser({
        firstName: user.firstName,
        lastName: user.lastName,
        email: securityFormData.email,
      });
      if (result.success) {
        setSecuritySuccess("Email updated successfully");
      } else {
        setSecurityError(result.error || "Failed to update email");
      }
    } catch (err) {
      setSecurityError("An error occurred while updating email");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChangePassword = async (passwordData) => {
    const result = await changePassword(passwordData);
    if (result.success) {
      setSecuritySuccess("Password changed successfully");
    }
    return result;
  };

  const handleEmailPreferenceChange = (e) => {
    const { name, value, checked, type } = e.target;
    setEmailPreferences((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setEmailError("");
    setEmailSuccess("");
  };

  const handleSaveEmailPreferences = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    setEmailSuccess("");

    try {
      await userPreferencesAPI.updateEmailPreferences(emailPreferences);
      setEmailSuccess("Email preferences saved successfully!");
    } catch (error) {
      setEmailError("Failed to save preferences. Please try again.");
      console.error("Error saving preferences:", error);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm deletion");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    const result = await deleteAccount(deletePassword);

    if (!result.success) {
      setDeleteError(result.error || "Failed to delete account");
      setDeleteLoading(false);
    }
    // If successful, user will be logged out and redirected
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletePassword("");
    setDeleteError("");
  };

  const renderGeneralTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        General
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your personal information
      </Typography>

      {generalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {generalError}
        </Alert>
      )}

      {generalSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {generalSuccess}
        </Alert>
      )}

      <Box component="form" onSubmit={handleGeneralSubmit}>
        <TextField
          fullWidth
          label="First Name"
          name="firstName"
          value={generalFormData.firstName}
          onChange={handleGeneralChange}
          margin="normal"
          required
          disabled={generalLoading}
        />

        <TextField
          fullWidth
          label="Last Name"
          name="lastName"
          value={generalFormData.lastName}
          onChange={handleGeneralChange}
          margin="normal"
          required
          disabled={generalLoading}
        />

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={generalLoading}
            sx={{ minWidth: 120 }}
          >
            {generalLoading ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderDeleteAccountTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom color="error">
        Delete Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Permanently delete your account and all associated data
      </Typography>

      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          ⚠️ Warning: This action cannot be undone
        </Typography>
        <Typography variant="body2">
          Deleting your account will permanently remove:
        </Typography>
        <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
          <li>Your user profile and login credentials</li>
          <li>All customers and their contact information</li>
          <li>All interactions and follow-up history</li>
          <li>All vehicles and interest vehicles</li>
          <li>All follow-up templates you've created</li>
          <li>All email digest history</li>
        </ul>
        <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
          This data cannot be recovered once deleted.
        </Typography>
      </Alert>

      <Box
        sx={{
          p: 3,
          border: "2px solid",
          borderColor: "error.main",
          borderRadius: 2,
          backgroundColor: "#fff5f5",
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Proceed with Caution
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          If you're sure you want to delete your account, click the button
          below. You will be asked to confirm with your password.
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ minWidth: 180 }}
        >
          Delete My Account
        </Button>
      </Box>
    </Box>
  );

  const renderEmailTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Email Notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your daily follow-up digest email preferences
      </Typography>

      {emailError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {emailError}
        </Alert>
      )}

      {emailSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {emailSuccess}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSaveEmailPreferences}>
        <FormControlLabel
          control={
            <Switch
              checked={emailPreferences.emailDigestEnabled}
              onChange={handleEmailPreferenceChange}
              name="emailDigestEnabled"
              disabled={emailLoading}
            />
          }
          label={
            <Box>
              <Typography variant="body1">Enable Daily Email Digest</Typography>
              <Typography variant="body2" color="text.secondary">
                Receive an email each day with your scheduled follow-ups and SMS
                quick links
              </Typography>
            </Box>
          }
          sx={{ alignItems: "flex-start", mb: 3 }}
        />

        {emailPreferences.emailDigestEnabled && (
          <>
            <TextField
              fullWidth
              label="Digest Time"
              name="emailDigestTime"
              type="time"
              value={emailPreferences.emailDigestTime}
              onChange={handleEmailPreferenceChange}
              margin="normal"
              disabled={emailLoading}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Time of day to send your daily digest (in your local timezone)"
            />

            <TextField
              fullWidth
              select
              label="Timezone"
              name="emailDigestTimezone"
              value={emailPreferences.emailDigestTimezone}
              onChange={handleEmailPreferenceChange}
              margin="normal"
              disabled={emailLoading}
              helperText="Your local timezone for scheduling the digest"
            >
              <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
              <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
              <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
              <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
              <MenuItem value="America/Phoenix">Arizona (MST)</MenuItem>
              <MenuItem value="America/Anchorage">Alaska (AKT)</MenuItem>
              <MenuItem value="Pacific/Honolulu">Hawaii (HST)</MenuItem>
              <MenuItem value="Europe/London">London (GMT/BST)</MenuItem>
              <MenuItem value="Europe/Paris">Paris (CET/CEST)</MenuItem>
              <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
              <MenuItem value="Australia/Sydney">Sydney (AEST/AEDT)</MenuItem>
            </TextField>
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={emailLoading}
            sx={{ minWidth: 120 }}
          >
            {emailLoading ? (
              <CircularProgress size={24} />
            ) : (
              "Save Email Preferences"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderSecurityTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sign-in & Security
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your email and password
      </Typography>

      {securityError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {securityError}
        </Alert>
      )}

      {securitySuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {securitySuccess}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSecuritySubmit}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={securityFormData.email}
          onChange={handleSecurityChange}
          margin="normal"
          required
          disabled={securityLoading}
        />

        <Box sx={{ mt: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={securityLoading}
            sx={{ minWidth: 120 }}
          >
            {securityLoading ? <CircularProgress size={24} /> : "Update Email"}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="h6" gutterBottom>
          Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Change your password to keep your account secure
        </Typography>
        <Button variant="outlined" onClick={() => setPasswordModalOpen(true)}>
          Change Password
        </Button>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Paper sx={{ mt: 4, overflow: "hidden" }}>
        <Grid container>
          {/* Side Menu */}
          <Grid
            item
            xs={12}
            md={3}
            sx={{
              borderRight: { xs: "none", md: "1px solid #e0e0e0" },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, px: 2 }}>
                Settings
              </Typography>
              <List>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedTab === "general"}
                    onClick={() => setSelectedTab("general")}
                  >
                    <ListItemText primary="General" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedTab === "security"}
                    onClick={() => setSelectedTab("security")}
                  >
                    <ListItemText primary="Sign-in & Security" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedTab === "email"}
                    onClick={() => setSelectedTab("email")}
                  >
                    <ListItemText primary="Email Notifications" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedTab === "delete"}
                    onClick={() => setSelectedTab("delete")}
                    sx={{ color: "error.main" }}
                  >
                    <ListItemText primary="Delete Account" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </Grid>

          {/* Content Area */}
          <Grid item xs={12} md={9}>
            <Box sx={{ p: 4 }}>
              {selectedTab === "general" && renderGeneralTab()}
              {selectedTab === "security" && renderSecurityTab()}
              {selectedTab === "email" && renderEmailTab()}
              {selectedTab === "delete" && renderDeleteAccountTab()}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onChangePassword={handleChangePassword}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
          ⚠️ Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you absolutely sure you want to delete your account?
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            This will permanently delete all your customers, follow-ups,
            templates, and cannot be undone.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: "bold" }}>
            Enter your password to confirm:
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            disabled={deleteLoading}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            sx={{ minWidth: 120 }}
          >
            {deleteLoading ? <CircularProgress size={24} /> : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserSettings;
