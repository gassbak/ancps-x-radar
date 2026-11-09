const Reconnaissance =
  require("../models/Reconnaissance");

const User =
  require("../models/User");

const {
  createNotification
} = require("./notification.service");

const checkExpirations = async () => {

  const reconnaissances =
    await Reconnaissance.find()
      .populate("certification");

  const admins =
    await User.find({
      role: "admin"
    });

  const today = new Date();

  for (const item of reconnaissances) {

    if (!item.dateFin) {
      continue;
    }

    const difference =
      item.dateFin - today;

    const jours = Math.ceil(
      difference /
      (1000 * 60 * 60 * 24)
    );

    if (
      jours === 180 ||
      jours === 90 ||
      jours === 30
    ) {

      for (const admin of admins) {

        await createNotification(
          admin._id,
          "expiration",
          `La reconnaissance de ${item.certification.title} expire dans ${jours} jours`
        );

      }
    }
  }
};

module.exports = {
  checkExpirations
};