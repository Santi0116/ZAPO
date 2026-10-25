import { useState } from "react";
import { supabase } from "../services/supabase";
import { useEffect } from "react";

export default function Account(){
  const [mode,setMode]=useState("login");const [name,setName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
  

async function submit(e) {
  e.preventDefault();
  setMessage("");

  if (!supabase) {
    setMessage("Error: Supabase no está configurado.");
    return;
  }

  setBusy(true);

  try {
    const result =
      mode === "register"
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { full_name: name.trim() },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

    if (result.error) {
      throw result.error;
    }

    // Verificar si Supabase tiene una sesión activa.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session) {
      setMessage(
        mode === "register"
          ? "Cuenta creada, pero no hay una sesión activa. Revisa la confirmación de correo en Supabase."
          : "Credenciales aceptadas, pero no se encontró una sesión activa."
      );
      return;
    }

    setMessage(
      mode === "register"
        ? "¡Registro exitoso! Tu sesión está iniciada."
        : "¡Inicio de sesión exitoso! Tu sesión está activa."
    );

    // Dar tiempo para que el usuario vea el mensaje.
    window.setTimeout(() => {
      window.location.assign("/catalogo");
    }, 1200);
  } catch (err) {
    setMessage(
      err.message || "No fue posible completar la operación."
    );
  } finally {
    setBusy(false);
  }
}

useEffect(() => {
  if (!supabase) return;

  let mounted = true;

  async function checkSession() {
    const { data, error } = await supabase.auth.getSession();

    if (mounted) {
      console.log(
        "Sesión actual:",
        error ? error.message : data.session?.user?.email ?? "Sin sesión"
      );
    }
  }

  checkSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(
      "Cambio de autenticación:",
      event,
      session?.user?.email ?? "Sin sesión"
    );
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);


  async function logout(){await supabase?.auth.signOut();setMessage("Sesión cerrada.");}
  return <main className="section page-content auth-wrap"><span className="eyebrow">TU CUENTA ZAPO</span><h1>{mode==="login"?"Bienvenido de nuevo":"Crea tu cuenta"}</h1><form className="auth-form" onSubmit={submit}>
    {mode==="register"&&<label>Nombre completo<input required value={name} onChange={e=>setName(e.target.value)}/></label>}
    <label>Correo electrónico<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Contraseña<input type="password" minLength="8" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button className="button button-dark" disabled={busy}>{busy?"Procesando…":mode==="login"?"Iniciar sesión":"Registrarme"}</button>
  </form><button className="text-button" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"¿No tienes cuenta? Regístrate":"Ya tengo cuenta"}</button><button className="text-button" onClick={logout}>Cerrar sesión</button>{message&&<p className="notice">{message}</p>}</main>;
}


