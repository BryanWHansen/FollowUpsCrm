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
  Switch,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
  Dialog as PlaceholderDialog,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { templateAPI } from "../../api/endpoints";

const INTERACTION_TYPES = [
  { value: "purchase", label: "Purchase" },
  { value: "interest", label: "Interest" },
  { value: "test_drive", label: "Test Drive" },
  { value: "general_inquiry", label: "General Inquiry" },
];

const TemplateFormModal = ({ open, onClose, templateId, onSuccess }) => {
  const isEditMode = Boolean(templateId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const watchedFields = watch();

  useEffect(() => {
    if (open && isEditMode && templateId) {
      fetchTemplate();
    } else if (open && !isEditMode) {
      reset({
        templateName: "",
        interactionType: "",
        daysAfter: "",
        messageSubject: "",
        messageBody: "",
        isActive: true,
      });
      setError("");
      setIsDirty(false);
    }
  }, [open, templateId, isEditMode]);

  useEffect(() => {
    if (isEditMode && !loading) {
      setIsDirty(true);
    }
  }, [watchedFields, isEditMode, loading]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await templateAPI.getById(templateId);
      reset(response.data);
      setIsDirty(false);
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
        await templateAPI.update(templateId, data);
      } else {
        await templateAPI.create(data);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
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

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
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

  return (
    <>
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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5">
              {isEditMode ? "Edit Template" : "Create New Template"}
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
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Template Name"
                      {...register("templateName", {
                        required: "Template name is required",
                        maxLength: {
                          value: 100,
                          message:
                            "Template name must be 100 characters or less",
                        },
                      })}
                      error={!!errors.templateName}
                      helperText={errors.templateName?.message}
                    />
                  </Grid>

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

      {/* Placeholder Selection Dialog */}
      <PlaceholderDialog
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
      </PlaceholderDialog>
    </>
  );
};

export default TemplateFormModal;
