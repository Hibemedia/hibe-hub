import { useState, createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext();


export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user,setUser] = useState(null);
    useEffect(()=>{
        supabase.auth.getSession().then(({data:{session}})=>{
            setSession(session);
        })
        supabase.auth.onAuthStateChange((_event, session)=>{
            setSession(session);
        });
    })
    
    const signInUser = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });


        if (error) {
            return { success: false, response: error };
        }
        setSession(data.session);
    
        // console.log(data.session.user.id);
        const {data: userInfo, error: errors } = supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id);
        setUser(userInfo)
        return { success: true, session: session };
    }
    
    return (
        <AuthContext.Provider value={{ children, signInUser, session, user }}>
            {children}
        </AuthContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(AuthContext);
}
