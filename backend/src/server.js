
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const products = require("./routes/products");
const orders = require("./routes/orders");
const admin = require("./routes/admin");
const delivery = require("./routes/delivery");

const app = express();

const allowedOrigins = (
  process.env.WEB_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Permite solicitudes sin Origin, por ejemplo, ciertas
      // herramientas de prueba y llamadas internas.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Origen rechazado por CORS:", origin);
      return callback(new Error("Origen no permitido por CORS"));
    },
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    app: "ZAPO API",
    status: "ok",
  });
});

app.use("/api/products", products);
app.use("/api/orders", orders);
app.use("/api/admin", admin);
app.use("/api/delivery", delivery);

app.use((err, _req, res, _next) => {
  console.error("Error del servidor:", err.message);

  res.status(500).json({
    error: "Ocurrió un error en el servidor.",
  });
});

const rawPort = process.env.PORT;
const parsedPort = Number(rawPort);
const port =
  rawPort && Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535
    ? parsedPort
    : 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`ZAPO API escuchando en el puerto ${port}`);
});
