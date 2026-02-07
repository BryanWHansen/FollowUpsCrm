import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Card,
} from "@mui/material";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary, {
  accordionSummaryClasses,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { templateAPI } from "../../api/endpoints";
import TemplateFormModal from "../../components/modals/TemplateFormModal";
import {
  formatInteractionType,
  getInteractionTypeColor,
} from "../../utils/interactionTypes";

const INTERACTION_TYPES = [
  { value: "", label: "All Types" },
  { value: "purchase", label: "Purchase" },
  { value: "interest", label: "Interest" },
  { value: "test_drive", label: "Test Drive" },
  { value: "general_inquiry", label: "General Inquiry" },
];

// Styled Accordion Components
const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: "transparent",
  flexDirection: "row-reverse",
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
    {
      transform: "rotate(90deg)",
    },
  [`& .${accordionSummaryClasses.content}`]: {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
  backgroundColor: "rgba(0, 0, 0, .03)",
  ...theme.applyStyles("dark", {
    backgroundColor: "rgba(255, 255, 255, .05)",
  }),
}));

const TemplatesList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [interactionTypeFilter, setInteractionTypeFilter] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateAPI.getAll();
      setTemplates(response.data);
      setError("");
    } catch (err) {
      setError("Failed to load templates");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (templateId) => {
    setEditTemplateId(templateId);
    setTemplateModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditTemplateId(null);
    setTemplateModalOpen(true);
  };

  const handleCloseModal = () => {
    setTemplateModalOpen(false);
    setEditTemplateId(null);
  };

  const handleTemplateSuccess = () => {
    fetchTemplates();
  };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      setDeleting(true);
      await templateAPI.delete(templateToDelete.templateId);

      // Remove template from list
      setTemplates(
        templates.filter((t) => t.templateId !== templateToDelete.templateId),
      );
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      setError("");
    } catch (err) {
      setError("Failed to delete template");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleAccordionChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  // Filter templates based on search term and interaction type
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.templateName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      !interactionTypeFilter ||
      template.interactionType === interactionTypeFilter;
    return matchesSearch && matchesType;
  });

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Follow-Up Templates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
        >
          Create Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search by Template Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Interaction Type</InputLabel>
              <Select
                value={interactionTypeFilter}
                onChange={(e) => setInteractionTypeFilter(e.target.value)}
                label="Interaction Type"
              >
                {INTERACTION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        {filteredTemplates.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {templates.length === 0
                ? "No templates found. Create your first template to get started."
                : "No templates match your filters."}
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Header Row */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "3fr 2fr 2fr 3fr 1fr 1fr",
                },
                gap: 2,
                p: 2,
                backgroundColor: "grey.100",
                borderBottom: 1,
                borderColor: "divider",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Template Name
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Type
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Days After
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Subject
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Status
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ textAlign: "right" }}
              >
                Actions
              </Typography>
            </Box>

            {filteredTemplates.map((template) => (
              <Accordion
                key={template.templateId}
                expanded={expanded === `template-${template.templateId}`}
                onChange={handleAccordionChange(
                  `template-${template.templateId}`,
                )}
              >
                <AccordionSummary
                  aria-controls={`template-${template.templateId}-content`}
                  id={`template-${template.templateId}-header`}
                >
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    sx={{ pr: 2 }}
                  >
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body1" fontWeight="medium">
                        {template.templateName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Chip
                        label={formatInteractionType(template.interactionType)}
                        color={getInteractionTypeColor(
                          template.interactionType,
                        )}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        {template.daysAfter}{" "}
                        {template.daysAfter === 1 ? "day" : "days"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {template.messageSubject ? (
                        <Typography
                          variant="body2"
                          noWrap
                          color="text.secondary"
                        >
                          {template.messageSubject}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6} sm={1}>
                      <Chip
                        label={template.isActive ? "Active" : "Inactive"}
                        color={template.isActive ? "success" : "default"}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={1} sx={{ textAlign: "right" }}>
                      <Box
                        sx={{ whiteSpace: "nowrap" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          color="primary"
                          onClick={() => handleEditClick(template.templateId)}
                          size="small"
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(template)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    fontWeight="medium"
                  >
                    Message Body:
                  </Typography>
                  <Card sx={{ backgroundColor: "white" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        p: 2,
                      }}
                    >
                      {template.messageBody}
                    </Typography>
                  </Card>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the template "
            {templateToDelete?.templateName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Form Modal */}
      <TemplateFormModal
        open={templateModalOpen}
        onClose={handleCloseModal}
        templateId={editTemplateId}
        onSuccess={handleTemplateSuccess}
      />
    </Box>
  );
};

export default TemplatesList;
