import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "@/context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
    const { session } = UserAuth();
    // const navigate = useNavigate();
    
    // useEffect(()=>{
        
    // if (!user) {
    //     return navigate('/');
    // }   
    console.log(session);
    return <>{children}</>;
    // })
    
 }

export default ProtectedRoute;