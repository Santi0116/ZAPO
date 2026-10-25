
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) throw error;

        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Error cargando la sesión:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function register({ name, email, password }) {
    if (!supabase) {
      throw new Error("Supabase no está configurado.");
    }

    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      throw new Error("Completa todos los campos.");
    }

    if (password.length < 8) {
      throw new Error(
        "La contraseña debe tener al menos 8 caracteres."
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) throw error;

    return {
      user: data.user,
      session: data.session,
      requiresEmailConfirmation: Boolean(
        data.user && !data.session
      ),
    };
  }

  async function login({ email, password }) {
    if (!supabase) {
      throw new Error("Supabase no está configurado.");
    }

    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error("Ingresa tu correo y contraseña.");
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (error) throw error;

    return data;
  }

  async function logout() {
    if (!supabase) {
      throw new Error("Supabase no está configurado.");
    }

    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: Boolean(session),
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider"
    );
  }

  return context;
}
