
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: "./.env" });

const app = express();

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL
}));

const client = new MongoClient(process.env.RADAR_MONGO_URI);

let db;

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Radar API opérationnelle" });
});

app.get("/api/certifications", async (req, res) => {
  try {
    const filter = req.query.published === "true"
      ? { published: true }
      : {};

    const certifications = await db
      .collection("certifications")
      .find(filter)
      .toArray();

    res.json({
      success: true,
      count: certifications.length,
      data: certifications
    });
  } catch (error) {
    console.error("Erreur certifications :", error);

    res.status(500).json({
      success: false,
      message: "Impossible de récupérer les certifications"
    });
  }
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await client.connect();

    db = client.db(process.env.MONGODB_DB);

    console.log("MongoDB Atlas connecté");

    app.listen(PORT, () => {
      console.log(`Radar API démarrée sur le port ${PORT}`);
    });
  } catch (error) {
    console.error("Erreur de connexion MongoDB :", error);
    process.exit(1);
  }
}

startServer();
