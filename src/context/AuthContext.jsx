import { useState, createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext();


export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    
    useEffect(()=>{
        supabase.auth.getSession().then(({data:{session}})=>{
            setSession(session);
        })
        supabase.auth.onAuthStateChange((_event, session)=>{
            setSession(session);
        });
    })
    
    const signInUser = async (email, password) => {
        const { session, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });


        if (error) {
            console.log(error);
            return { success: false, response: error };
        }
        setSession(session);
        return { success: true, session: session };
    }
    
    return (
        <AuthContext.Provider value={{ children, signInUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(AuthContext);
}
