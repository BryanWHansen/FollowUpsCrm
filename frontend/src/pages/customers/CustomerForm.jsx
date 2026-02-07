import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { customerAPI } from "../../api/endpoints";

const CustomerForm = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const isEditMode = Boolean(customerId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Watch all form fields to detect changes
  const watchedFields = watch();

  useEffect(() => {
    if (isEditMode) {
      fetchCustomer();
    }
  }, [customerId]);

  useEffect(() => {
    // Track if form has been modified
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [watchedFields]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getById(customerId);
      reset(response.data);
      setIsDirty(false); // Reset dirty flag after loading data
    } catch (err) {
      setError("Failed to load customer");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");

      if (isEditMode) {
        // Update customer
        await customerAPI.update(customerId, data);
        navigate(`/customers/${customerId}`);
      } else {
        // Create customer
        const response = await customerAPI.create(data);
        const newCustomerId = response.data.customerId;

        // Redirect to interaction form with customerId
        navigate(`/customers/${newCustomerId}/interaction/new`);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Failed to ${isEditMode ? "update" : "create"} customer`,
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/customers/${customerId}`);
    } else {
      navigate("/customers");
    }
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
      <Typography variant="h4" component="h1" mb={3}>
        {isEditMode ? "Edit Customer" : "Create New Customer"}
      </Typography>

      {/* Progress Stepper */}
      {!isEditMode && (
        <Stepper activeStep={0} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Customer</StepLabel>
          </Step>
          <Step>
            <StepLabel>Interaction</StepLabel>
          </Step>
          <Step>
            <StepLabel>Vehicle</StepLabel>
          </Step>
        </Stepper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Required Fields */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="First Name"
                {...register("firstName", {
                  required: "First name is required",
                })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Last Name"
                {...register("lastName", {
                  required: "Last name is required",
                })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Preferred Name (Optional)"
                {...register("preferredName")}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                {...register("phoneNumber", {
                  required: "Phone number is required",
                })}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>

            {/* Optional Fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Birthday (Optional)"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register("birthday")}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address (Optional)"
                {...register("address")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={4}
                {...register("notes")}
              />
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting || (isEditMode && !isDirty)}
                >
                  {submitting
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update"
                      : "Create"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CustomerForm;
