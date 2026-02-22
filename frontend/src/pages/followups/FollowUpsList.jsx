import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Link as MuiLink,
  Grid,
  IconButton,
  Button,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Paper,
} from "@mui/material";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import EmailIcon from "@mui/icons-material/Email";
import ClearIcon from "@mui/icons-material/Clear";
import { Link } from "react-router-dom";
import { followupAPI } from "../../api/endpoints";
import {
  formatInteractionType,
  getInteractionTypeColor,
} from "../../utils/interactionTypes";
import SendOverdueFollowupsModal from "../../components/modals/SendOverdueFollowupsModal";
import SendTodayFollowupsModal from "../../components/modals/SendTodayFollowupsModal";

const FollowUpsList = () => {
  const [searchParams] = useSearchParams();
  const [followups, setFollowups] = useState([]);
  const [filteredFollowups, setFilteredFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [sendingOverdue, setSendingOverdue] = useState(false);
  const [sendingToday, setSendingToday] = useState(false);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);
  const [todayModalOpen, setTodayModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Filter states
  const getDefaultDateFrom = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  };

  const getDefaultDateTo = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  };

  const [interactionTypeFilter, setInteractionTypeFilter] = useState("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  const selectedDate = searchParams.get("date");
  const overdueParam = searchParams.get("overdue");

  useEffect(() => {
    fetchFollowups();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    followups,
    interactionTypeFilter,
    showOverdueOnly,
    customerSearch,
    dateFrom,
    dateTo,
  ]);

  // Update filters when selectedDate from URL changes
  useEffect(() => {
    if (selectedDate) {
      setDateFrom(selectedDate);
      setDateTo(selectedDate);
    }
  }, [selectedDate]);

  // Update filters when overdue parameter from URL changes
  useEffect(() => {
    if (overdueParam === "true") {
      setShowOverdueOnly(true);
      setExpanded(true); // Optionally expand filters to show the setting
    }
  }, [overdueParam]);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all followups without date filtering
      const response = await followupAPI.getAll({});
      setFollowups(response.data);
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
      setError("Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...followups];

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter((f) => {
        // Extract just the date part to avoid timezone issues
        const schedDateStr = f.scheduledDate.split("T")[0];
        return schedDateStr >= dateFrom;
      });
    }

    if (dateTo) {
      filtered = filtered.filter((f) => {
        // Extract just the date part to avoid timezone issues
        const schedDateStr = f.scheduledDate.split("T")[0];
        return schedDateStr <= dateTo;
      });
    }

    // Filter by interaction type
    if (interactionTypeFilter) {
      filtered = filtered.filter(
        (f) => f.interactionType === interactionTypeFilter,
      );
    }

    // Filter by overdue (only pending follow-ups scheduled before today)
    if (showOverdueOnly) {
      filtered = filtered.filter(
        (f) => isOverdue(f.scheduledDate) && f.status === "pending",
      );
    }

    // Filter by customer search
    if (customerSearch.trim()) {
      const searchLower = customerSearch.toLowerCase().trim();
      filtered = filtered.filter((f) => {
        const fullName =
          `${f.customerFirstName} ${f.customerLastName}`.toLowerCase();
        return fullName.includes(searchLower);
      });
    }

    setFilteredFollowups(filtered);
  };

  const clearFilters = () => {
    setInteractionTypeFilter("");
    setShowOverdueOnly(false);
    setCustomerSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Extract date part to avoid timezone conversion issues
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-");
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Extract date part to avoid timezone conversion issues
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-");
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const isOverdue = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleAccordionChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleSendDigest = async () => {
    try {
      setSendingDigest(true);
      const response = await followupAPI.sendDigest();
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: "success",
      });
      // Refresh the list to show updated statuses
      fetchFollowups();
    } catch (err) {
      console.error("Error sending digest:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to send digest email";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: err.response?.status === 404 ? "info" : "error",
      });
    } finally {
      setSendingDigest(false);
    }
  };

  const handleSendOverdue = async () => {
    try {
      setSendingOverdue(true);
      const response = await followupAPI.sendOverdue();
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: "success",
      });
      // Refresh the list to show updated statuses
      fetchFollowups();
      return { success: true };
    } catch (err) {
      console.error("Error sending overdue follow-ups:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to send overdue follow-ups";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: err.response?.status === 404 ? "info" : "error",
      });
      return { success: false, error: errorMessage };
    } finally {
      setSendingOverdue(false);
    }
  };

  const handleSendToday = async () => {
    try {
      setSendingToday(true);
      const response = await followupAPI.sendToday();
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: "success",
      });
      // Refresh the list to show updated statuses
      fetchFollowups();
      return { success: true };
    } catch (err) {
      console.error("Error sending today's follow-ups:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to send today's follow-ups";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: err.response?.status === 404 ? "info" : "error",
      });
      return { success: false, error: errorMessage };
    } finally {
      setSendingToday(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isTodaySelected = () => {
    if (!selectedDate) return false;
    const today = new Date();
    const selected = new Date(selectedDate);
    return selected.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Follow-Ups</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<EmailIcon />}
            onClick={() => setOverdueModalOpen(true)}
            disabled={sendingOverdue}
          >
            {sendingOverdue ? "Sending..." : "Send Overdue"}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EmailIcon />}
            onClick={() => setTodayModalOpen(true)}
            disabled={sendingToday}
          >
            {sendingToday ? "Sending..." : "Send Today"}
          </Button>
          {isTodaySelected() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EmailIcon />}
              onClick={handleSendDigest}
              disabled={sendingDigest}
            >
              {sendingDigest ? "Sending..." : "Send Digest Now"}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          {/* Date Range Filters */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Interaction Type Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Interaction Type</InputLabel>
              <Select
                value={interactionTypeFilter}
                label="Interaction Type"
                onChange={(e) => setInteractionTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="interest">Interest</MenuItem>
                <MenuItem value="test_drive">Test Drive</MenuItem>
                <MenuItem value="general_inquiry">General Inquiry</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Customer Search */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Search Customer"
              placeholder="Enter customer name"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>

          {/* Show Overdue Only */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOverdueOnly}
                  onChange={(e) => setShowOverdueOnly(e.target.checked)}
                />
              }
              label="Overdue Only"
            />
          </Grid>
        </Grid>

        {/* Clear Filters Button */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      <Card>
        <CardContent>
          {filteredFollowups.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {followups.length === 0
                ? "No follow-ups found."
                : "No follow-ups match the current filters."}
            </Typography>
          ) : (
            <Box>
              {/* Header Row */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "2fr 3fr 2fr 2fr",
                  },
                  gap: 2,
                  p: 2,
                  backgroundColor: "grey.100",
                  borderBottom: 1,
                  borderColor: "divider",
                  fontWeight: "bold",
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Date
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  Customer
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  Type
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  Status
                </Typography>
              </Box>

              {filteredFollowups.map((followup) => (
                <Accordion
                  key={followup.followupId}
                  expanded={expanded === `followup-${followup.followupId}`}
                  onChange={handleAccordionChange(
                    `followup-${followup.followupId}`,
                  )}
                  disableGutters
                  elevation={0}
                  square
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    "&:not(:last-child)": {
                      borderBottom: 0,
                    },
                    "&::before": {
                      display: "none",
                    },
                    backgroundColor: isToday(followup.scheduledDate)
                      ? "warning.lighter"
                      : isOverdue(followup.scheduledDate) &&
                          followup.status === "pending"
                        ? "error.lighter"
                        : "inherit",
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />
                    }
                    aria-controls={`followup-${followup.followupId}-content`}
                    id={`followup-${followup.followupId}-header`}
                    sx={{
                      flexDirection: "row-reverse",
                      "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
                        transform: "rotate(90deg)",
                      },
                      "& .MuiAccordionSummary-content": {
                        marginLeft: 1,
                      },
                    }}
                  >
                    <Grid
                      container
                      spacing={2}
                      alignItems="center"
                      sx={{ pr: 2 }}
                    >
                      <Grid item xs={12} sm={2}>
                        <Typography
                          variant="body2"
                          fontWeight={
                            isToday(followup.scheduledDate) ? "bold" : "medium"
                          }
                          color={
                            isOverdue(followup.scheduledDate) &&
                            followup.status === "pending"
                              ? "error"
                              : "inherit"
                          }
                        >
                          {formatDate(followup.scheduledDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <MuiLink
                          component={Link}
                          to={`/customers/${followup.customerId}`}
                          underline="hover"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {followup.customerFirstName}{" "}
                          {followup.customerLastName}
                        </MuiLink>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Chip
                          label={formatInteractionType(
                            followup.interactionType,
                          )}
                          color={getInteractionTypeColor(
                            followup.interactionType,
                          )}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Chip
                          label={followup.status}
                          color={
                            followup.status === "pending"
                              ? "warning"
                              : followup.status === "sent"
                                ? "info"
                                : followup.status === "completed"
                                  ? "success"
                                  : "default"
                          }
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 2,
                      borderTop: "1px solid rgba(0, 0, 0, .125)",
                      backgroundColor: "rgba(0, 0, 0, .03)",
                    }}
                  >
                    {followup.messageSubject && (
                      <>
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          fontWeight="medium"
                        >
                          Subject:
                        </Typography>
                        <Card sx={{ backgroundColor: "white", mb: 2 }}>
                          <Typography variant="body2" sx={{ p: 2 }}>
                            {followup.messageSubject}
                          </Typography>
                        </Card>
                      </>
                    )}
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      fontWeight="medium"
                    >
                      Message Body:
                    </Typography>
                    <Card sx={{ backgroundColor: "white" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          p: 2,
                        }}
                      >
                        {followup.messageBody}
                      </Typography>
                    </Card>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
          {/* Results Count */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredFollowups.length} of {followups.length}{" "}
              follow-ups
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SendOverdueFollowupsModal
        open={overdueModalOpen}
        onClose={() => setOverdueModalOpen(false)}
        onConfirm={handleSendOverdue}
      />

      <SendTodayFollowupsModal
        open={todayModalOpen}
        onClose={() => setTodayModalOpen(false)}
        onConfirm={handleSendToday}
      />
    </Box>
  );
};

export default FollowUpsList;
