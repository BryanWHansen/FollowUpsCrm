import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Chip,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const Welcome = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ mt: 4, p: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ mb: 1 }}>
          👋 Welcome to Follow-Ups CRM!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Let's get you started with the essentials. Here's everything you need
          to know to make the most of your CRM.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Templates Section */}
        <Card sx={{ mb: 3, border: "2px solid #1976d2" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <DescriptionIcon sx={{ fontSize: 40, color: "#1976d2", mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Creating Templates with Customizations
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 2 }}>
              Templates are pre-written messages that you can customize for each
              customer using special variables. This saves you time while
              keeping messages personal.
            </Typography>

            <Box
              sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                Available Variables:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Chip label="{customerName}" color="primary" />
                <Chip label="{firstName}" color="primary" />
                <Chip label="{lastName}" color="primary" />
                <Chip label="{vehicleMake}" color="primary" />
                <Chip label="{vehicleModel}" color="primary" />
                <Chip label="{vehicleYear}" color="primary" />
                <Chip label="{interactionType}" color="primary" />
              </Box>

              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: "bold" }}
              >
                Example Template:
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: "white" }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}
                >
                  {`Hi {firstName}, thank you for choosing us for your {vehicleYear} {vehicleMake} {vehicleModel}! We hope you're enjoying your new vehicle. If you have any questions or concerns, please don't hesitate to reach out. Best regards, Your Sales Team`}
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#e3f2fd", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                💡 How to Create a Template:
              </Typography>
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                <li>
                  Go to <strong>Templates</strong> in the sidebar
                </li>
                <li>
                  Click <strong>Add Template</strong>
                </li>
                <li>Give it a name (e.g., "3-Day Check-in")</li>
                <li>Write your message using the variables above</li>
                <li>
                  Set when it should trigger (e.g., 3 days after purchase)
                </li>
                <li>Save your template</li>
              </ol>
            </Box>
          </CardContent>
        </Card>

        {/* Email Preferences Section */}
        <Card sx={{ mb: 3, border: "2px solid #9c27b0" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <EmailIcon sx={{ fontSize: 40, color: "#9c27b0", mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Email Preferences & Daily Digests
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 2 }}>
              Stay on top of your follow-ups with daily email digests delivered
              straight to your inbox at your preferred time.
            </Typography>

            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: "#fff3cd",
                border: "2px solid #ffc107",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", mb: 1, color: "#856404" }}
              >
                ⚠️ Important: Use Your Phone's Email
              </Typography>
              <Typography variant="body2" sx={{ color: "#856404" }}>
                For the best experience with one-touch text message creation,
                make sure to use an email address that is linked to your phone's
                mail app (e.g., Gmail, Outlook, Apple Mail). This allows you to
                open daily digest emails on your mobile device and tap phone
                numbers to quickly send follow-up text messages.
              </Typography>
            </Box>

            <Box
              sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                What's in a Daily Digest?
              </Typography>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                <li>All follow-ups scheduled for that day</li>
                <li>Customer name and phone number</li>
                <li>Pre-filled message text ready to send</li>
                <li>Quick links to contact customers</li>
              </ul>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#f3e5f5", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                ⚙️ How to Change Your Preferences:
              </Typography>
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                <li>Click your avatar in the top right</li>
                <li>
                  Select <strong>Settings</strong>
                </li>
                <li>
                  Go to <strong>Email Notifications</strong> tab
                </li>
                <li>
                  Toggle <strong>Enable Daily Email Digest</strong>
                </li>
                <li>Choose your preferred time (e.g., 8:00 AM)</li>
                <li>Select your timezone</li>
                <li>
                  Click <strong>Save Email Preferences</strong>
                </li>
              </ol>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                You'll receive an email every day at your chosen time if you
                have follow-ups scheduled for that day.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Follow-ups Section */}
        <Card sx={{ mb: 3, border: "2px solid #f57c00" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <NotificationsIcon
                sx={{ fontSize: 40, color: "#f57c00", mr: 2 }}
              />
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Understanding Follow-ups
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 2 }}>
              Follow-ups are automatically created based on your templates and
              customer interactions. Here's how they work:
            </Typography>

            <Box
              sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                When Are Follow-ups Created?
              </Typography>

              <Box sx={{ display: "flex", alignItems: "start", mb: 2 }}>
                <AssignmentIcon sx={{ color: "#f57c00", mr: 1, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    1. After Adding a Customer Interaction
                  </Typography>
                  <Typography variant="body2">
                    When you log an interaction (purchase, test drive, service,
                    etc.), the system checks your templates and automatically
                    creates follow-ups based on the matching criteria.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "start", mb: 2 }}>
                <ScheduleIcon sx={{ color: "#f57c00", mr: 1, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    2. Scheduled Automatically
                  </Typography>
                  <Typography variant="body2">
                    Follow-ups are scheduled based on the number of days you set
                    in your template. For example, if you have a "3-Day
                    Check-in" template, the follow-up will be scheduled for 3
                    days after the interaction date.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "start" }}>
                <EditIcon sx={{ color: "#f57c00", mr: 1, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    3. Personalized with Customer Data
                  </Typography>
                  <Typography variant="body2">
                    The template variables are automatically replaced with
                    actual customer information, so each follow-up message is
                    personalized and ready to send.
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{ p: 2, backgroundColor: "#fff3e0", borderRadius: 2, mb: 2 }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                What to Expect:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                <li>
                  <strong>Daily Email Digest:</strong> Get all today's
                  follow-ups in one email
                </li>
                <li>
                  <strong>Dashboard View:</strong> See upcoming follow-ups on
                  your dashboard calendar
                </li>
                <li>
                  <strong>Status Tracking:</strong> Mark follow-ups as
                  completed, snoozed, or dismissed
                </li>
                <li>
                  <strong>Easy Contact:</strong> Phone numbers and messages
                  ready to use
                </li>
              </ul>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#fff3e0", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                📋 Quick Workflow:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                Add Customer → Log Interaction → System Creates Follow-ups →
                Receive Daily Email → Contact Customers → Mark Complete
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Box sx={{ p: 3, backgroundColor: "#e8f5e9", borderRadius: 2, mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
            🚀 Ready to Get Started?
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Here's the recommended order to set up your CRM:
          </Typography>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            <li>
              <strong>Create Templates:</strong> Set up your common follow-up
              messages
            </li>
            <li>
              <strong>Configure Email Preferences:</strong> Choose when you want
              to receive your daily digest. <br />
              By default daily digests will be sent at 8:00 AM E.S.T. if you
              have follow-ups scheduled for that day.
            </li>
            <li>
              <strong>Add Customers:</strong> Import or add your customer
              contacts
            </li>
            <li>
              <strong>Log Interactions:</strong> Record purchases, test drives,
              or service visits
            </li>
            <li>
              <strong>Manage Follow-ups:</strong> Check your dashboard and email
              for scheduled follow-ups
            </li>
          </ol>
        </Box>

        <Box sx={{ mt: 4, p: 2, backgroundColor: "#fff9c4", borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
            💡 <strong>Tip:</strong> You can access this welcome screen anytime
            by clicking your avatar in the top right and selecting "Welcome".
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Welcome;
