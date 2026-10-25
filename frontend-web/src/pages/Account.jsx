import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

export default function Account() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, register, login, logout } =
    useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!user?.id || !supabase) {
        setRole(null);
        return;
      }

      setLoadingRole(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (active) {
          setRole(data?.role?.trim().toLowerCase() ?? null);
        }
      } catch (error) {
        console.error("No se pudo consultar el rol:", error);

        if (active) {
          setRole(null);
        }
      } finally {
        if (active) {
          setLoadingRole(false);
        }
      }
    }

    loadRole();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      if (mode === "register") {
        const result = await register({ name, email, password });

        if (result?.requiresEmailConfirmation) {
          setMessage(
            "Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión."
          );
          setMode("login");
          setPassword("");
          return;
        }

        setMessage("¡Registro exitoso! Tu cuenta está activa.");
      } else {
        await login({ email, password });
        setMessage("¡Inicio de sesión exitoso!");
      }

      window.setTimeout(() => {
        navigate("/catalogo");
      }, 1000);
    } catch (error) {
      const errorMessage = error?.message || "";
      const lowerMessage = errorMessage.toLowerCase();

      if (
        lowerMessage.includes("already registered") ||
        lowerMessage.includes("already exists")
      ) {
        setMessage("Este correo ya está registrado. Intenta iniciar sesión.");
      } else if (lowerMessage.includes("invalid login credentials")) {
        setMessage("Correo o contraseña incorrectos.");
      } else if (
        lowerMessage.includes("password should be at least")
      ) {
        setMessage("La contraseña no cumple los requisitos mínimos.");
      } else {
        setMessage(errorMessage || "No fue posible completar la operación.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setMessage("");

    try {
      await logout();
      setRole(null);
      setMessage("Sesión cerrada correctamente.");
    } catch (error) {
      setMessage(error?.message || "No se pudo cerrar la sesión.");
    }
  }

  if (loading) {
    return (
      <main className="section page-content auth-wrap">
        <p>Comprobando tu sesión...</p>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <main className="section page-content auth-wrap">
        <span className="eyebrow">TU CUENTA ZAPO</span>
        <h1>Mi cuenta</h1>

        <p>Has iniciado sesión correctamente.</p>

        <p>
          <strong>Correo:</strong> {user?.email}
        </p>

        <p>
          <strong>Nombre:</strong>{" "}
          {user?.user_metadata?.full_name || "No especificado"}
        </p>

        {loadingRole ? (
          <p>Verificando permisos de tu cuenta...</p>
        ) : role === "admin" ? (
          <button
            className="button button-dark"
            type="button"
            onClick={() => navigate("/admin")}
          >
            Ir al Dashboard del administrador
          </button>
        ) : null}

        <button
          className="button button-dark"
          type="button"
          onClick={() => navigate("/catalogo")}
        >
          Ir al catálogo
        </button>

        <button
          className="text-button"
          type="button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>

        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="section page-content auth-wrap">
      <span className="eyebrow">TU CUENTA ZAPO</span>

      <h1>
        {mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
      </h1>

      <form className="auth-form" onSubmit={submit}>
        {mode === "register" && (
          <label>
            Nombre completo
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}

        <label>
          Correo electrónico
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button
          className="button button-dark"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Procesando..."
            : mode === "login"
              ? "Iniciar sesión"
              : "Registrarme"}
        </button>
      </form>

      <button
        className="text-button"
        type="button"
        disabled={busy}
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setMessage("");
          setPassword("");
        }}
      >
        {mode === "login"
          ? "¿No tienes cuenta? Regístrate"
          : "Ya tengo cuenta. Iniciar sesión"}
      </button>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </main>
  );
}