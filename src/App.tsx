
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import { Toaster } from "./components/ui/toaster";
import { initDocumentProcessors } from "./lib/documentProcessors";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const App = () => {
  useEffect(() => {
    // Initialize document processing libraries
    initDocumentProcessors();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes example */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                {/* Admin dashboard would go here */}
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            } 
          />
          
          {/* Default 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
};

export default App;
