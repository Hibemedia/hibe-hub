import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin-Client Management System
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            Comprehensive platform for managing clients, videos, and analytics
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Admin Dashboard</h3>
              <p className="text-gray-300 mb-4">Manage clients, upload videos, and provide feedback</p>
              <p className="text-sm text-gray-400">For administrators only</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Client Portal</h3>
              <p className="text-gray-300 mb-4">View analytics, videos, and feedback</p>
              <p className="text-sm text-gray-400">For clients only</p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/admin">Admin Dashboard</Link>
            </Button>
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link to="/client">Client Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
