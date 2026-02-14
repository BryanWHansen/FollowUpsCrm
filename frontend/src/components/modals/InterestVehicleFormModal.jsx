import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { interestVehicleAPI, interactionAPI } from "../../api/endpoints";

const InterestVehicleFormModal = ({
  open,
  onClose,
  customerId,
  interestVehicleId,
  interactionId,
  onSuccess,
  fromNewCustomer = false,
}) => {
  const isEditMode = Boolean(interestVehicleId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      interactionId: interactionId ? parseInt(interactionId) : "",
    },
  });

  const formValues = watch();

  useEffect(() => {
    if (open && customerId) {
      fetchInteractions();
    }
  }, [open, customerId]);

  useEffect(() => {
    if (open && isEditMode && interestVehicleId) {
      fetchInterestVehicle();
    } else if (open && !isEditMode) {
      reset({
        interactionId: interactionId ? parseInt(interactionId) : "",
        make: "",
        model: "",
        year: "",
        color: "",
        trim: "",
        vehicleType: "",
        notes: "",
      });
      setError("");
      setIsDirty(false);
    }
  }, [open, interestVehicleId, isEditMode, interactionId]);

  useEffect(() => {
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [formValues, isEditMode, loading]);

  const fetchInteractions = async () => {
    try {
      setLoadingInteractions(true);
      const response = await interactionAPI.getAll({
        customerId: parseInt(customerId),
      });
      const nonPurchaseInteractions = response.data.filter(
        (interaction) => interaction.interactionType !== "purchase",
      );
      setInteractions(nonPurchaseInteractions);
    } catch (err) {
      console.error("Failed to fetch interactions:", err);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const fetchInterestVehicle = async () => {
    try {
      setLoading(true);
      const response = await interestVehicleAPI.getByCustomerId(customerId);
      const interestVehicle = response.data.find(
        (v) => v.interestVehicleId === parseInt(interestVehicleId),
      );

      if (!interestVehicle) {
        setError("Interest vehicle not found");
        return;
      }

      reset({
        interactionId: interestVehicle.interactionId || "",
        make: interestVehicle.make || "",
        model: interestVehicle.model || "",
        year: interestVehicle.year || "",
        color: interestVehicle.color || "",
        trim: interestVehicle.trim || "",
        vehicleType: interestVehicle.vehicleType || "",
        notes: interestVehicle.notes || "",
      });

      setIsDirty(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load interest vehicle");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatInteractionType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      // Extract date part to avoid timezone conversion issues
      const datePart = date.split("T")[0];
      const [year, month, day] = datePart.split("-");
      return `${month}/${day}/${year}`;
    } catch {
      return "N/A";
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");

      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== ""),
      );

      if (!isEditMode) {
        const hasVehicleAttribute = [
          "make",
          "model",
          "year",
          "color",
          "trim",
          "vehicleType",
        ].some((field) => filteredData[field]);

        if (!hasVehicleAttribute) {
          setError(
            "Please provide at least one vehicle detail (make, model, year, color, trim, or vehicle type)",
          );
          setSubmitting(false);
          return;
        }
      }

      const interestVehicleData = {
        ...filteredData,
        customerId: parseInt(customerId),
        interactionId: filteredData.interactionId
          ? parseInt(filteredData.interactionId)
          : null,
      };

      if (isEditMode) {
        await interestVehicleAPI.update(interestVehicleId, interestVehicleData);
      } else {
        await interestVehicleAPI.create(interestVehicleData);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Failed to ${isEditMode ? "update" : "create"} interest vehicle`,
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
            {isEditMode ? "Edit Vehicle Interest" : "Record Vehicle Interest"}
          </Typography>
          <IconButton onClick={handleClose} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        {!isEditMode && interactionId && (
          <Stepper activeStep={fromNewCustomer ? 2 : 1} sx={{ mb: 3 }}>
            {fromNewCustomer && (
              <Step>
                <StepLabel>Customer</StepLabel>
              </Step>
            )}
            <Step>
              <StepLabel>Interaction</StepLabel>
            </Step>
            <Step>
              <StepLabel>Vehicle</StepLabel>
            </Step>
          </Stepper>
        )}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!isEditMode && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Provide any details about the vehicle the customer is interested
                in. At least one field is required.
              </Typography>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="interactionId"
                    control={control}
                    rules={{ required: "Interaction is required" }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.interactionId}>
                        <InputLabel id="interaction-label">
                          Interaction *
                        </InputLabel>
                        <Select
                          labelId="interaction-label"
                          label="Interaction *"
                          {...field}
                          disabled={
                            loadingInteractions || interactions.length === 0
                          }
                        >
                          {interactions.map((interaction) => (
                            <MenuItem
                              key={interaction.interactionId}
                              value={interaction.interactionId}
                            >
                              {formatInteractionType(
                                interaction.interactionType,
                              )}{" "}
                              - {formatDate(interaction.interactionDate)}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {errors.interactionId?.message ||
                            (interactions.length === 0 && !loadingInteractions
                              ? "No interactions available. Create an interaction first."
                              : "")}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Make (Optional)"
                    {...register("make")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model (Optional)"
                    {...register("model")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="year"
                    control={control}
                    rules={{
                      validate: (value) => {
                        if (!value) return true; // Optional field
                        const year =
                          value instanceof Date ? value.getFullYear() : value;
                        if (year < 1900) return "Year must be 1900 or later";
                        if (year > new Date().getFullYear() + 2)
                          return "Year cannot be more than 2 years in the future";
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Year (Optional)"
                          value={
                            field.value ? new Date(field.value, 0, 1) : null
                          }
                          onChange={(date) => {
                            field.onChange(date ? date.getFullYear() : null);
                          }}
                          views={["year"]}
                          minDate={new Date(1900, 0, 1)}
                          maxDate={
                            new Date(new Date().getFullYear() + 2, 11, 31)
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.year,
                              helperText: errors.year?.message,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Color (Optional)"
                    {...register("color")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Trim (Optional)"
                    {...register("trim")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Type (Optional)"
                    placeholder="e.g., pickup, sedan, SUV"
                    {...register("vehicleType")}
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

export default InterestVehicleFormModal;
