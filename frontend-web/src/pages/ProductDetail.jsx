
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useCart } from "../context/CartContext";

const money = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setVariantId("");
      setQuantity(1);

      try {
        const data = await apiRequest(`/api/products/${id}`);

        if (cancelled) return;

        setProduct(data);

        const availableVariant = (data.product_variants || []).find(
          (variant) => Number(variant.stock) > 0
        );

        setVariantId(
          availableVariant ? String(availableVariant.id) : ""
        );
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "No se pudo cargar el producto.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const variants = useMemo(
    () => product?.product_variants || [],
    [product]
  );

  const variant = variants.find(
    (item) => String(item.id) === variantId
  );

  const stock = Math.max(0, Number(variant?.stock || 0));
  const available = Boolean(variant && stock > 0);
  const total = Number(product?.price || 0) * quantity;

  function handleVariantChange(event) {
    setVariantId(event.target.value);
    setQuantity(1);
    setError("");
  }

  function handleAddToCart() {
  if (!variant || Number(variant.stock) < 1) {
    setError("Esta variante no tiene existencias.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    setError("Selecciona una cantidad válida.");
    return;
  }

  if (quantity > Number(variant.stock)) {
    setError(
      `Solo hay ${variant.stock} unidades disponibles.`
    );
    return;
  }

  try {
    add(product, variant, quantity);
    navigate("/carrito");
  } catch (error) {
    setError(error.message || "No se pudo agregar el producto.");
  }
}

  if (loading) {
    return (
      <main className="section page-content">
        <p>Cargando producto...</p>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="section page-content">
        <p className="notice error">{error}</p>
        <Link to="/catalogo">Volver al catálogo</Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="section page-content">
        <h1>Producto no encontrado</h1>
        <Link to="/catalogo">Volver al catálogo</Link>
      </main>
    );
  }

  return (
    <main className="section page-content">
      <p className="eyebrow">{product.category || "ZAPO"}</p>

      <div className="detail-layout">
        <div className="detail-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="image-placeholder">ZAPO</div>
          )}
        </div>

        <div className="detail-copy">
          <h1>{product.name}</h1>
          <h2>{money(product.price)}</h2>

          <p>
            {product.description || "Descubre esta prenda de nuestra colección."}
          </p>

          <label>
            Talla y color
            <select
              value={variantId}
              onChange={handleVariantChange}
              disabled={variants.length === 0}
            >
              <option value="">
                {variants.length === 0
                  ? "Sin variantes registradas"
                  : "Selecciona una opción"}
              </option>

              {variants.map((item) => {
                const itemStock = Math.max(0, Number(item.stock || 0));

                return (
                  <option
                    key={item.id}
                    value={String(item.id)}
                    disabled={itemStock < 1}
                  >
                    {item.size} · {item.color}
                    {itemStock < 1
                      ? " (Agotado)"
                      : ` (${itemStock} disponibles)`}
                  </option>
                );
              })}
            </select>
          </label>

          {variant && (
            <p>
              <strong>Disponibilidad:</strong>{" "}
              {available ? `${stock} unidad(es)` : "Agotado"}
            </p>
          )}

          <label>
            Cantidad
            <input
              type="number"
              min="1"
              max={stock || 1}
              step="1"
              value={quantity}
              disabled={!available}
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  setQuantity("");
                  return;
                }

                const parsed = Number(value);

                if (Number.isSafeInteger(parsed)) {
                  setQuantity(Math.min(Math.max(parsed, 1), stock || 1));
                }
              }}
              onBlur={() => {
                if (!quantity || quantity < 1) {
                  setQuantity(1);
                }
              }}
            />
          </label>

          <p>
            <strong>Subtotal:</strong> {money(total)}
          </p>

          {error && <p className="notice error">{error}</p>}

          <button
            className="button button-dark"
            type="button"
            disabled={!available || adding || !Number.isSafeInteger(quantity)}
            onClick={handleAddToCart}
          >
            {adding
              ? "Agregando..."
              : !variants.length
                ? "Sin variantes disponibles"
                : !available
                  ? "Producto agotado"
                  : "Agregar al carrito"}
          </button>

          <p>
            <Link to="/catalogo">Volver al catálogo</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
