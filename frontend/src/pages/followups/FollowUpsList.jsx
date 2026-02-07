import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { styled } from "@mui/material/styles";
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
} from "@mui/material";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary, {
  accordionSummaryClasses,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import { Link } from "react-router-dom";
import { followupAPI } from "../../api/endpoints";
import {
  formatInteractionType,
  getInteractionTypeColor,
} from "../../utils/interactionTypes";

// Styled Accordion Components
const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: "transparent",
  flexDirection: "row-reverse",
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
    {
      transform: "rotate(90deg)",
    },
  [`& .${accordionSummaryClasses.content}`]: {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
  backgroundColor: "rgba(0, 0, 0, .03)",
  ...theme.applyStyles("dark", {
    backgroundColor: "rgba(255, 255, 255, .05)",
  }),
}));

const FollowUpsList = () => {
  const [searchParams] = useSearchParams();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const selectedDate = searchParams.get("date");

  useEffect(() => {
    fetchFollowups();
  }, [selectedDate]);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedDate) {
        params.scheduledDateFrom = selectedDate;
        params.scheduledDateTo = selectedDate;
      }

      const response = await followupAPI.getAll(params);
      setFollowups(response.data);
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
      setError("Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateLong = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
      <Typography variant="h4" gutterBottom>
        Follow-Ups
        {selectedDate && ` - ${formatDateLong(selectedDate)}`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {followups.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No follow-ups scheduled{selectedDate ? " for this date" : ""}.
            </Typography>
          ) : (
            <Box>
              {/* Header Row */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "2fr 3fr 2fr 2fr 3fr",
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
                <Typography variant="body2" fontWeight="bold">
                  Vehicle
                </Typography>
              </Box>

              {followups.map((followup) => (
                <Accordion
                  key={followup.followupId}
                  expanded={expanded === `followup-${followup.followupId}`}
                  onChange={handleAccordionChange(
                    `followup-${followup.followupId}`,
                  )}
                  sx={{
                    backgroundColor: isToday(followup.scheduledDate)
                      ? "warning.lighter"
                      : isOverdue(followup.scheduledDate)
                        ? "error.lighter"
                        : "inherit",
                  }}
                >
                  <AccordionSummary
                    aria-controls={`followup-${followup.followupId}-content`}
                    id={`followup-${followup.followupId}-header`}
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
                            isOverdue(followup.scheduledDate)
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
                              : "default"
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {followup.vehicleMake && followup.vehicleModel ? (
                          <Typography variant="body2" noWrap>
                            {followup.vehicleYear} {followup.vehicleMake}{" "}
                            {followup.vehicleModel}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails>
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default FollowUpsList;
