import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
} from '@mui/material';
import { format } from 'date-fns';
import { vehicleAPI, interactionAPI } from '../../api/endpoints';

const VehicleForm = () => {
  const navigate = useNavigate();
  const { customerId, vehicleId } = useParams();
  const [searchParams] = useSearchParams();
  const interactionId = searchParams.get('interactionId');
  const fromDetail = searchParams.get('fromDetail') === 'true';
  const isEditMode = Boolean(vehicleId);
  const [error, setError] = useState('');
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
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      interactionId: interactionId ? parseInt(interactionId) : '',
    },
  });

  const formValues = watch();

  // Load existing vehicle data in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchVehicle = async () => {
        try {
          setLoading(true);
          const response = await vehicleAPI.getByCustomerId(customerId);
          const vehicle = response.data.find(v => v.vehicleId === parseInt(vehicleId));
          
          if (!vehicle) {
            setError('Vehicle not found');
            return;
          }
          
          // Reset form with fetched data
          reset({
            interactionId: vehicle.interactionId || '',
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            purchaseDate: vehicle.purchaseDate,
            vin: vehicle.vin || '',
            salePrice: vehicle.salePrice || '',
            color: vehicle.color || '',
            mileage: vehicle.mileage || '',
            notes: vehicle.notes || '',
          });
          
          // Reset isDirty after loading data
          setIsDirty(false);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to load vehicle');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchVehicle();
    }
  }, [isEditMode, vehicleId, customerId, reset]);

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
        const response = await interactionAPI.getAll({ customerId: parseInt(customerId) });
        // Filter to only show purchase interactions
        const purchaseInteractions = response.data.filter(
          interaction => interaction.interactionType === 'purchase'
        );
        setInteractions(purchaseInteractions);
      } catch (err) {
        console.error('Failed to fetch interactions:', err);
        setError('Failed to load interactions');
      } finally {
        setLoadingInteractions(false);
      }
    };

    fetchInteractions();
  }, [customerId]);

  const formatInteractionType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MM/dd/yyyy');
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError('');
      
      // Create or update vehicle
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
      
      // Always redirect back to customer detail page
      navigate(`/customers/${customerId}`);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} vehicle`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/customers');
  };

  const handleExit = () => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        {isEditMode ? 'Edit Purchased Vehicle' : 'Create Purchased Vehicle'}
      </Typography>

      {/* Progress Stepper */}
      {!isEditMode && (fromDetail ? interactionId : true) && (
        <Stepper activeStep={fromDetail ? 1 : 2} sx={{ mb: 4 }}>
          {!fromDetail && <Step><StepLabel>Customer</StepLabel></Step>}
          <Step><StepLabel>Interaction</StepLabel></Step>
          <Step><StepLabel>Vehicle</StepLabel></Step>
        </Stepper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
                    rules={{ required: 'Interaction is required' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.interactionId}>
                        <InputLabel id="interaction-label">Interaction *</InputLabel>
                        <Select
                          labelId="interaction-label"
                          label="Interaction *"
                          {...field}
                          disabled={loadingInteractions || interactions.length === 0}
                        >
                          {interactions.map((interaction) => (
                            <MenuItem key={interaction.interactionId} value={interaction.interactionId}>
                              {formatInteractionType(interaction.interactionType)} - {formatDate(interaction.interactionDate)}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {errors.interactionId?.message || 
                           (interactions.length === 0 && !loadingInteractions ? 'No interactions available. Create an interaction first.' : '')}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

            {/* Required Fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Make"
                {...register('make', {
                  required: 'Make is required',
                })}
                error={!!errors.make}
                helperText={errors.make?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                {...register('model', {
                  required: 'Model is required',
                })}
                error={!!errors.model}
                helperText={errors.model?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                {...register('year', {
                  required: 'Year is required',
                  valueAsNumber: true,
                  min: {
                    value: 1900,
                    message: 'Year must be 1900 or later',
                  },
                  max: {
                    value: new Date().getFullYear() + 2,
                    message: 'Year cannot be more than 2 years in the future',
                  },
                })}
                error={!!errors.year}
                helperText={errors.year?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('purchaseDate', {
                  required: 'Purchase date is required',
                })}
                error={!!errors.purchaseDate}
                helperText={errors.purchaseDate?.message}
              />
            </Grid>

            {/* Optional Fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VIN (Optional)"
                {...register('vin')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sale Price (Optional)"
                type="number"
                InputProps={{ startAdornment: '$' }}
                {...register('salePrice', {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: 'Sale price must be positive',
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
                {...register('color')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mileage (Optional)"
                type="number"
                {...register('mileage', {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: 'Mileage must be positive',
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
                {...register('notes')}
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
                    {isEditMode ? 'Cancel' : 'Exit'}
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting || (isEditMode && !isDirty)}
                >
                  {submitting 
                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                    : (isEditMode ? 'Update' : 'Create')}
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

export default VehicleForm;
