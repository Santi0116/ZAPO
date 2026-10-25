require("dotenv").config();
const express = require("express");
const cors = require("cors");
const products = require("./routes/products");
const orders = require("./routes/orders");
const admin = require("./routes/admin");
const delivery = require("./routes/delivery");

const app = express();
const allowedOrigins = (process.env.WEB_ORIGIN || "http://localhost:5173").split(",").map(x => x.trim());


app.use(cors({
  origin(origin, callback) {
    console.log("Origen recibido:", JSON.stringify(origin));
    console.log("Orígenes permitidos:", allowedOrigins);

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("ORIGEN RECHAZADO:", origin);
    return callback(new Error("Origen no permitido por CORS"));
  }
}));

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ app: "ZAPO API", status: "ok" }));
app.use("/api/products", products);
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", admin);
app.use("/api/delivery", delivery);

app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: "Ocurrió un error en el servidor." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ZAPO API escuchando en http://localhost:${port}`));
app.use(cors({
  origin(origin, callback) {
    console.log("Origen recibido:", origin);
    console.log("Orígenes permitidos:", allowedOrigins);

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origen no permitido por CORS"));
  }
}));