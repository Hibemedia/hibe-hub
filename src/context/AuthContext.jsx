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
      setUser(decodedUser);
    } else {
      setUser(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionAndUser(session);
    });

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessionAndUser(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // check if admin
 const isAdmin = async () => {
  if (user == null){return;}
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !!data;
};

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

  // delete User
  const deleteUser = async (user_id) =>{
    let admin = await isAdmin();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !admin) {
      throw new Error("Not authenticated");
    }
    const { data, error } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deleteUser`, {
      method: 'POST',
      headers:
      {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: user_id })
    });
    if (error) return { success: false, response: error };
    return { success: true };

  }
  // add User
  const insertUser = async (email, brandid) => {
    let admin = await isAdmin();
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !admin) {
      throw new Error("Not authenticated");
    }
    const { data, error } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inviteUser`, {
      method: 'POST',
      headers:
      {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, brandid: brandid })
    });
    if (error) return { success: false, response: error };
    return { success: true };
  };

  // Optional sign out
  const signOutUser = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signInUser, signOutUser, insertUser, deleteUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
