import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import CustomersList from "./pages/customers/CustomersList";
import CustomerDetail from "./pages/customers/CustomerDetail";
import TemplatesList from "./pages/templates/TemplatesList";
import FollowUpsList from "./pages/followups/FollowUpsList";
import UserSettings from "./pages/settings/UserSettings";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import CustomerForm from "./pages/customers/CustomerForm";

// Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Customer routes */}
              <Route path="/customers/new" element={<CustomerForm />} />
              <Route path="/customers" element={<CustomersList />} />
              <Route
                path="/customers/:customerId"
                element={<CustomerDetail />}
              />

              {/* Template routes */}
              <Route path="/templates" element={<TemplatesList />} />

              {/* Follow-up routes */}
              <Route path="/followups" element={<FollowUpsList />} />

              {/* Settings routes */}
              <Route path="/settings" element={<UserSettings />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
