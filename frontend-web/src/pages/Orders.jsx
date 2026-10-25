import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { apiRequest } from "../services/api";
import "../styles/Orders.css";

const STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const PROGRESS_STEPS = [
  { status: "pending", label: "Pedido recibido" },
  { status: "confirmed", label: "Pedido confirmado" },
  { status: "preparing", label: "Preparando pedido" },
  { status: "on_the_way", label: "En camino" },
  { status: "delivered", label: "Entregado" },
];

function money(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getProductName(item) {
  return (
    item.product_variants?.products?.name ||
    item.product_variants?.product?.name ||
    item.product_name ||
    "Producto"
  );
}

function getVariantDetails(item) {
  const variant = item.product_variants;

  if (!variant) return "";

  return [variant.size, variant.color].filter(Boolean).join(" · ");
}

function getProgressIndex(status) {
  return PROGRESS_STEPS.findIndex((step) => step.status === status);
}

function OrderProgress({ status }) {
  if (status === "cancelled") {
    return (
      <div className="order-cancelled">
        <span className="order-cancelled-icon">!</span>
        <div>
          <strong>Pedido cancelado</strong>
          <p>Este pedido ya no continuará con el proceso de entrega.</p>
        </div>
      </div>
    );
  }

  const currentIndex = getProgressIndex(status);

  return (
    <div className="order-progress">
      {PROGRESS_STEPS.map((step, index) => {
        const completed = currentIndex >= 0 && index < currentIndex;
        const current = index === currentIndex;
        const future = currentIndex < 0 || index > currentIndex;

        return (
          <div
            className={[
              "order-progress-step",
              completed ? "is-completed" : "",
              current ? "is-current" : "",
              future ? "is-future" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={step.status}
          >
            <div className="order-progress-marker">
              {completed ? "✓" : index + 1}
            </div>

            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const status = order.status || "pending";

  return (
    <article className="order-card">
      <header className="order-card-header">
        <div>
          <span className="order-overline">Número de pedido</span>
          <h2>#{order.id}</h2>
          <p className="order-date">{formatDate(order.created_at)}</p>
        </div>

        <span className={`order-status status-${status}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </header>

      <section className="order-tracking-section">
        <h3>Seguimiento de tu pedido</h3>
        <OrderProgress status={status} />
      </section>

      <section className="order-information">
        <div className="order-information-block">
          <span className="order-label">Dirección de entrega</span>
          <p>{order.delivery_address || "No hay dirección registrada."}</p>
        </div>

        <div className="order-information-block">
          <span className="order-label">Repartidor</span>

          {order.delivery_person ? (
            <>
              <p>{order.delivery_person.full_name || "Repartidor asignado"}</p>
              {order.delivery_person.phone && (
                <p className="order-secondary">
                  Teléfono: {order.delivery_person.phone}
                </p>
              )}
            </>
          ) : (
            <p className="order-secondary">
              Todavía no se ha asignado un repartidor.
            </p>
          )}
        </div>
      </section>

      <section className="order-products">
        <h3>Productos comprados</h3>

        {items.length === 0 ? (
          <p className="order-secondary">
            No hay detalles de productos disponibles para este pedido.
          </p>
        ) : (
          <div className="order-product-list">
            {items.map((item) => (
              <div className="order-product-row" key={item.id}>
                <div className="order-product-symbol">Z</div>

                <div className="order-product-description">
                  <strong>{getProductName(item)}</strong>

                  {getVariantDetails(item) && (
                    <span>{getVariantDetails(item)}</span>
                  )}

                  <span>Cantidad: {item.quantity}</span>
                </div>

                <strong className="order-product-price">
                  {money(Number(item.unit_price || 0) * Number(item.quantity || 0))}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="order-card-footer">
        <span>Total del pedido</span>
        <strong>{money(order.total)}</strong>
      </footer>
    </article>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    setLoggedOut(false);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        setOrders([]);
        setLoggedOut(true);
        return;
      }

      const data = await apiRequest("/api/orders/mine", {
        token: session.access_token,
      });

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar tus pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  
useEffect(() => {
  let channel = null;
  let cancelled = false;

  async function subscribeToOrders() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (cancelled || !session?.user?.id) return;

      const customerId = session.user.id;

      channel = supabase
        .channel(`orders-customer-${customerId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `customer_id=eq.${customerId}`,
          },
          () => {
            if (!cancelled) {
              loadOrders();
            }
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error(
              "No se pudo establecer la conexión en tiempo real de pedidos."
            );
          }
        });
    } catch (err) {
      console.error(
        "Error al configurar las actualizaciones de pedidos:",
        err
      );
    }
  }

  subscribeToOrders();

  return () => {
    cancelled = true;

    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, [loadOrders]);


  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-heading">
          <p className="orders-eyebrow">ZAPO · Mi cuenta</p>
          <h1>Mis pedidos</h1>
        </div>

        <div className="orders-message">Cargando tus pedidos...</div>
      </main>
    );
  }

  if (loggedOut) {
    return (
      <main className="orders-page">
        <div className="orders-heading">
          <p className="orders-eyebrow">ZAPO · Mi cuenta</p>
          <h1>Mis pedidos</h1>
        </div>

        <div className="orders-empty">
          <h2>Inicia sesión para continuar</h2>
          <p>
            Inicia sesión con la cuenta que utilizaste para realizar tu compra
            y podrás consultar tus pedidos.
          </p>
          <Link className="orders-button" to="/cuenta">
            Ir a mi cuenta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <header className="orders-heading">
        <div>
          <p className="orders-eyebrow">ZAPO · Mi cuenta</p>
          <h1>Mis pedidos</h1>
          <p>
            Consulta tus compras y revisa en qué etapa se encuentra cada
            entrega.
          </p>
        </div>

        <button
          className="orders-refresh"
          type="button"
          onClick={loadOrders}
          disabled={loading}
        >
          Actualizar pedidos
        </button>
      </header>

      {error && (
        <div className="orders-error" role="alert">
          <strong>No pudimos cargar tus pedidos.</strong>
          <p>{error}</p>
          <button type="button" onClick={loadOrders}>
            Intentar de nuevo
          </button>
        </div>
      )}

      {!error && orders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-symbol"><img
          src="https://vcdhkxcwyohbjweaqatw.supabase.co/storage/v1/object/public/CATALOGO/Logos/sapo%20logo%20definitivo.png"
          alt="Logo de ZAPO"
          className="site-logo"
        /></div>
          <h2>Aún no tienes pedidos</h2>
          <p>
            Cuando realices una compra, podrás consultar aquí el estado de tu
            pedido y sus detalles.
          </p>
          <Link className="orders-button" to="/">
            Explorar la tienda
          </Link>
        </div>
      ) : (
        <section className="orders-list" aria-label="Historial de pedidos">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      )}
    </main>
  );
}
