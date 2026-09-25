import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function ProtectedRoute({ children }) {
  const {
    accessToken,
    loading,
  } = useAuth();


  if (loading) {
    return (
      <div className="loading-screen">
        Loading...
      </div>
    );
  }


  if (!accessToken) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return children;
}


export default ProtectedRoute;