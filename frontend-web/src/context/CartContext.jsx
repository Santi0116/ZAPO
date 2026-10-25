
import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function add(product, variant, quantity = 1) {
    if (!product?.id || !variant?.id) {
      throw new Error("El producto o la variante no son válidos.");
    }

    const stock = Number(variant.stock);
    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      throw new Error("La cantidad debe ser un número entero mayor que cero.");
    }

    if (!Number.isFinite(stock) || stock < 1) {
      throw new Error("Esta variante no tiene existencias.");
    }

    const key = `${product.id}-${variant.id}`;

    setItems((current) => {
      const found = current.find((item) => item.key === key);

      if (found) {
        const newQuantity = found.quantity + requestedQuantity;

        if (newQuantity > stock) {
          throw new Error(
            `Solo hay ${stock} unidades disponibles de esta variante.`
          );
        }

        return current.map((item) =>
          item.key === key
            ? {
                ...item,
                product,
                variant,
                quantity: newQuantity,
              }
            : item
        );
      }

      if (requestedQuantity > stock) {
        throw new Error(
          `Solo hay ${stock} unidades disponibles de esta variante.`
        );
      }

      return [
        ...current,
        {
          key,
          product,
          variant,
          quantity: requestedQuantity,
        },
      ];
    });
  }

  function setQuantity(key, quantity) {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }

        const stock = Number(item.variant.stock) || 0;
        const requested = Number(quantity);

        if (!Number.isInteger(requested) || requested < 1) {
          return item;
        }

        if (requested > stock) {
          return item;
        }

        return {
          ...item,
          quantity: requested,
        };
      })
    );
  }

  function remove(key) {
    setItems((current) =>
      current.filter((item) => item.key !== key)
    );
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.product.price) * item.quantity,
    0
  );

  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const value = useMemo(
    () => ({
      items,
      add,
      setQuantity,
      remove,
      clear,
      total,
      itemCount,
    }),
    [items, total, itemCount]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart debe usarse dentro de CartProvider"
    );
  }

  return context;
}
