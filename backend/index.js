const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas públicas
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

// Middleware de autenticación para rutas protegidas
const { verificarToken } = require("./middleware/auth");

// Rutas protegidas
const profesorRoutes = require("./routes/profesor.routes");
const departamentoRoutes = require("./routes/departamento.routes");
const solicitudRoutes = require("./routes/solicitud.routes");
const contratoRoutes = require("./routes/contrato.routes");
const usuarioRoutes = require("./routes/usuario.routes");

app.use("/usuarios", verificarToken, usuarioRoutes);
app.use("/profesores", verificarToken, profesorRoutes);
app.use("/departamentos", verificarToken, departamentoRoutes);
app.use("/solicitudes", verificarToken, solicitudRoutes);
app.use("/contratos", verificarToken, contratoRoutes);

// Servir frontend estático (opcional)
app.use(express.static(path.join(__dirname, "frontend")));

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));