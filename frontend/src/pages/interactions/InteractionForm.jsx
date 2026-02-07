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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { interactionAPI } from "../../api/endpoints";

const INTERACTION_TYPES = [
  { value: "purchase", label: "Purchase" },
  { value: "interest", label: "Interest" },
  { value: "test_drive", label: "Test Drive" },
  { value: "general_inquiry", label: "General Inquiry" },
];

const InteractionForm = () => {
  const navigate = useNavigate();
  const { customerId, interactionId } = useParams();
  const [searchParams] = useSearchParams();
  const fromDetail = searchParams.get("fromDetail") === "true";
  const isEditMode = Boolean(interactionId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
      interactionDate: new Date().toISOString().split("T")[0],
    },
  });

  const interactionType = watch("interactionType");
  const formValues = watch();

  // Load existing interaction data in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchInteraction = async () => {
        try {
          setLoading(true);
          const response = await interactionAPI.getById(interactionId);
          const interaction = response.data;

          // Reset form with fetched data
          reset({
            interactionType: interaction.interactionType,
            interactionDate: interaction.interactionDate,
            notes: interaction.notes || "",
          });

          // Reset isDirty after loading data
          setIsDirty(false);
        } catch (err) {
          setError(err.response?.data?.error || "Failed to load interaction");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchInteraction();
    }
  }, [isEditMode, interactionId, reset]);

  // Track form changes
  useEffect(() => {
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [formValues, isEditMode, loading]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");

      if (isEditMode) {
        // Update interaction
        const interactionData = {
          ...data,
          customerId: parseInt(customerId),
        };

        await interactionAPI.update(interactionId, interactionData);

        // Navigate back to customer detail page
        navigate(`/customers/${customerId}`);
      } else {
        // Create interaction
        const interactionData = {
          ...data,
          customerId: parseInt(customerId),
        };

        const response = await interactionAPI.create(interactionData);
        const newInteractionId = response.data.interactionId;

        // Always redirect based on interaction type
        if (data.interactionType === "purchase") {
          navigate(
            `/customers/${customerId}/vehicle/new?interactionId=${newInteractionId}${fromDetail ? "&fromDetail=true" : ""}`,
          );
        } else {
          navigate(
            `/customers/${customerId}/interest-vehicle/new?interactionId=${newInteractionId}${fromDetail ? "&fromDetail=true" : ""}`,
          );
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Failed to ${isEditMode ? "update" : "create"} interaction`,
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Skip button returns to customer detail
    navigate(`/customers/${customerId}`);
  };

  const handleExit = () => {
    // Exit button returns to customer detail
    navigate(`/customers/${customerId}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        {isEditMode ? "Edit Interaction" : "Create Interaction"}
      </Typography>

      {/* Progress Stepper */}
      {!isEditMode && (
        <Stepper activeStep={fromDetail ? 0 : 1} sx={{ mb: 4 }}>
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
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.interactionType}>
                    <InputLabel>Interaction Type</InputLabel>
                    <Controller
                      name="interactionType"
                      control={control}
                      rules={{ required: "Interaction type is required" }}
                      render={({ field }) => (
                        <Select {...field} label="Interaction Type">
                          {INTERACTION_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.interactionType && (
                      <FormHelperText>
                        {errors.interactionType.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Interaction Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    {...register("interactionDate", {
                      required: "Interaction date is required",
                    })}
                    error={!!errors.interactionDate}
                    helperText={errors.interactionDate?.message}
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
                        Cancel
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
                          : "Next"
                        : isEditMode
                          ? "Update"
                          : fromDetail
                            ? "Next"
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

export default InteractionForm;
