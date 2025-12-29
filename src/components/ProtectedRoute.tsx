import { Navigate } from "react-router-dom";
import { UserAuth } from "@/context/AuthContext.jsx";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user , loading} = UserAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
