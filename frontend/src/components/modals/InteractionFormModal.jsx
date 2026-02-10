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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { interactionAPI } from "../../api/endpoints";

const INTERACTION_TYPES = [
  { value: "purchase", label: "Purchase" },
  { value: "interest", label: "Interest" },
  { value: "test_drive", label: "Test Drive" },
  { value: "general_inquiry", label: "General Inquiry" },
];

const InteractionFormModal = ({
  open,
  onClose,
  customerId,
  interactionId,
  onSuccess,
  onVehicleNeeded,
  fromNewCustomer = false,
}) => {
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

  const formValues = watch();

  useEffect(() => {
    if (open && isEditMode && interactionId) {
      fetchInteraction();
    } else if (open && !isEditMode) {
      reset({
        interactionDate: new Date().toISOString().split("T")[0],
        interactionType: "",
        notes: "",
      });
      setError("");
      setIsDirty(false);
    }
  }, [open, interactionId, isEditMode]);

  useEffect(() => {
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [formValues, isEditMode, loading]);

  const fetchInteraction = async () => {
    try {
      setLoading(true);
      const response = await interactionAPI.getById(interactionId);
      const interaction = response.data;

      reset({
        interactionType: interaction.interactionType,
        interactionDate: interaction.interactionDate,
        notes: interaction.notes || "",
      });

      setIsDirty(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load interaction");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");

      const interactionData = {
        ...data,
        customerId: parseInt(customerId),
      };

      if (isEditMode) {
        await interactionAPI.update(interactionId, interactionData);
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        const response = await interactionAPI.create(interactionData);
        const newInteractionId = response.data.interactionId;

        if (onSuccess) {
          onSuccess();
        }

        // Notify parent to open vehicle modal
        if (onVehicleNeeded) {
          onVehicleNeeded(newInteractionId, data.interactionType);
        }

        onClose();
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

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
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
            {isEditMode ? "Edit Interaction" : "Create Interaction"}
          </Typography>
          <IconButton onClick={handleClose} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        {!isEditMode && (
          <Stepper activeStep={fromNewCustomer ? 1 : 0} sx={{ mb: 3 }}>
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

                <Grid item xs={12}>
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

export default InteractionFormModal;
