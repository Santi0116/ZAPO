import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { apiRequest } from "../services/api";

const INITIAL_FORM = {
  name: "",
  description: "",
  category: "Camisetas",
  price: "",
  image_url: "",
};

const INITIAL_VARIANT = {
  size: "M",
  color: "Negro",
  stock: "0",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "on_the_way",
  "delivered",
  "cancelled",
];

const money = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const formatDate = (value) => {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function getOrderItems(order) {
  return Array.isArray(order.order_items) ? order.order_items : [];
}

function getProductName(item) {
  return (
    item.product_variants?.products?.name ||
    item.product_variants?.product?.name ||
    item.product_name ||
    "Producto"
  );
}

function getVariantDescription(item) {
  const variant = item.product_variants;

  if (!variant) return "";

  const details = [variant.size, variant.color].filter(Boolean);

  return details.join(" · ");
}

export default function AdminDashboard() {
  const [token, setToken] = useState("");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingProduct, setEditingProduct] = useState(null);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState(INITIAL_VARIANT);
  const [variantStockDrafts, setVariantStockDrafts] = useState({});

  const [selectedDelivery, setSelectedDelivery] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [savingStockId, setSavingStockId] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [changingProductId, setChangingProductId] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        setToken("");
        setProducts([]);
        setOrders([]);
        setDeliveryPersons([]);
        throw new Error(
          "Debes iniciar sesión con una cuenta administradora para acceder a este panel."
        );
      }

      const accessToken = session.access_token;
      setToken(accessToken);

      const [productData, orderData, deliveryData] = await Promise.all([
        apiRequest("/api/admin/products", {
          token: accessToken,
        }),
        apiRequest("/api/admin/orders", {
          token: accessToken,
        }),
        apiRequest("/api/admin/delivery-persons", {
          token: accessToken,
        }),
      ]);

      const loadedProducts = Array.isArray(productData) ? productData : [];
      const loadedOrders = Array.isArray(orderData) ? orderData : [];
      const loadedDeliveryPersons = Array.isArray(deliveryData)
        ? deliveryData
        : [];

      setProducts(loadedProducts);
      setOrders(loadedOrders);
      setDeliveryPersons(loadedDeliveryPersons);

      setSelectedDelivery((current) => {
        const updated = { ...current };

        loadedOrders.forEach((order) => {
          if (
            !updated[order.id] ||
            updated[order.id] === order.delivery_id
          ) {
            updated[order.id] = order.delivery_id || "";
          }
        });

        return updated;
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar el panel de administración.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVariants = useCallback(
    async (productId) => {
      if (!productId) {
        setVariants([]);
        return;
      }

      setLoadingVariants(true);
      setError("");

      try {
        const data = await apiRequest(
          `/api/admin/products/${productId}/variants`,
          { token }
        );

        const loadedVariants = Array.isArray(data) ? data : [];

        setVariants(loadedVariants);

        const drafts = {};

        loadedVariants.forEach((variant) => {
          drafts[variant.id] = String(variant.stock ?? 0);
        });

        setVariantStockDrafts(drafts);
      } catch (err) {
        setError(err.message || "No se pudieron cargar las variantes.");
        setVariants([]);
      } finally {
        setLoadingVariants(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (token && selectedProductId) {
      loadVariants(selectedProductId);
    } else {
      setVariants([]);
    }
  }, [token, selectedProductId, loadVariants]);

  function clearNotifications() {
    setMessage("");
    setError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetProductForm() {
    setForm(INITIAL_FORM);
    setEditingProduct(null);
  }

  function startEditingProduct(product) {
    clearNotifications();

    setEditingProduct(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "Camisetas",
      price: String(product.price ?? ""),
      image_url: product.image_url || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event) {
    event.preventDefault();
    clearNotifications();

    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setError("Escribe el nombre del producto.");
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Ingresa un precio válido, igual o superior a cero.");
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      category: form.category.trim(),
      price,
      image_url: form.image_url.trim() || null,
    };

    setSavingProduct(true);

    try {
      if (editingProduct) {
        await apiRequest(`/api/admin/products/${editingProduct.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });

        setMessage("Producto actualizado correctamente.");
      } else {
        await apiRequest("/api/admin/products", {
          method: "POST",
          token,
          body: JSON.stringify({
            ...payload,
            active: true,
          }),
        });

        setMessage("Producto creado correctamente.");
      }

      resetProductForm();
      await load();
    } catch (err) {
      setError(err.message || "No se pudo guardar el producto.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function toggleProductActive(product) {
    clearNotifications();
    setChangingProductId(product.id);

    try {
      await apiRequest(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          active: !product.active,
        }),
      });

      setMessage(
        product.active
          ? "Producto desactivado correctamente."
          : "Producto activado correctamente."
      );

      await load();
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado del producto.");
    } finally {
      setChangingProductId(null);
    }
  }

  function handleVariantFormChange(event) {
    const { name, value } = event.target;

    setVariantForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function createVariant(event) {
    event.preventDefault();
    clearNotifications();

    if (!selectedProductId) {
      setError("Selecciona un producto antes de crear una variante.");
      return;
    }

    const stock = Number(variantForm.stock);

    if (
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 2147483647
    ) {
      setError("El inventario debe ser un número entero igual o superior a cero.");
      return;
    }

    if (!variantForm.size.trim() || !variantForm.color.trim()) {
      setError("Debes indicar la talla y el color.");
      return;
    }

    setSavingVariant(true);

    try {
      await apiRequest(`/api/admin/products/${selectedProductId}/variants`, {
        method: "POST",
        token,
        body: JSON.stringify({
          size: variantForm.size.trim(),
          color: variantForm.color.trim(),
          stock,
        }),
      });

      setVariantForm(INITIAL_VARIANT);
      setMessage("Variante creada correctamente.");

      await loadVariants(selectedProductId);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo crear la variante.");
    } finally {
      setSavingVariant(false);
    }
  }

  async function saveStock(variantId) {
    clearNotifications();

    const stock = Number(variantStockDrafts[variantId]);

    if (
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 2147483647
    ) {
      setError("El inventario debe ser un número entero igual o superior a cero.");
      return;
    }

    setSavingStockId(variantId);

    try {
      await apiRequest(`/api/admin/variants/${variantId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ stock }),
      });

      setMessage("Inventario actualizado correctamente.");

      await loadVariants(selectedProductId);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el inventario.");
    } finally {
      setSavingStockId(null);
    }
  }

  async function updateOrderStatus(orderId, status) {
    clearNotifications();
    setUpdatingOrder(orderId);

    try {
      await apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });

      setMessage(`Estado del pedido #${orderId} actualizado correctamente.`);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado del pedido.");
    } finally {
      setUpdatingOrder(null);
    }
  }

  async function assignDeliveryPerson(orderId) {
    clearNotifications();

    const deliveryId = selectedDelivery[orderId];

    if (!deliveryId) {
      setError("Selecciona un repartidor antes de asignar el pedido.");
      return;
    }

    setAssigningOrder(orderId);

    try {
      await apiRequest(`/api/admin/orders/${orderId}/assign`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          delivery_id: deliveryId,
        }),
      });

      setMessage(`El pedido #${orderId} fue asignado correctamente.`);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo asignar el repartidor.");
    } finally {
      setAssigningOrder(null);
    }
  }

  if (loading) {
    return (
      <main className="admin-dashboard">
        <div className="admin-panel">
          <p>Cargando panel de administración...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-heading">
        <div>
          <p className="admin-eyebrow">ZAPO · Administración</p>
          <h1>Panel de administración</h1>
          <p>
            Gestiona productos, tallas, colores, inventario, pedidos y
            repartidores desde un solo lugar.
          </p>
        </div>

        <button
          type="button"
          className="button button-dark"
          onClick={load}
          disabled={loading}
        >
          Actualizar información
        </button>
      </header>

      {message && (
        <div className="admin-notice admin-notice-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-notice admin-notice-error" role="alert">
          {error}
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <h2>{editingProduct ? "Editar producto" : "Crear producto"}</h2>
            <p>
              Registra la información básica del producto que se mostrará en
              la tienda.
            </p>
          </div>

          {editingProduct && (
            <button
              type="button"
              className="button button-light"
              onClick={resetProductForm}
            >
              Cancelar edición
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={saveProduct}>
          <label>
            Nombre del producto
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Ej. Camiseta clásica ZAPO"
              maxLength={150}
              required
            />
          </label>

          <label>
            Categoría
            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
              required
            >
              <option value="Camisetas">Camisetas</option>
              <option value="Pantalones">Pantalones</option>
              <option value="Sudaderas">Sudaderas</option>
              <option value="Chaquetas">Chaquetas</option>
              <option value="Accesorios">Accesorios</option>
              <option value="Calzado">Calzado</option>
              <option value="Otros">Otros</option>
            </select>
          </label>

          <label>
            Precio (COP)
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleFormChange}
              placeholder="Ej. 75000"
              min="0"
              step="1"
              required
            />
          </label>

          <label>
            URL de la imagen
            <input
              type="url"
              name="image_url"
              value={form.image_url}
              onChange={handleFormChange}
              placeholder="https://..."
            />
          </label>

          <label className="admin-field-full">
            Descripción
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Describe el producto, sus materiales y características."
              rows={4}
            />
          </label>

          <div className="admin-actions admin-field-full">
            <button
              type="submit"
              className="button button-dark"
              disabled={savingProduct}
            >
              {savingProduct
                ? "Guardando..."
                : editingProduct
                  ? "Guardar cambios"
                  : "Crear producto"}
            </button>

            <button
              type="button"
              className="button button-light"
              onClick={resetProductForm}
              disabled={savingProduct}
            >
              Limpiar formulario
            </button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <h2>Productos e inventario</h2>
            <p>
              Consulta los productos registrados y administra sus variantes.
            </p>
          </div>

          <span className="admin-count">{products.length} productos</span>
        </div>

        {products.length === 0 ? (
          <p className="admin-empty">
            Todavía no hay productos registrados.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="admin-product-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="admin-product-image admin-product-placeholder">
                            Z
                          </div>
                        )}

                        <div>
                          <strong>{product.name}</strong>
                          <p>{product.description || "Sin descripción"}</p>
                        </div>
                      </div>
                    </td>

                    <td>{product.category || "Sin categoría"}</td>
                    <td>{money(product.price)}</td>

                    <td>
                      <span
                        className={
                          product.active
                            ? "admin-status admin-status-active"
                            : "admin-status admin-status-inactive"
                        }
                      >
                        {product.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="button button-light"
                          onClick={() => startEditingProduct(product)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="button button-light"
                          onClick={() => {
                            clearNotifications();
                            setSelectedProductId(String(product.id));
                          }}
                        >
                          Variantes
                        </button>

                        <button
                          type="button"
                          className="button button-dark"
                          disabled={changingProductId === product.id}
                          onClick={() => toggleProductActive(product)}
                        >
                          {changingProductId === product.id
                            ? "Actualizando..."
                            : product.active
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <h2>Variantes e inventario</h2>
            <p>
              Cada variante representa una combinación de talla y color con
              su propio inventario.
            </p>
          </div>
        </div>

        <label className="admin-variant-selector">
          Seleccionar producto
          <select
            value={selectedProductId}
            onChange={(event) => {
              setSelectedProductId(event.target.value);
              clearNotifications();
            }}
          >
            <option value="">Selecciona un producto</option>

            {products.map((product) => (
              <option key={product.id} value={String(product.id)}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        {selectedProductId && (
          <>
            <form className="admin-form admin-variant-form" onSubmit={createVariant}>
              <label>
                Talla
                <select
                  name="size"
                  value={variantForm.size}
                  onChange={handleVariantFormChange}
                  required
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="Única">Única</option>
                  <option value="28">28</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                  <option value="34">34</option>
                  <option value="36">36</option>
                </select>
              </label>

              <label>
                Color
                <input
                  type="text"
                  name="color"
                  value={variantForm.color}
                  onChange={handleVariantFormChange}
                  placeholder="Ej. Negro"
                  maxLength={60}
                  required
                />
              </label>

              <label>
                Inventario inicial
                <input
                  type="number"
                  name="stock"
                  value={variantForm.stock}
                  onChange={handleVariantFormChange}
                  min="0"
                  step="1"
                  required
                />
              </label>

              <div className="admin-form-button">
                <button
                  type="submit"
                  className="button button-dark"
                  disabled={savingVariant}
                >
                  {savingVariant ? "Creando..." : "Crear variante"}
                </button>
              </div>
            </form>

            <h3 className="admin-subheading">Variantes registradas</h3>

            {loadingVariants ? (
              <p>Cargando variantes...</p>
            ) : variants.length === 0 ? (
              <p className="admin-empty">
                Este producto todavía no tiene variantes.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Talla</th>
                      <th>Color</th>
                      <th>Inventario</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id}>
                        <td>{variant.size}</td>
                        <td>{variant.color}</td>

                        <td>
                          <input
                            className="admin-stock-input"
                            type="number"
                            min="0"
                            step="1"
                            value={variantStockDrafts[variant.id] ?? ""}
                            onChange={(event) =>
                              setVariantStockDrafts((current) => ({
                                ...current,
                                [variant.id]: event.target.value,
                              }))
                            }
                            aria-label={`Inventario de talla ${variant.size}, color ${variant.color}`}
                          />
                        </td>

                        <td>
                          <button
                            type="button"
                            className="button button-dark"
                            disabled={savingStockId === variant.id}
                            onClick={() => saveStock(variant.id)}
                          >
                            {savingStockId === variant.id
                              ? "Guardando..."
                              : "Guardar inventario"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <h2>Gestión de pedidos</h2>
            <p>
              Revisa las compras, actualiza su estado y asigna un repartidor.
            </p>
          </div>

          <span className="admin-count">{orders.length} pedidos</span>
        </div>

        {orders.length === 0 ? (
          <p className="admin-empty">No hay pedidos registrados todavía.</p>
        ) : (
          <div className="admin-orders">
            {orders.map((order) => {
              const items = getOrderItems(order);
              const terminalStatus = ["delivered", "cancelled"].includes(
                order.status
              );
              const selectedDeliveryId =
                selectedDelivery[order.id] ?? order.delivery_id ?? "";

              return (
                <article className="admin-order-card" key={order.id}>
                  <div className="admin-order-heading">
                    <div>
                      <h3>Pedido #{order.id}</h3>
                      <p>{formatDate(order.created_at)}</p>
                    </div>

                    <span
                      className={`admin-status admin-status-${order.status}`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  <div className="admin-order-details">
                    <div>
                      <strong>Cliente</strong>
                      <p>
                        {order.customer?.full_name || "Sin nombre registrado"}
                      </p>

                      {order.customer?.phone && (
                        <p>Teléfono: {order.customer.phone}</p>
                      )}

                      {order.customer_id && (
                        <p className="admin-muted">
                          ID: {order.customer_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <strong>Dirección de entrega</strong>
                      <p>
                        {order.delivery_address || "Sin dirección registrada"}
                      </p>
                    </div>

                    <div>
                      <strong>Total del pedido</strong>
                      <p className="admin-order-total">{money(order.total)}</p>
                    </div>
                  </div>

                  <div className="admin-order-items">
                    <strong>Productos del pedido</strong>

                    {items.length === 0 ? (
                      <p>No hay detalles de productos disponibles.</p>
                    ) : (
                      <ul>
                        {items.map((item) => (
                          <li key={item.id}>
                            <span>
                              {getProductName(item)}
                              {getVariantDescription(item)
                                ? ` (${getVariantDescription(item)})`
                                : ""}
                            </span>

                            <span>
                              {item.quantity} × {money(item.unit_price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="admin-assignment">
                    <div>
                      <strong>Repartidor asignado</strong>
                      <p>
                        {order.delivery_person?.full_name ||
                          "Pedido sin repartidor"}
                      </p>

                      {order.delivery_person?.phone && (
                        <p>
                          Teléfono: {order.delivery_person.phone}
                        </p>
                      )}
                    </div>

                    <label>
                      Seleccionar repartidor
                      <select
                        value={selectedDeliveryId}
                        onChange={(event) =>
                          setSelectedDelivery((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                        disabled={
                          assigningOrder === order.id || terminalStatus
                        }
                      >
                        <option value="">Selecciona un repartidor</option>

                        {deliveryPersons.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.full_name || "Repartidor"}
                            {person.phone ? ` — ${person.phone}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      className="button button-dark"
                      disabled={
                        assigningOrder === order.id ||
                        !selectedDeliveryId ||
                        terminalStatus ||
                        selectedDeliveryId === (order.delivery_id || "")
                      }
                      onClick={() => assignDeliveryPerson(order.id)}
                    >
                      {assigningOrder === order.id
                        ? "Asignando..."
                        : order.delivery_id
                          ? "Cambiar repartidor"
                          : "Asignar repartidor"}
                    </button>

                    {deliveryPersons.length === 0 && (
                      <p className="admin-help">
                        No hay repartidores registrados. Crea los usuarios
                        correspondientes y asigna el rol delivery en la tabla
                        profiles de Supabase.
                      </p>
                    )}
                  </div>

                  <div className="admin-status-control">
                    <label>
                      Estado del pedido
                      <select
                        value={order.status}
                        onChange={(event) =>
                          updateOrderStatus(order.id, event.target.value)
                        }
                        disabled={
                          updatingOrder === order.id || terminalStatus
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </label>

                    {updatingOrder === order.id && (
                      <p>Actualizando estado...</p>
                    )}

                    {terminalStatus && (
                      <p className="admin-help">
                        Este pedido tiene un estado final y no puede modificarse
                        desde este control.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
