import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import { Link } from "react-router-dom";
import { followupAPI, interactionAPI } from "../api/endpoints";
import {
  formatInteractionType,
  getInteractionTypeColor,
} from "../utils/interactionTypes";
import FollowUpCalendar from "../components/FollowUpCalendar";

const Dashboard = () => {
  const [upcomingFollowups, setUpcomingFollowups] = useState([]);
  const [monthlyFollowups, setMonthlyFollowups] = useState([]);
  const [todoInteractions, setTodoInteractions] = useState([]);
  const [typesWithoutTemplates, setTypesWithoutTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [upcomingRes, monthlyRes, interactionsRes, typesRes] =
        await Promise.all([
          followupAPI.getUpcoming(3),
          followupAPI.getAll({
            scheduledDateFrom: firstDay.toISOString().split("T")[0],
            scheduledDateTo: lastDay.toISOString().split("T")[0],
            status: "pending",
          }),
          interactionAPI.getWithoutVehicles(),
          interactionAPI.getTypesWithoutTemplates(),
        ]);

      setUpcomingFollowups(upcomingRes.data);
      setMonthlyFollowups(monthlyRes.data);
      setTodoInteractions(interactionsRes.data);
      setTypesWithoutTemplates(typesRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
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

  const summaryCards = [
    {
      title: "Upcoming Follow-ups",
      value: upcomingFollowups.length,
      color: "inherit",
    },
    {
      title: "Pending To-Dos",
      value: todoInteractions.length,
      color: "inherit",
    },
    {
      title: "Due Today",
      value: upcomingFollowups.filter((f) => isToday(f.scheduledDate)).length,
      color: "inherit",
    },
    {
      title: "Overdue",
      value: upcomingFollowups.filter((f) => isOverdue(f.scheduledDate)).length,
      color: "error",
    },
  ];

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
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Follow-ups Calendar Section */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Follow-ups Calendar
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Click on a day to see all follow-ups scheduled
              </Typography>
              <FollowUpCalendar followups={monthlyFollowups} />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={5}>
          {/* To-Do List Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                To-Do List
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Interactions without vehicles assigned
              </Typography>
              {todoInteractions.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  All interactions have vehicles assigned!
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {todoInteractions.map((interaction) => (
                        <TableRow
                          key={interaction.interactionId}
                          sx={{
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(interaction.interactionDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <MuiLink
                              component={Link}
                              to={`/customers/${interaction.customerId}`}
                              underline="hover"
                            >
                              {interaction.customerFirstName}{" "}
                              {interaction.customerLastName}
                            </MuiLink>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatInteractionType(
                                interaction.interactionType,
                              )}
                              color={getInteractionTypeColor(
                                interaction.interactionType,
                              )}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Interaction Types Without Templates */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Missing Templates
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Interaction types without follow-up templates. Create templates
                to automate follow-ups.
              </Typography>
              {typesWithoutTemplates.length === 0 ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✓ All interaction types have templates
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Interaction Type</TableCell>
                        <TableCell align="right">
                          Existing Interactions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {typesWithoutTemplates.map((item) => (
                        <TableRow
                          key={item.interactionType}
                          sx={{
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={formatInteractionType(
                                item.interactionType,
                              )}
                              color={getInteractionTypeColor(
                                item.interactionType,
                              )}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={
                                item.count > 0 ? "error" : "text.secondary"
                              }
                            >
                              {item.count}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {typesWithoutTemplates.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  💡 Interactions of these types won't generate follow-ups until
                  templates are created
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards in 2x2 Grid */}
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {summaryCards.map((card, index) => (
                  <Grid item xs={6} key={index}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 2,
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography
                          color="text.secondary"
                          variant="caption"
                          gutterBottom
                          sx={{ fontSize: "0.7rem" }}
                        >
                          {card.title}
                        </Typography>
                        <Typography variant="h5" color={card.color}>
                          {card.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
