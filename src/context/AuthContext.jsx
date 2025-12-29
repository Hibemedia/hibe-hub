import { useState, createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jwtDecode } from "jwt-decode"; // Vite-friendly import

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true); 

  // Decode user info from JWT
  const decodeUserFromToken = (access_token) => {
    if (!access_token) return null;
    try {
      const decoded = jwtDecode(access_token);
      return {
        id: decoded.sub,
        email: decoded.email || null,
        role: decoded.role || null,
        username: decoded.username || null,
        ...decoded.user_metadata, // include extra fields from JWT
      };
    } catch (err) {
      console.error("JWT decode error:", err);
      return null;
    }
  };

  // Helper to set session and fetch full user info
  const setSessionAndUser = async (supabaseSession) => {
    setSession(supabaseSession);

    if (supabaseSession?.access_token) {
      const decodedUser = decodeUserFromToken(supabaseSession.access_token);
      // Fetch full user info from 'users' table
      const { data: userInfo, error: errors } = await supabase
        .from("users")
        .select("*")
        .eq("id", decodedUser.id)
        .single();

      if (errors) {
        console.error("Error fetching user info:", errors);
        setUser(decodedUser); // fallback to decoded JWT if DB fetch fails
      } else {
        setUser(userInfo); // full user row from DB
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionAndUser(session);
      console.log(session);
    });

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessionAndUser(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Sign in function
  const signInUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, response: error };

    await setSessionAndUser(data.session);

    return { success: true, session: data.session };
  };

  // Optional sign out
  const signOutUser = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signInUser, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
