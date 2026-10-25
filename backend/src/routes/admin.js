
const express = require("express");
const crypto = require("node:crypto");
const path = require("node:path");

const { adminClient } = require("../config/supabase");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, allowRoles("admin"));

// =====================================================
// SUBIDA DE IMÁGENES DE PRODUCTOS
// =====================================================

router.post("/uploads/product-image", async (req, res, next) => {
  try {
    const { fileName, contentType, fileSize } = req.body || {};

    const allowedTypes = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    };

    if (
      typeof fileName !== "string" ||
      !fileName.trim() ||
      typeof contentType !== "string" ||
      !allowedTypes[contentType]
    ) {
      return res.status(400).json({
        error: "Selecciona una imagen JPG, PNG o WebP válida.",
      });
    }

    const extension = path.extname(fileName).toLowerCase();

    if (!allowedTypes[contentType].includes(extension)) {
      return res.status(400).json({
        error: "La extensión no coincide con el tipo de imagen.",
      });
    }

    const MAX_SIZE = 5 * 1024 * 1024;

    if (
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_SIZE
    ) {
      return res.status(400).json({
        error: "La imagen debe pesar más de 0 y máximo 5 MB.",
      });
    }

    const objectPath = `${crypto.randomUUID()}${extension}`;

    const { data, error } = await adminClient.storage
      .from("productos")
      .createSignedUploadUrl(objectPath);

    if (error) {
      console.error(
        "Error generando autorización de imagen:",
        error.message
      );

      return res.status(500).json({
        error: "No se pudo preparar la subida de la imagen.",
      });
    }

    const { data: publicData } = adminClient.storage
      .from("productos")
      .getPublicUrl(objectPath);

    return res.status(200).json({
      path: objectPath,
      token: data.token,
      imageUrl: publicData.publicUrl,
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// VALIDACIONES Y CAMPOS DE PRODUCTOS
// =====================================================

const PRODUCT_FIELDS = [
  "name",
  "description",
  "category",
  "price",
  "image_url",
  "active",
];

function validId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function validStock(value) {
  return (
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 1000000
  );
}

function validUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

// =====================================================
// PRODUCTOS
// =====================================================

// Obtener todos los productos, incluidos los inactivos.
router.get("/products", async (req, res, next) => {
  try {
    const { data, error } = await adminClient
      .from("products")
      .select(
        "id,name,description,category,price,image_url,active,created_at,product_variants(id,size,color,stock)"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Crear producto.
router.post("/products", async (req, res, next) => {
  try {
    const {
      name,
      description = "",
      category = "General",
      price,
      image_url = "",
      active = true,
    } = req.body;

    const parsedPrice = Number(price);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 150
    ) {
      return res.status(400).json({
        error: "El nombre es obligatorio y debe tener máximo 150 caracteres.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return res.status(400).json({
        error: "Debes proporcionar un precio válido.",
      });
    }

    if (typeof active !== "boolean") {
      return res.status(400).json({
        error: "El estado del producto no es válido.",
      });
    }

    if (
      typeof description !== "string" ||
      typeof category !== "string" ||
      typeof image_url !== "string"
    ) {
      return res.status(400).json({
        error: "La descripción, categoría o imagen no son válidas.",
      });
    }

    const { data, error } = await adminClient
      .from("products")
      .insert({
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || "General",
        price: parsedPrice,
        image_url: image_url.trim(),
        active,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Editar producto o activar/desactivar.
router.patch("/products/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "El identificador del producto no es válido.",
      });
    }

    const updates = {};

    for (const field of PRODUCT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        error: "No hay cambios válidos para guardar.",
      });
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim() ||
        updates.name.trim().length > 150
      ) {
        return res.status(400).json({
          error: "El nombre del producto no es válido.",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      if (typeof updates.description !== "string") {
        return res.status(400).json({
          error: "La descripción no es válida.",
        });
      }

      updates.description = updates.description.trim();
    }

    if (updates.category !== undefined) {
      if (typeof updates.category !== "string") {
        return res.status(400).json({
          error: "La categoría no es válida.",
        });
      }

      updates.category = updates.category.trim() || "General";
    }

    if (updates.image_url !== undefined) {
      if (typeof updates.image_url !== "string") {
        return res.status(400).json({
          error: "La URL de la imagen no es válida.",
        });
      }

      updates.image_url = updates.image_url.trim();
    }

    if (updates.price !== undefined) {
      if (
        updates.price === "" ||
        updates.price === null ||
        !Number.isFinite(Number(updates.price)) ||
        Number(updates.price) < 0
      ) {
        return res.status(400).json({
          error: "El precio no es válido.",
        });
      }

      updates.price = Number(updates.price);
    }

    if (
      updates.active !== undefined &&
      typeof updates.active !== "boolean"
    ) {
      return res.status(400).json({
        error: "El estado debe ser verdadero o falso.",
      });
    }

    const { data, error } = await adminClient
      .from("products")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: "No se encontró el producto.",
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// VARIANTES E INVENTARIO
// =====================================================

// Consultar tallas, colores y existencias.
router.get("/products/:id/variants", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "El identificador del producto no es válido.",
      });
    }

    const { data, error } = await adminClient
      .from("product_variants")
      .select("id,product_id,size,color,stock")
      .eq("product_id", req.params.id)
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Crear variante de talla y color.
router.post("/products/:id/variants", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "El identificador del producto no es válido.",
      });
    }

    const { size, color, stock } = req.body;

    if (
      typeof size !== "string" ||
      !size.trim() ||
      size.trim().length > 20
    ) {
      return res.status(400).json({
        error: "La talla es obligatoria y debe tener máximo 20 caracteres.",
      });
    }

    if (
      typeof color !== "string" ||
      !color.trim() ||
      color.trim().length > 50
    ) {
      return res.status(400).json({
        error: "El color es obligatorio y debe tener máximo 50 caracteres.",
      });
    }

    if (!validStock(stock)) {
      return res.status(400).json({
        error: "El stock debe ser un entero entre 0 y 1.000.000.",
      });
    }

    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return res.status(404).json({
        error: "No se encontró el producto seleccionado.",
      });
    }

    const normalizedSize = size.trim();
    const normalizedColor = color.trim();

    const { data: existing, error: existingError } = await adminClient
      .from("product_variants")
      .select("id")
      .eq("product_id", req.params.id)
      .ilike("size", normalizedSize)
      .ilike("color", normalizedColor)
      .limit(1);

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: "Ya existe esta combinación de talla y color para el producto.",
      });
    }

    const { data, error } = await adminClient
      .from("product_variants")
      .insert({
        product_id: Number(req.params.id),
        size: normalizedSize,
        color: normalizedColor,
        stock,
      })
      .select("id,product_id,size,color,stock")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          error: "Esta talla y color ya están registrados para el producto.",
        });
      }

      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Actualizar existencias de una variante.
