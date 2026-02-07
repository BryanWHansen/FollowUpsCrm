import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { format } from "date-fns";
import { interestVehicleAPI, interactionAPI } from "../../api/endpoints";

const InterestVehicleForm = () => {
  const navigate = useNavigate();
  const { customerId, interestVehicleId } = useParams();
  const [searchParams] = useSearchParams();
  const interactionId = searchParams.get("interactionId");
  const fromDetail = searchParams.get("fromDetail") === "true";
  const isEditMode = Boolean(interestVehicleId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(true);

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

  // Load existing interest vehicle data in edit mode
  useEffect(() => {
    if (isEditMode) {
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

          // Reset form with fetched data
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

          // Reset isDirty after loading data
          setIsDirty(false);
        } catch (err) {
          setError(
            err.response?.data?.error || "Failed to load interest vehicle",
          );
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchInterestVehicle();
    }
  }, [isEditMode, interestVehicleId, customerId, reset]);

  // Track form changes
  useEffect(() => {
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [formValues, isEditMode, loading]);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        setLoadingInteractions(true);
        const response = await interactionAPI.getAll({
          customerId: parseInt(customerId),
        });
        // Filter to exclude purchase interactions
        const nonPurchaseInteractions = response.data.filter(
          (interaction) => interaction.interactionType !== "purchase",
        );
        setInteractions(nonPurchaseInteractions);
      } catch (err) {
        console.error("Failed to fetch interactions:", err);
        setError("Failed to load interactions");
      } finally {
        setLoadingInteractions(false);
      }
    };

    fetchInteractions();
  }, [customerId]);

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

      // Filter out empty fields
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== ""),
      );

      // Check if at least one vehicle attribute is provided (skip for edit mode)
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
          return;
        }
      }

      // Create or update interest vehicle
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

      // Always redirect back to customer detail page
      navigate(`/customers/${customerId}`);
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

  const handleSkip = () => {
    navigate("/customers");
  };

  const handleExit = () => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        {isEditMode ? "Edit Vehicle Interest" : "Record Vehicle Interest"}
      </Typography>

      {/* Progress Stepper */}
      {!isEditMode && (fromDetail ? interactionId : true) && (
        <Stepper activeStep={fromDetail ? 1 : 2} sx={{ mb: 4 }}>
          {!fromDetail && (
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

      {!isEditMode && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          Provide any details about the vehicle the customer is interested in.
          At least one field is required.
        </Typography>
      )}

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Interaction Selection */}
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
                              ? "No non-purchase interactions available. Create an interaction first."
                              : "")}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Make" {...register("make")} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Model" {...register("model")} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    {...register("year", {
                      valueAsNumber: true,
                      min: {
                        value: 1900,
                        message: "Year must be 1900 or later",
                      },
                      max: {
                        value: new Date().getFullYear() + 2,
                        message:
                          "Year cannot be more than 2 years in the future",
                      },
                    })}
                    error={!!errors.year}
                    helperText={errors.year?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Color" {...register("color")} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Trim" {...register("trim")} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Type"
                    placeholder="e.g. Sedan, SUV, Truck, Pickup"
                    {...register("vehicleType")}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={4}
                    {...register("notes")}
                  />
                </Grid>

                {/* Buttons */}
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    {!fromDetail && !isEditMode && (
                      <Button
                        variant="outlined"
                        onClick={handleSkip}
                        disabled={submitting}
                      >
                        Skip
                      </Button>
                    )}
                    {(fromDetail || isEditMode) && (
                      <Button
                        variant="outlined"
                        onClick={handleExit}
                        disabled={submitting}
                      >
                        {isEditMode ? "Cancel" : "Exit"}
                      </Button>
                    )}
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
                          : fromDetail
                            ? "Create & Return"
                            : "Create"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default InterestVehicleForm;
