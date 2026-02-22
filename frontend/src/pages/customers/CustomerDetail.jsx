import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary, {
  accordionSummaryClasses,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  customerAPI,
  interactionAPI,
  vehicleAPI,
  interestVehicleAPI,
  followupAPI,
} from "../../api/endpoints";
import { format } from "date-fns";
import InteractionFormModal from "../../components/modals/InteractionFormModal";
import VehicleFormModal from "../../components/modals/VehicleFormModal";
import InterestVehicleFormModal from "../../components/modals/InterestVehicleFormModal";

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

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [interestVehicles, setInterestVehicles] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(""); // 'interaction', 'vehicle', 'interestVehicle'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [expandedFollowup, setExpandedFollowup] = useState(false);

  // Modal states
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [interestVehicleModalOpen, setInterestVehicleModalOpen] =
    useState(false);
  const [editInteractionId, setEditInteractionId] = useState(null);
  const [editVehicleId, setEditVehicleId] = useState(null);
  const [editInterestVehicleId, setEditInterestVehicleId] = useState(null);
  const [pendingInteractionId, setPendingInteractionId] = useState(null);
  const [pendingInteractionType, setPendingInteractionType] = useState(null);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch customer details
      const customerResponse = await customerAPI.getById(customerId);
      setCustomer(customerResponse.data);

      // Fetch interactions for this customer
      const interactionsResponse = await interactionAPI.getAll({
        customerId: customerId,
      });
      setInteractions(interactionsResponse.data);

      // Fetch purchased vehicles for this customer
      const vehiclesResponse = await vehicleAPI.getByCustomerId(customerId);
      setVehicles(vehiclesResponse.data);

      // Fetch interest vehicles for this customer
      const interestVehiclesResponse =
        await interestVehicleAPI.getByCustomerId(customerId);
      setInterestVehicles(interestVehiclesResponse.data);

      // Fetch follow-ups for this customer
      const followupsResponse = await followupAPI.getAll({
        customerId: customerId,
      });
      setFollowups(followupsResponse.data);
    } catch (err) {
      setError("Failed to load customer data");
      console.error(err);
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
      return `${month}/${day}/${year}`;
    } catch {
      return "N/A";
    }
  };

  const formatInteractionType = (type) => {
    const typeMap = {
      purchase: "Purchase",
      interest: "Interest",
      test_drive: "Test Drive",
      general_inquiry: "General Inquiry",
    };
    return typeMap[type] || type;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getInteractionTypeColor = (type) => {
    const colorMap = {
      purchase: "success",
      interest: "info",
      test_drive: "warning",
      general_inquiry: "default",
    };
    return colorMap[type] || "default";
  };

  const handleDeleteClick = (type, item) => {
    setDeleteType(type);
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);

      if (deleteType === "interaction") {
        await interactionAPI.delete(itemToDelete.interactionId);
        setInteractions(
          interactions.filter(
            (i) => i.interactionId !== itemToDelete.interactionId,
          ),
        );
      } else if (deleteType === "vehicle") {
        await vehicleAPI.delete(itemToDelete.vehicleId);
        setVehicles(
          vehicles.filter((v) => v.vehicleId !== itemToDelete.vehicleId),
        );
      } else if (deleteType === "interestVehicle") {
        await interestVehicleAPI.delete(itemToDelete.interestVehicleId);
        setInterestVehicles(
          interestVehicles.filter(
            (iv) => iv.interestVehicleId !== itemToDelete.interestVehicleId,
          ),
        );
      }

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setError("");
    } catch (err) {
      setError("Failed to delete item");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const getDeleteDialogContent = () => {
    if (!itemToDelete) return { title: "", description: "" };

    if (deleteType === "interaction") {
      return {
        title: "Delete Interaction",
        description: `Are you sure you want to delete this ${formatInteractionType(itemToDelete.interactionType)} interaction? This action cannot be undone.`,
      };
    } else if (deleteType === "vehicle") {
      return {
        title: "Delete Vehicle",
        description: `Are you sure you want to delete ${itemToDelete.year} ${itemToDelete.make} ${itemToDelete.model}? This action cannot be undone.`,
      };
    } else if (deleteType === "interestVehicle") {
      return {
        title: "Delete Interest Vehicle",
        description:
          "Are you sure you want to delete this vehicle interest? This action cannot be undone.",
      };
    }
    return { title: "", description: "" };
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleFollowupAccordionChange = (panel) => (event, newExpanded) => {
    setExpandedFollowup(newExpanded ? panel : false);
  };

  // Modal handlers
  const handleOpenInteractionModal = (interactionId = null) => {
    setEditInteractionId(interactionId);
    setInteractionModalOpen(true);
  };

  const handleCloseInteractionModal = () => {
    setInteractionModalOpen(false);
    setEditInteractionId(null);
  };

  const handleInteractionSuccess = () => {
    fetchCustomerData();
  };

  const handleVehicleNeeded = (interactionId, interactionType) => {
    setPendingInteractionId(interactionId);
    setPendingInteractionType(interactionType);

    if (interactionType === "purchase") {
      setVehicleModalOpen(true);
    } else {
      setInterestVehicleModalOpen(true);
    }
  };

  const handleOpenVehicleModal = (vehicleId = null, interactionId = null) => {
    setEditVehicleId(vehicleId);
    setPendingInteractionId(interactionId);
    setVehicleModalOpen(true);
  };

  const handleCloseVehicleModal = () => {
    setVehicleModalOpen(false);
    setEditVehicleId(null);
    setPendingInteractionId(null);
  };

  const handleVehicleSuccess = () => {
    fetchCustomerData();
    setPendingInteractionId(null);
  };

  const handleOpenInterestVehicleModal = (
    interestVehicleId = null,
    interactionId = null,
  ) => {
    setEditInterestVehicleId(interestVehicleId);
    setPendingInteractionId(interactionId);
    setInterestVehicleModalOpen(true);
  };

  const handleCloseInterestVehicleModal = () => {
    setInterestVehicleModalOpen(false);
    setEditInterestVehicleId(null);
    setPendingInteractionId(null);
  };

  const handleInterestVehicleSuccess = () => {
    fetchCustomerData();
    setPendingInteractionId(null);
  };

  const formatFollowupStatus = (status) => {
    const statusMap = {
      pending: "Pending",
      completed: "Completed",
      dismissed: "Dismissed",
      snoozed: "Snoozed",
    };
    return statusMap[status] || status;
  };

  const getFollowupStatusColor = (status) => {
    const colorMap = {
      pending: "warning",
      completed: "success",
      dismissed: "default",
      snoozed: "info",
    };
    return colorMap[status] || "default";
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

  if (error || !customer) {
    return (
      <Box>
        <Alert severity="error">{error || "Customer not found"}</Alert>
        <Button onClick={() => navigate("/customers")} sx={{ mt: 2 }}>
          Back to Customers
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Customer Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {customer.lastName}, {customer.firstName}
            {customer.preferredName &&
              customer.preferredName !== customer.firstName && (
                <Typography
                  component="span"
                  variant="h4"
                  color="text.secondary"
                >
                  {" "}
                  ({customer.preferredName})
                </Typography>
              )}
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            {customer.email} | {customer.phoneNumber}
          </Typography>
          {customer.address && (
            <Typography variant="body2" color="text.secondary">
              {customer.address}
            </Typography>
          )}
        </Box>
        <Button variant="outlined" onClick={() => navigate("/customers")}>
          Back to Customers
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Interactions" />
          <Tab label="Follow Ups" />
        </Tabs>
      </Paper>

      {/* Tab Panel 0: Interactions */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {/* Interactions Card */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Interactions"
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenInteractionModal()}
                  >
                    Create Interaction
                  </Button>
                }
              />
              <CardContent>
                {interactions.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    py={2}
                  >
                    No interactions yet
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <strong>Type</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Date</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Notes</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Created</strong>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {interactions.map((interaction) => (
                          <TableRow key={interaction.interactionId} hover>
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
                            <TableCell>
                              {formatDate(interaction.interactionDate)}
                            </TableCell>
                            <TableCell>
                              {interaction.notes ? (
                                <Typography
                                  variant="body2"
                                  noWrap
                                  sx={{ maxWidth: 300 }}
                                >
                                  {interaction.notes}
                                </Typography>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(interaction.createdAt)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  handleOpenInteractionModal(
                                    interaction.interactionId,
                                  )
                                }
                                sx={{ mr: 0.5 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteClick("interaction", interaction)
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Info Alert when no interactions */}
          {interactions.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                Create an interaction first to record vehicle details
              </Alert>
            </Grid>
          )}

          {/* Purchased Vehicles Card - Only show for customers, not leads */}
          {interactions.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Purchased Vehicles"
                  action={
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenVehicleModal()}
                    >
                      Create Vehicle
                    </Button>
                  }
                />
                <CardContent>
                  {vehicles.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      py={2}
                    >
                      No purchased vehicles
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>Vehicle</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Purchase Date</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Sale Price</strong>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {vehicles.map((vehicle) => (
                            <TableRow key={vehicle.vehicleId} hover>
                              <TableCell>
                                <Typography variant="body2">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </Typography>
                                {vehicle.color && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {vehicle.color}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {formatDate(vehicle.purchaseDate)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(vehicle.salePrice)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() =>
                                    handleOpenVehicleModal(vehicle.vehicleId)
                                  }
                                  sx={{ mr: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleDeleteClick("vehicle", vehicle)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Interest Vehicles Card */}
          {interactions.filter((i) => i.interactionType !== "purchase").length >
            0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Interest Vehicles"
                  action={
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenInterestVehicleModal()}
                    >
                      Add Interest
                    </Button>
                  }
                />
                <CardContent>
                  {interestVehicles.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      py={2}
                    >
                      No vehicle interests recorded
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>Vehicle Description</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Notes</strong>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {interestVehicles.map((interestVehicle) => (
                            <TableRow
                              key={interestVehicle.interestVehicleId}
                              hover
                            >
                              <TableCell>
                                <Typography variant="body2">
                                  {[
                                    interestVehicle.year,
                                    interestVehicle.color,
                                    interestVehicle.make,
                                    interestVehicle.model,
                                    interestVehicle.trim,
                                    interestVehicle.vehicleType,
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {interestVehicle.notes ? (
                                  <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{ maxWidth: 200 }}
                                  >
                                    {interestVehicle.notes}
                                  </Typography>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() =>
                                    handleOpenInterestVehicleModal(
                                      interestVehicle.interestVehicleId,
                                    )
                                  }
                                  sx={{ mr: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleDeleteClick(
                                      "interestVehicle",
                                      interestVehicle,
                                    )
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab Panel 1: Follow Ups */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Follow Ups" />
              <CardContent>
                {followups.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      gutterBottom
                    >
                      No follow-ups yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {interactions.length > 0 ? (
                        <>
                          Create a{" "}
                          <Link
                            to="/templates"
                            style={{
                              color: "#1976d2",
                              textDecoration: "underline",
                            }}
                          >
                            template
                          </Link>{" "}
                          for the interaction associated with this customer.
                        </>
                      ) : (
                        "Create an interaction and add a vehicle to generate follow-ups automatically."
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {followups.map((followup) => (
                      <Accordion
                        key={followup.followupId}
                        expanded={
                          expandedFollowup === `followup-${followup.followupId}`
                        }
                        onChange={handleFollowupAccordionChange(
                          `followup-${followup.followupId}`,
                        )}
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
                            <Grid item xs={12} sm={3}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Scheduled:</strong>{" "}
                                {formatDate(followup.scheduledDate)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              {followup.messageSubject ? (
                                <Typography variant="body2" noWrap>
                                  {followup.messageSubject}
                                </Typography>
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No Subject
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={6} sm={2}>
                              <Chip
                                label={formatFollowupStatus(followup.status)}
                                color={getFollowupStatusColor(followup.status)}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              {followup.completedDate && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  <strong>Completed:</strong>{" "}
                                  {formatDate(followup.completedDate)}
                                </Typography>
                              )}
                            </Grid>
                          </Grid>
                        </AccordionSummary>
                        <AccordionDetails>
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
                          {followup.notes && (
                            <Box sx={{ mt: 2 }}>
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                fontWeight="medium"
                              >
                                Notes:
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {followup.notes}
                              </Typography>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{getDeleteDialogContent().title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {getDeleteDialogContent().description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      <InteractionFormModal
        open={interactionModalOpen}
        onClose={handleCloseInteractionModal}
        customerId={customerId}
        interactionId={editInteractionId}
        onSuccess={handleInteractionSuccess}
        onVehicleNeeded={handleVehicleNeeded}
      />

      <VehicleFormModal
        open={vehicleModalOpen}
        onClose={handleCloseVehicleModal}
        customerId={customerId}
        vehicleId={editVehicleId}
        interactionId={pendingInteractionId}
        onSuccess={handleVehicleSuccess}
      />

      <InterestVehicleFormModal
        open={interestVehicleModalOpen}
        onClose={handleCloseInterestVehicleModal}
        customerId={customerId}
        interestVehicleId={editInterestVehicleId}
        interactionId={pendingInteractionId}
        onSuccess={handleInterestVehicleSuccess}
      />
    </Box>
  );
};

export default CustomerDetail;
