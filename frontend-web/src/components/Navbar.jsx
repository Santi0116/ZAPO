
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  MapPin,
  UserRound,
  LogOut,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "../styles/Navbar.css";

export default function Navbar() {
  const { items } = useCart();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");

  const cantidadProductos = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    let activo = true;

    async function cargarNombre() {
      if (!user || !supabase) {
        setNombre("");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!activo) return;

      if (!error && data?.full_name?.trim()) {
        setNombre(data.full_name.trim());
      } else {
        setNombre("");
      }
    }

    cargarNombre();

    return () => {
      activo = false;
    };
  }, [user]);

  async function handleLogout() {
    setError("");

    try {
      await logout();
      setNombre("");
      navigate("/cuenta");
    } catch (err) {
      setError(err.message || "No se pudo cerrar la sesión.");
    }
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <img
          src="https://vcdhkxcwyohbjweaqatw.supabase.co/storage/v1/object/public/CATALOGO/Logos/sapo%20logo%20definitivo.png"
          alt="Logo de ZAPO"
          className="site-logo"
        />
      </Link>

      <nav>
        <NavLink to="/catalogo">Catálogo</NavLink>
        <NavLink to="/tienda">
          <MapPin size={16} />
          Nuestra tienda
        </NavLink>
        <NavLink to="/pedidos">Mis pedidos</NavLink>
      </nav>

      <div className="nav-actions">
        {!loading && user ? (
          <>
            <Link
              className="nav-user"
              to="/cuenta"
              title="Mi cuenta"
              aria-label="Mi cuenta"
            >
              <UserRound size={19} />
              <span>{nombre || "Mi cuenta"}</span>
            </Link>

            <button
              type="button"
              className="nav-logout"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={19} />
            </button>
          </>
        ) : (
          !loading && (
            <Link
              aria-label="Mi cuenta"
              title="Mi cuenta"
              to="/cuenta"
            >
              <UserRound size={19} />
            </Link>
          )
        )}

        <Link
          aria-label={`Carrito con ${cantidadProductos} productos`}
          title="Carrito"
          to="/carrito"
          className="cart-link"
        >
          <ShoppingBag size={19} />
          <span>{cantidadProductos}</span>
        </Link>
      </div>

      {error && (
        <p className="navbar-error" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
