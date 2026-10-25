
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { supabase } from "../services/supabase";
import { apiRequest } from "../services/api";

const money = (value) =>
  Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function Cart() {
  const {
    items,
    total,
    itemCount,
    setQuantity,
    remove,
    clear,
  } = useCart();

  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  async function checkout() {
    if (busy) return;

    setMessage("");
    setOrderId(null);

    if (items.length === 0) {
      setMessage("Tu carrito está vacío.");
      return;
    }

    if (!address.trim()) {
      setMessage("Ingresa la dirección de entrega.");
      return;
    }

    if (address.trim().length < 5) {
      setMessage("Ingresa una dirección de entrega válida.");
      return;
    }

    if (address.trim().length > 250) {
      setMessage("La dirección no puede superar los 250 caracteres.");
      return;
    }

    if (!supabase) {
      setMessage(
        "Supabase no está configurado correctamente."
      );
      return;
    }

    const invalidItem = items.find((item) => {
      const quantity = Number(item.quantity);
      const stock = Number(item.variant?.stock);

      return (
        !item.product?.id ||
        !item.variant?.id ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(stock) ||
        stock < 1 ||
        quantity > stock
      );
    });

    if (invalidItem) {
      setMessage(
        `Revisa la cantidad y las existencias de ${
          invalidItem.product?.name || "uno de los productos"
        }.`
      );
      return;
    }

    setBusy(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setMessage(
          "Inicia sesión para completar tu compra."
        );
        navigate("/cuenta");
        return;
      }

      const result = await apiRequest("/api/orders", {
        method: "POST",
        token: session.access_token,
        body: JSON.stringify({
          address: address.trim(),
          items: items.map((item) => ({
            variant_id: item.variant.id,
            quantity: Number(item.quantity),
          })),
        }),
      });

      const createdOrderId = result.id ?? result.orderId ?? null;

      setOrderId(createdOrderId);
      setMessage(
        createdOrderId
          ? `¡Tu pedido #${createdOrderId} se creó correctamente!`
          : "¡Tu pedido se creó correctamente!"
      );

      clear();
      setAddress("");
    } catch (error) {
      setMessage(
        error.message ||
          "No fue posible crear el pedido. Intenta nuevamente."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section page-content">
      <span className="eyebrow">ZAPO · TU COMPRA</span>
      <h1>Tu carrito</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>
            {orderId
              ? "Tu compra está registrada."
              : "Tu carrito está vacío."}
          </p>

          <Link
            className="button button-dark"
            to="/catalogo"
          >
            Explorar el catálogo
          </Link>

          {orderId && (
            <p>
              <Link to="/pedidos">
                Consultar mis pedidos
              </Link>
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-row" key={item.key}>
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                  />
                ) : (
                  <div className="image-placeholder">
                    ZAPO
                  </div>
                )}

                <div className="cart-item-copy">
                  <h2>{item.product.name}</h2>

                  <p>
                    Talla: {item.variant.size} · Color:{" "}
                    {item.variant.color}
                  </p>

                  <p>
                    Existencias disponibles:{" "}
                    {item.variant.stock}
                  </p>

                  <p>Precio unitario: {money(item.product.price)}</p>

                  <strong>
                    Subtotal:{" "}
                    {money(
                      Number(item.product.price) *
                        item.quantity
                    )}
                  </strong>
                </div>

                <label>
                  Cantidad
                  <input
                    aria-label={`Cantidad de ${item.product.name}`}
                    type="number"
                    min="1"
                    max={Number(item.variant.stock)}
                    step="1"
                    value={item.quantity}
                    disabled={busy}
                    onChange={(event) => {
                      const value = event.target.value;

                      if (value === "") return;

                      setQuantity(item.key, Number(value));
                    }}
                  />
                </label>

                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => remove(item.key)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <section className="checkout">
            <h2>Resumen de compra</h2>

            <p>
              Unidades en el carrito:{" "}
              {itemCount ?? items.reduce(
                (sum, item) => sum + item.quantity,
                0
              )}
            </p>

            <label>
              Dirección de entrega
              <input
                type="text"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Ej. Calle 10 #20-30, apartamento 201"
                maxLength={250}
                autoComplete="street-address"
                disabled={busy}
                required
              />
            </label>

            <h2>Total: {money(total)}</h2>

            <button
              type="button"
              className="button button-dark"
              disabled={busy || items.length === 0}
              onClick={checkout}
            >
              {busy
                ? "Procesando pedido..."
                : "Confirmar pedido"}
            </button>
          </section>
        </>
      )}

      {message && (
        <div
          className="notice"
          role="status"
          aria-live="polite"
        >
          <p>{message}</p>

          {orderId && (
            <Link to="/pedidos">
              Consultar mis pedidos
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
