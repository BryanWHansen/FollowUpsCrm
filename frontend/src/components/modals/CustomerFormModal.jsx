import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { customerAPI } from "../../api/endpoints";

const CustomerFormModal = ({ open, onClose, customerId, onSuccess }) => {
  const isEditMode = Boolean(customerId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const watchedFields = watch();

  useEffect(() => {
    if (open && isEditMode && customerId) {
      fetchCustomer();
    } else if (open && !isEditMode) {
      reset({});
      setError("");
      setIsDirty(false);
    }
  }, [open, customerId, isEditMode]);

  useEffect(() => {
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [watchedFields, isEditMode, loading]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getById(customerId);
      reset(response.data);
      setIsDirty(false);
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
        await customerAPI.update(customerId, data);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const response = await customerAPI.create(data);
        const newCustomer = response.data;
        if (onSuccess) {
          onSuccess(newCustomer);
        }
      }

      onClose();
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

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(3px)",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            {isEditMode ? "Edit Customer" : "Create New Customer"}
          </Typography>
          <IconButton onClick={handleClose} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
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

                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={handleClose}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFormModal;
