const nodemailer = require("nodemailer");

module.exports = transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  ignoreTLS: false,
  auth: {
    user: process.env.Nodemailer_USER,
    pass: process.env.Nodemailer_PASS,
  },
});
