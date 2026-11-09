const express = require("express");
const cors = require("cors");
const {
  clientUrl
} = require("./config/env");
const authRoutes =
  require("./routes/auth.routes");

const certificationRoutes =
  require("./routes/certification.routes");

const domaineRoutes =
  require("./routes/domaine.routes");
const metierRoutes =
  require("./routes/metier.routes");

const competenceRoutes =
  require("./routes/competence.routes");
  const organismeRoutes =
  require("./routes/organisme.routes");

const etablissementRoutes =
  require("./routes/etablissement.routes");
  const sourceRoutes =
  require("./routes/source.routes");

const documentRoutes =
  require("./routes/document.routes");
  const reconnaissanceRoutes =
  require("./routes/reconnaissance.routes");
  const searchRoutes =
  require("./routes/search.routes");
  const contributionRoutes =
  require("./routes/contribution.routes");
  const auditRoutes =
  require("./routes/audit.routes");
  const importRoutes =
  require("./routes/import.routes");
  const notificationRoutes =
  require("./routes/notification.routes");
  const expiryRoutes =
  require("./routes/expiry.routes");
  const niveauRoutes =
  require("./routes/niveau.routes");
const scraperRoutes =
  require("./routes/scraper.routes");
const typeRoutes =
  require("./routes/typeCertification.routes");

const natureRoutes =
  require("./routes/natureCertification.routes");
const historiqueRoutes =
  require(
    "./routes/historiqueCertification.routes"
  );
  const completudeRoutes =
  require(
    "./routes/completude.routes"
  );
  const userRoutes =
  require("./routes/user.routes");
const statutRoutes =
  require("./routes/statutVerification.routes");
  const analyticsRoutes =
  require("./routes/analytics.routes");
  const settingsRoutes = require("./routes/settings.routes");
  
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://ancps-senegal.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser les requêtes sans origine (Postman, etc.)
      if (!origin || allowedOrigins.includes(origin) || origin === clientUrl) {
        return callback(null, true);
      }

      return callback(new Error("Origine non autorisée par CORS : " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);


app.use(express.json());

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/certifications",
  certificationRoutes
);

app.use(
  "/api/domaines",
  domaineRoutes
);
app.use(
  "/api/metiers",
  metierRoutes
);

app.use(
  "/api/competences",
  competenceRoutes
);
app.use(
  "/api/organismes",
  organismeRoutes
);

app.use(
  "/api/etablissements",
  etablissementRoutes
);
app.use(
  "/api/sources",
  sourceRoutes   
);

app.use(
  "/api/documents",
  documentRoutes
);    
app.use(
  "/api/reconnaissances",
  reconnaissanceRoutes
);
app.use(
  "/api/search",
  searchRoutes
);
app.use("/api/settings", settingsRoutes);
app.use(
  "/api/contributions",
  contributionRoutes
);
app.use(
  "/api/audit",
  auditRoutes
);
app.use(
  "/api/import",
  importRoutes
);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use(
  "/api/expiry",
  expiryRoutes
);
app.use(
  "/api/niveaux",
  niveauRoutes
);

app.use(
  "/api/types-certification",
  typeRoutes
);
app.use(
  "/api/scraper",
  scraperRoutes
);

app.use(
  "/api/natures-certification",
  natureRoutes
);

app.use(
  "/api/statuts-verification",
  statutRoutes
);
app.use(
  "/api/historique",
  historiqueRoutes
);
app.use(
  "/api/completude",
  completudeRoutes
);
app.use(
  "/api/users",
  userRoutes
);
app.use(
  "/api/analytics",
  analyticsRoutes
);
app.get("/", (req, res) => {
  res.json({
    message: "API Annuaire Certifications Sénégal"
  });
});

module.exports = app;