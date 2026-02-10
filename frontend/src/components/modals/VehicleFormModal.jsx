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
import { vehicleAPI, interactionAPI } from "../../api/endpoints";

const VehicleFormModal = ({
  open,
  onClose,
  customerId,
  vehicleId,
  interactionId,
  onSuccess,
  fromNewCustomer = false,
}) => {
  const isEditMode = Boolean(vehicleId);
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
      purchaseDate: new Date().toISOString().split("T")[0],
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
    if (open && isEditMode && vehicleId) {
      fetchVehicle();
    } else if (open && !isEditMode) {
      reset({
        purchaseDate: new Date().toISOString().split("T")[0],
        interactionId: interactionId ? parseInt(interactionId) : "",
        make: "",
        model: "",
        year: "",
        vin: "",
        salePrice: "",
        color: "",
        mileage: "",
        notes: "",
      });
      setError("");
      setIsDirty(false);
    }
  }, [open, vehicleId, isEditMode, interactionId]);

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
      const purchaseInteractions = response.data.filter(
        (interaction) => interaction.interactionType === "purchase",
      );
      setInteractions(purchaseInteractions);
    } catch (err) {
      console.error("Failed to fetch interactions:", err);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getByCustomerId(customerId);
      const vehicle = response.data.find(
        (v) => v.vehicleId === parseInt(vehicleId),
      );

      if (!vehicle) {
        setError("Vehicle not found");
        return;
      }

      reset({
        interactionId: vehicle.interactionId || "",
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        purchaseDate: vehicle.purchaseDate,
        vin: vehicle.vin || "",
        salePrice: vehicle.salePrice || "",
        color: vehicle.color || "",
        mileage: vehicle.mileage || "",
        notes: vehicle.notes || "",
      });

      setIsDirty(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load vehicle");
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
    return format(new Date(date), "MM/dd/yyyy");
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");

      const vehicleData = {
        ...data,
        customerId: parseInt(customerId),
        interactionId: data.interactionId ? parseInt(data.interactionId) : null,
      };

      if (isEditMode) {
        await vehicleAPI.update(vehicleId, vehicleData);
      } else {
        await vehicleAPI.create(vehicleData);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Failed to ${isEditMode ? "update" : "create"} vehicle`,
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
            {isEditMode ? "Edit Purchased Vehicle" : "Create Purchased Vehicle"}
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
                    label="Make"
                    {...register("make", {
                      required: "Make is required",
                    })}
                    error={!!errors.make}
                    helperText={errors.make?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    {...register("model", {
                      required: "Model is required",
                    })}
                    error={!!errors.model}
                    helperText={errors.model?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="year"
                    control={control}
                    rules={{
                      required: "Year is required",
                      validate: (value) => {
                        if (!value) return "Year is required";
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
                          label="Year *"
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
                    label="Purchase Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    {...register("purchaseDate", {
                      required: "Purchase date is required",
                    })}
                    error={!!errors.purchaseDate}
                    helperText={errors.purchaseDate?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="VIN (Optional)"
                    {...register("vin")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Sale Price (Optional)"
                    type="number"
                    InputProps={{ startAdornment: "$" }}
                    {...register("salePrice", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Sale price must be positive",
                      },
                    })}
                    error={!!errors.salePrice}
                    helperText={errors.salePrice?.message}
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
                    label="Mileage (Optional)"
                    type="number"
                    {...register("mileage", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Mileage must be positive",
                      },
                    })}
                    error={!!errors.mileage}
                    helperText={errors.mileage?.message}
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

export default VehicleFormModal;
