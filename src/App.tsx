
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
    
    // We've removed the commented out loadScript call since it wasn't being used
    // and could trigger the preload warning
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
