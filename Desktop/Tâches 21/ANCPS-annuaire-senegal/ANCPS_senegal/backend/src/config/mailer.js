
const axios = require("axios");

const sendMail = async ({
  to,
  subject,
  text,
  html
}) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY est absente");
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error("EMAIL_FROM est absente");
    }

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: process.env.EMAIL_FROM,
          name: "ANCPS"
        },

        to: [
          {
            email: to
          }
        ],

        subject,

        textContent: text,

        htmlContent: html
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      }
    );

    console.log(
      "Email Brevo envoyé avec succès :",
      response.data
    );

    return response.data;

  } catch (error) {
    console.error(
      "Erreur API Brevo :",
      error.response?.data || error.message
    );

    throw error;
  }
};

module.exports = {
  sendMail
};