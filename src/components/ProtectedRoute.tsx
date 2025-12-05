import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    useEffect(() =>{
        console.log('test');
        const session = supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user || null);
            setLoading(false);
        });
        
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });
        return () => {
            listener.subscription.unsubscribe();
        };
    })
    if (!user) {
        console.log('test');
        return <Navigate to="/" replace />;
    }   
    return children;
    
 }

export default ProtectedRoute;