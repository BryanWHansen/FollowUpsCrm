import { useState } from "react";
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
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import ChangePasswordModal from "../../components/modals/ChangePasswordModal";

const UserSettings = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [selectedTab, setSelectedTab] = useState("general");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

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
              </List>
            </Box>
          </Grid>

          {/* Content Area */}
          <Grid item xs={12} md={9}>
            <Box sx={{ p: 4 }}>
              {selectedTab === "general" && renderGeneralTab()}
              {selectedTab === "security" && renderSecurityTab()}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onChangePassword={handleChangePassword}
      />
    </Container>
  );
};

export default UserSettings;
