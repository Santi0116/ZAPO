
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      if (mode === "register") {
        const result = await register({ name, email, password });

        if (result.requiresEmailConfirmation) {
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

      if (
        errorMessage.toLowerCase().includes("already registered") ||
        errorMessage.toLowerCase().includes("already exists")
      ) {
        setMessage(
          "Este correo ya está registrado. Intenta iniciar sesión."
        );
      } else if (
        errorMessage.toLowerCase().includes("invalid login credentials")
      ) {
        setMessage("Correo o contraseña incorrectos.");
      } else if (
        errorMessage.toLowerCase().includes("password should be at least")
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

        <button
          className="button button-dark"
          onClick={() => navigate("/catalogo")}
        >
          Ir al catálogo
        </button>

        <button className="text-button" onClick={handleLogout}>
          Cerrar sesión
        </button>

        {message && <p className="notice" role="status">{message}</p>}
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

        <button className="button button-dark" type="submit" disabled={busy}>
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
