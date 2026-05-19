import { Navigate } from "react-router-dom";
import { getAuth } from "@/services/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { token, user } = getAuth();

  if (!token || !user) return <Navigate to="/login" replace />;
  // Allow access if user is admin OR super_admin
  if (adminOnly && !(user.is_admin || user.is_super_admin)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
