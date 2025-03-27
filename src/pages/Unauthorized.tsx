
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 p-3 rounded-full inline-flex mx-auto mb-4">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
          
          <Button 
            onClick={() => navigate('/')} 
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Unauthorized;
