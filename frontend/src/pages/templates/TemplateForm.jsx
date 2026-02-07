import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { templateAPI } from "../../api/endpoints";

const INTERACTION_TYPES = [
  { value: "purchase", label: "Purchase" },
  { value: "interest", label: "Interest" },
  { value: "test_drive", label: "Test Drive" },
  { value: "general_inquiry", label: "General Inquiry" },
];

const TemplateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);
  const [placeholderDialogOpen, setPlaceholderDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
    setValue,
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      isActive: true,
    },
  });

  // Watch all form fields to detect changes
  const watchedFields = watch();

  useEffect(() => {
    if (isEditMode) {
      fetchTemplate();
    }
  }, [id]);

  useEffect(() => {
    // Track if form has been modified
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [watchedFields]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await templateAPI.getById(id);
      reset(response.data);
      setIsDirty(false); // Reset dirty flag after loading data
    } catch (err) {
      setError("Failed to load template");
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
        // Update template
        await templateAPI.update(id, data);
      } else {
        // Create template
        await templateAPI.create(data);
      }

      navigate("/templates");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Failed to ${isEditMode ? "update" : "create"} template`,
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/templates");
  };

  const handleInsertPlaceholder = (placeholder) => {
    const currentValue = watch("messageBody") || "";
    const newValue = currentValue + placeholder;
    setValue("messageBody", newValue, { shouldDirty: true });
    setPlaceholderDialogOpen(false);
  };

  const placeholders = [
    { label: "Customer First Name", value: "{{customerFirstName}}" },
    { label: "Customer Last Name", value: "{{customerLastName}}" },
    { label: "Vehicle Make", value: "{{vehicleMake}}" },
    { label: "Vehicle Model", value: "{{vehicleModel}}" },
    { label: "Vehicle Year", value: "{{vehicleYear}}" },
    { label: "Days Elapsed", value: "{{daysElapsed}}" },
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
      <Typography variant="h4" component="h1" mb={3}>
        {isEditMode ? "Edit Template" : "Create New Template"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Template Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                {...register("templateName", {
                  required: "Template name is required",
                  maxLength: {
                    value: 100,
                    message: "Template name must be 100 characters or less",
                  },
                })}
                error={!!errors.templateName}
                helperText={errors.templateName?.message}
              />
            </Grid>

            {/* Interaction Type */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="interactionType"
                control={control}
                rules={{ required: "Interaction type is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.interactionType}>
                    <InputLabel id="interaction-type-label">
                      Interaction Type *
                    </InputLabel>
                    <Select
                      labelId="interaction-type-label"
                      label="Interaction Type *"
                      {...field}
                    >
                      {INTERACTION_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {errors.interactionType?.message}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Days After */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Days After Interaction"
                type="number"
                {...register("daysAfter", {
                  required: "Days after is required",
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Must be at least 1 day",
                  },
                  max: {
                    value: 365,
                    message: "Cannot exceed 365 days",
                  },
                })}
                error={!!errors.daysAfter}
                helperText={
                  errors.daysAfter?.message ||
                  "Number of days after interaction to send follow-up"
                }
              />
            </Grid>

            {/* Message Subject */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message Subject (Optional)"
                {...register("messageSubject", {
                  maxLength: {
                    value: 255,
                    message: "Subject must be 255 characters or less",
                  },
                })}
                error={!!errors.messageSubject}
                helperText={errors.messageSubject?.message}
              />
            </Grid>

            {/* Message Body */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message Body"
                multiline
                rows={10}
                {...register("messageBody", {
                  required: "Message body is required",
                })}
                error={!!errors.messageBody}
                helperText={
                  errors.messageBody?.message ||
                  "Use placeholders to personalize messages"
                }
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPlaceholderDialogOpen(true)}
                sx={{ mt: 1 }}
              >
                Insert Placeholder
              </Button>
            </Grid>

            {/* Active Status */}
            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Active (generate follow-ups for new interactions)"
                  />
                )}
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
                  {isEditMode ? "Cancel" : "Exit"}
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

      {/* Placeholder Selection Dialog */}
      <Dialog
        open={placeholderDialogOpen}
        onClose={() => setPlaceholderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Insert Placeholder</DialogTitle>
        <DialogContent>
          <List>
            {placeholders.map((placeholder) => (
              <ListItemButton
                key={placeholder.value}
                onClick={() => handleInsertPlaceholder(placeholder.value)}
              >
                <ListItemText
                  primary={placeholder.label}
                  secondary={placeholder.value}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlaceholderDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateForm;
