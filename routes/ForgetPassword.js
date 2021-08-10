const route = require("express").Router();

const models = require("../models");

const { body, validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const transport = require("../nodemailer/nodemail.config");

const {
  Forget_password_regenerate_Email_HTML,
  Forget_password_regenerate_Email_Subject,
  password_reset_Email_HTML,
  password_reset_Email_Subject,
} = require("../nodemailer/Forget_Password_mail");

route.post("/", async (req, res) => {
  const userExits = await models.Users.findOne({
    user_email: req.body.user_email,
  });
  if (!userExits) {
    return res.status(400).send("User not found");
  } else {
    const token = jwt.sign(
      { user_email: req.body.email },
      process.env.JWT_SECRET
    );

    await models.Users.findOneAndUpdate(
      { user_email: userExits.user_email },
      { forget_password_token: token },
      async (err, result) => {
        if (err) {
          return res.send({ err: err });
        }

        const user_mail_data = { result, token };

        const html_template =
          Forget_password_regenerate_Email_HTML(user_mail_data);

        const html_subject = Forget_password_regenerate_Email_Subject();

        await transport
          .sendMail({
            from: process.env.Nodemailer_USER,
            to: result.user_email,
            subject: html_subject,
            html: html_template,
          })
          .catch(async (err) => {
            await models.Users.findOneAndDelete({
              user_email: result.user_email,
            });
            return res.send(err);
          });

        await res.send({
          message: `Please check your email`,
          //   if not received resend: ${process.env.Local_PORT}/signup/confirm/resend
        });
      }
    );
  }
});

route.get("/passwordreset/:token", async (req, res) => {
  await models.Users.findOne(
    { forget_password_token: req.params.token },
    async (err, result) => {
      if (err) return res.status(500).send(`value not updated`);

      res.cookie(`user_data`, {
        forget_password_token: req.params.token,
        firstName: result.user_name.firstName,
        user_email: result.user_email,
      });

      return res.json({
        message: `post password at ${process.env.Local_PORT}/forgetpassword/passwordreset as password and password_confirmation`,
        result: result,
      });
    }
  );
});

route.post(
  "/passwordreset",
  [
    body("password").isLength({ min: 8 }).not().isEmpty(),
    body("password_confirmation").isLength({ min: 8 }).not().isEmpty(),
  ],
  async (req, res) => {
    const err = await validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json({ err: err.array() });
    }

    if (req.body.password !== req.body.password_confirmation) {
      return res.send({
        message: "Password and Password Confirmation are not same",
      });
    }

    const passwordHashed = await bcrypt.hash(req.body.password, 13);

    if (req.cookies.user_data.forget_password_token !== null) {
      await models.Users.findOneAndUpdate(
        {
          user_email: req.cookies.user_data.user_email,
        },
        {
          $set: { user_password: passwordHashed, forget_password_token: null },
        },
        async (err, result) => {
          if (err) return res.status(500).send(`Password not updated`);

          const user_mail_data = { result };

          const html_template = password_reset_Email_HTML(user_mail_data);

          const html_subject = password_reset_Email_Subject();

          await transport.sendMail({
            from: process.env.Nodemailer_USER,
            to: result.user_email,
            subject: html_subject,
            html: html_template,
          });

          res.cookie(`user_data`, {
            forget_password_token: null,
          });

          return res.json({
            message: `password reset success`,
            result: result,
          });
        }
      );
    } else {
      return res.status(400).send("Some error");
    }
  }
);

module.exports = route;
