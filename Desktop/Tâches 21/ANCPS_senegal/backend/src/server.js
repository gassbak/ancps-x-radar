const app = require("./app");

const {
  port
} = require("./config/env");

const connectDB =
  require("./config/database");

const cron = require("node-cron");

const {
  checkExpirations
} = require(
  "./services/expiry.service"
);

connectDB();

app.listen(port, () => {
  console.log(
    `Serveur lancé sur le port ${port}`
  );
});

cron.schedule(
  "0 8 * * *",
  async () => {

    console.log(
      "Vérification des expirations..."
    );

    await checkExpirations();
  }
);