router.patch("/variants/:variantId", async (req, res, next) => {
  try {
    if (!validId(req.params.variantId)) {
      return res.status(400).json({
        error: "El identificador de la variante no es válido.",
      });
    }

    const { stock } = req.body;

    if (!validStock(stock)) {
      return res.status(400).json({
        error: "El stock debe ser un entero entre 0 y 1.000.000.",
      });
    }

    const { data, error } = await adminClient
      .from("product_variants")
      .update({ stock })
      .eq("id", req.params.variantId)
      .select("id,product_id,size,color,stock")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: "No se encontró la variante seleccionada.",
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// PEDIDOS
// =====================================================

// Consultar pedidos con cliente, repartidor y productos.
router.get("/orders", async (req, res, next) => {
  try {
    const { data, error } = await adminClient
      .from("orders")
      .select(
        "*,customer:profiles!orders_customer_id_fkey(id,full_name,phone),delivery_person:profiles!orders_delivery_id_fkey(id,full_name,phone),order_items(*,product_variants(size,color,products(name)))"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Actualizar el estado de un pedido.
router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "El identificador del pedido no es válido.",
      });
    }

    const allowedStatuses = [
      "confirmed",
      "preparing",
      "on_the_way",
      "delivered",
      "cancelled",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "El estado del pedido no está permitido.",
      });
    }

    const { data: currentOrder, error: findError } = await adminClient
      .from("orders")
      .select("id,status")
      .eq("id", req.params.id)
      .maybeSingle();

    if (findError) throw findError;

    if (!currentOrder) {
      return res.status(404).json({
        error: "No se encontró el pedido.",
      });
    }

    if (currentOrder.status === status) {
      return res.json(currentOrder);
    }

    if (["delivered", "cancelled"].includes(currentOrder.status)) {
      return res.status(409).json({
        error: "No se puede cambiar el estado de un pedido finalizado.",
      });
    }

    const { data, error } = await adminClient
      .from("orders")
      .update({ status })
      .eq("id", req.params.id)
      .eq("status", currentOrder.status)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(409).json({
        error: "El pedido cambió mientras se procesaba. Actualiza la información.",
      });
    }

    const { error: historyError } = await adminClient
      .from("order_status_history")
      .insert({
        order_id: data.id,
        status: data.status,
        changed_by: req.user.id,
      });

    if (historyError) {
      console.error(
        "No se pudo guardar el historial del pedido:",
        historyError.message
      );
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// REPARTIDORES
// =====================================================

// Consultar usuarios con rol de repartidor.
router.get("/delivery-persons", async (req, res, next) => {
  try {
    const { data, error } = await adminClient
      .from("profiles")
      .select("id,full_name,phone,role")
      .eq("role", "delivery")
      .order("full_name", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Asignar un pedido a un repartidor.
router.patch("/orders/:id/assign", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "El identificador del pedido no es válido.",
      });
    }

    const { delivery_id } = req.body;

    if (!validUuid(delivery_id)) {
      return res.status(400).json({
        error: "Debes seleccionar un repartidor válido.",
      });
    }

    const { data: deliveryPerson, error: deliveryError } = await adminClient
      .from("profiles")
      .select("id,full_name,phone,role")
      .eq("id", delivery_id)
      .eq("role", "delivery")
      .maybeSingle();

    if (deliveryError) throw deliveryError;

    if (!deliveryPerson) {
      return res.status(404).json({
        error: "El repartidor no existe o no tiene el rol correcto.",
      });
    }

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id,status,delivery_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return res.status(404).json({
        error: "No se encontró el pedido.",
      });
    }

    if (["delivered", "cancelled"].includes(order.status)) {
      return res.status(409).json({
        error: "No se puede asignar un pedido entregado o cancelado.",
      });
    }

    const updates = {
      delivery_id: deliveryPerson.id,
    };

    if (order.status === "pending") {
      updates.status = "confirmed";
    }

    const { data: updatedOrder, error: updateError } = await adminClient
      .from("orders")
      .update(updates)
      .eq("id", order.id)
      .eq("status", order.status)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedOrder) {
      return res.status(409).json({
        error: "El pedido cambió mientras se procesaba. Intenta nuevamente.",
      });
    }

    if (updates.status && updates.status !== order.status) {
      const { error: historyError } = await adminClient
        .from("order_status_history")
        .insert({
          order_id: updatedOrder.id,
          status: updatedOrder.status,
          changed_by: req.user.id,
        });

      if (historyError) {
        console.error(
          "No se pudo registrar el historial del pedido:",
          historyError.message
        );
      }
    }

    res.json({
      message: "Pedido asignado correctamente.",
      order: updatedOrder,
      delivery_person: deliveryPerson,
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// IMPORTAR PRODUCTOS DESDE SUPABASE STORAGE
// =====================================================

router.post("/products/import-from-storage", async (req, res, next) => {
  try {
    const bucket = "productos";

    const folders = {
      CAMISETAS: "Camisetas",
      HOODIES: "Hoodies",
      PANTALONES: "Pantalones",
    };

    function normalizeName(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
    }

    const { data: existingProducts, error: productsError } =
      await adminClient
        .from("products")
        .select("id,name,category,image_url,price,active");

    if (productsError) throw productsError;

    const productsByName = new Map();

    for (const product of existingProducts || []) {
      const key = normalizeName(product.name);

      if (!productsByName.has(key)) {
        productsByName.set(key, product);
      }
    }

    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: [],
    };

    for (const [folder, category] of Object.entries(folders)) {
      let files = [];
      let offset = 0;
      const limit = 100;

      // Listar todos los archivos de la carpeta, paginando.
      while (true) {
        const { data, error } = await adminClient.storage
          .from(bucket)
          .list(folder, {
            limit,
            offset,
            sortBy: { column: "name", order: "asc" },
          });

        if (error) {
          results.errors.push({
            folder,
            error: error.message,
          });
          break;
        }

        const page = data || [];
        files.push(...page);

        if (page.length < limit) break;

        offset += limit;
      }

      for (const file of files) {
        const extension = file.name
          .split(".")
          .pop()
          .toLowerCase();

        if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
          continue;
        }

        const imagePath = `${folder}/${file.name}`;

        const { data: publicData } = adminClient.storage
          .from(bucket)
          .getPublicUrl(imagePath);

        const imageUrl = publicData.publicUrl;

        const productName = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();

        const key = normalizeName(productName);
        const existingProduct = productsByName.get(key);

        try {
          if (existingProduct) {
            // Actualizar imagen y categoría del producto existente.
            const { data, error } = await adminClient
              .from("products")
              .update({
                image_url: imageUrl,
                category,
              })
              .eq("id", existingProduct.id)
              .select("id,name,category,image_url,price,active")
              .single();

            if (error) throw error;

            productsByName.set(key, data);

            results.updated.push({
              id: data.id,
              name: data.name,
              image_url: data.image_url,
            });
          } else {
            // Precio provisional de 0 e inactivo hasta completar los datos.
            const { data, error } = await adminClient
              .from("products")
              .insert({
                name: productName,
                description: "",
                category,
                price: 0,
                image_url: imageUrl,
                active: false,
              })
              .select("id,name,category,image_url,price,active")
              .single();

            if (error) {
              if (error.code === "23505") {
                results.skipped.push({
                  name: productName,
                  reason: "Posible producto duplicado.",
                });
                continue;
              }

              throw error;
            }

            productsByName.set(key, data);

            results.created.push({
              id: data.id,
              name: data.name,
              category: data.category,
              image_url: data.image_url,
              price: data.price,
              active: data.active,
            });
          }
        } catch (error) {
          results.errors.push({
            file: imagePath,
            error: error.message,
          });
        }
      }
    }

    return res.json({
      message: "Proceso de importación finalizado.",
      summary: {
        created: results.created.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
