import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "@/context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
    const { session } = UserAuth();
    const navigate = useNavigate();

        
    if (!session) {
        return navigate('/');
    }   
    return <>{children}</>;    
 }

export default ProtectedRoute;