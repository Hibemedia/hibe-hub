import { Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "@/context/AuthContext.jsx";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user , loading} = UserAuth();
  const loc = useLocation();
  if (loading) return <div>Loading...</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  }

  return children;
};

export default ProtectedRoute;
