
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { apiRequest } from "../services/api";

const labels = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const money = (value) =>
  Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const dateTime = (value) => {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    setMessage("");

    try {
      if (!supabase) {
        throw new Error(
          "Supabase no está configurado correctamente."
        );
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        setToken("");
        setOrders([]);
        throw new Error(
          "Inicia sesión con una cuenta de repartidor."
        );
      }

      setToken(session.access_token);

      const result = await apiRequest("/api/delivery/orders", {
        token: session.access_token,
      });

      if (!Array.isArray(result)) {
        throw new Error(
          "El servidor devolvió una lista de pedidos no válida."
        );
      }

      setOrders(result);
    } catch (error) {
      setMessage(
        error.message || "No fue posible cargar las entregas."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

  }, [load]);

  async function update(order, status) {
    if (busyOrderId !== null) return;

    setMessage("");
    setBusyOrderId(order.id);

    try {
      const result = await apiRequest(
        `/api/delivery/orders/${order.id}/status`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ status }),
        }
      );

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, ...result }
            : item
        )
      );

      setMessage(
        `El pedido #${order.id} se actualizó a "${
          labels[status] || status
        }".`
      );
    } catch (error) {
      setMessage(
        error.message ||
          "No se pudo actualizar el pedido."
      );

      // Recargar por si el estado cambió en el servidor.
      await load(false);
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <main className="section page-content">
      <span className="eyebrow">ZAPO · LOGÍSTICA</span>
      <h1>Mis entregas</h1>

      <button
        type="button"
        className="button button-outline"
        disabled={loading || busyOrderId !== null}
        onClick={() => load()}
      >
        Actualizar lista
      </button>

      {message && (
        <div className="notice" role="status" aria-live="polite">
          <p>{message}</p>
        </div>
      )}

      {loading && (
        <p role="status">Cargando tus entregas...</p>
      )}

      {!loading && orders.length === 0 && !message && (
        <p>No tienes pedidos asignados actualmente.</p>
      )}

      {!loading && orders.length === 0 && message && (
        <p>Comprueba tu sesión o vuelve a cargar la lista.</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => {
            const orderItems = Array.isArray(order.order_items)
              ? order.order_items
              : [];

            const isBusy = busyOrderId === order.id;

            return (
              <article
                className="order-card"
                key={order.id}
              >
                <div className="order-heading">
                  <h2>Pedido #{order.id}</h2>

                  <span
                    className={`status status-${order.status}`}
                  >
                    {labels[order.status] || order.status}
                  </span>
                </div>

                <p>
                  <strong>Fecha:</strong>{" "}
                  {dateTime(order.created_at)}
                </p>

                <p>
                  <strong>Dirección:</strong>{" "}
                  {order.delivery_address || "Sin dirección registrada"}
                </p>

                <div className="order-products">
                  <h3>Productos</h3>

                  {orderItems.length > 0 ? (
                    orderItems.map((item) => {
                      const variant = item.product_variants;

                      const productName =
                        variant?.products?.name || "Producto";

                      return (
                        <p key={item.id}>
                          {item.quantity} × {productName}
                          {variant?.size
                            ? ` · Talla ${variant.size}`
                            : ""}
                          {variant?.color
                            ? ` · Color ${variant.color}`
                            : ""}
                        </p>
                      );
                    })
                  ) : (
                    <p>Sin detalles de productos disponibles.</p>
                  )}
                </div>

                <p>
                  <strong>Total del pedido:</strong>{" "}
                  {money(order.total)}
                </p>

                {order.status !== "delivered" &&
                  order.status !== "cancelled" && (
                    <div className="button-row">
                      {order.status !== "on_the_way" && (
                        <button
                          type="button"
                          className="button button-dark"
                          disabled={busyOrderId !== null}
                          onClick={() =>
                            update(order, "on_the_way")
                          }
                        >
                          {isBusy
                            ? "Actualizando..."
                            : "Marcar en camino"}
                        </button>
                      )}

                      {order.status === "on_the_way" && (
                        <button
                          type="button"
                          className="button button-dark"
                          disabled={busyOrderId !== null}
                          onClick={() =>
                            update(order, "delivered")
                          }
                        >
                          {isBusy
                            ? "Actualizando..."
                            : "Marcar entregado"}
                        </button>
                      )}
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
