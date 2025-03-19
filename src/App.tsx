
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";
import { initDocumentProcessors } from "./lib/documentProcessors";
import { loadScript } from "./utils/resourceLoader";

const App = () => {
  useEffect(() => {
    // Initialize document processing libraries
    initDocumentProcessors();
    
    // Load any additional scripts only when needed
    // Example of proper script loading (commented out until needed)
    // loadScript('https://cdn.example.com/some-script.js')
    //   .catch(error => console.error('Failed to load script:', error));
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
};

export default App;
