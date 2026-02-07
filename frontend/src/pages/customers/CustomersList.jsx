import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { customerAPI } from "../../api/endpoints";
import { format } from "date-fns";
import CustomerFormModal from "../../components/modals/CustomerFormModal";

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data);
      setError("");
    } catch (err) {
      setError("Failed to load customers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCustomerName = (customer) => {
    if (
      customer.preferredName &&
      customer.preferredName !== customer.firstName
    ) {
      return `${customer.lastName}, ${customer.firstName} (${customer.preferredName})`;
    }
    return `${customer.lastName}, ${customer.firstName}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MM/dd/yyyy");
    } catch {
      return "N/A";
    }
  };

  const handleRowClick = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  const handleEditClick = (event, customerId) => {
    event.stopPropagation(); // Prevent row click
    setEditCustomerId(customerId);
    setCustomerModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditCustomerId(null);
    setCustomerModalOpen(true);
  };

  const handleCloseModal = () => {
    setCustomerModalOpen(false);
    setEditCustomerId(null);
  };

  const handleCustomerSuccess = () => {
    fetchCustomers();
  };

  const handleDeleteClick = (event, customer) => {
    event.stopPropagation(); // Prevent row click
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      setDeleting(true);
      await customerAPI.delete(customerToDelete.customerId);

      // Remove customer from list
      setCustomers(
        customers.filter((c) => c.customerId !== customerToDelete.customerId),
      );
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      setError("");
    } catch (err) {
      setError("Failed to delete customer");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
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
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Customers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
        >
          Create Customer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "grey.100" }}>
            <TableRow>
              <TableCell>
                <strong>Customer Name</strong>
              </TableCell>
              <TableCell>
                <strong>Address</strong>
              </TableCell>
              <TableCell>
                <strong>Email</strong>
              </TableCell>
              <TableCell>
                <strong>Last Contact Date</strong>
              </TableCell>
              <TableCell>
                <strong>First Interaction</strong>
              </TableCell>
              <TableCell>
                <strong>Last Updated</strong>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 3 }}
                  >
                    No customers found. Create your first customer to get
                    started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.customerId}
                  hover
                  onClick={() => handleRowClick(customer.customerId)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{formatCustomerName(customer)}</TableCell>
                  <TableCell>{customer.address || "N/A"}</TableCell>
                  <TableCell>{customer.email || "N/A"}</TableCell>
                  <TableCell>{formatDate(customer.lastContactDate)}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>{formatDate(customer.updatedAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={(e) => handleEditClick(e, customer.customerId)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={(e) => handleDeleteClick(e, customer)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {customerToDelete?.firstName}{" "}
            {customerToDelete?.lastName}? This action cannot be undone and will
            also delete all associated vehicles, interactions, and follow-ups.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Form Modal */}
      <CustomerFormModal
        open={customerModalOpen}
        onClose={handleCloseModal}
        customerId={editCustomerId}
        onSuccess={handleCustomerSuccess}
      />
    </Box>
  );
};

export default CustomersList;
