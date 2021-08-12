const route = require("express").Router();

const models = require("../models");

const { body, validationResult } = require("express-validator");

const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");

const si = require("systeminformation");

const axios = require("axios").default;

const publicIp = require("public-ip");

var geoip = require("geoip-lite");

const requestIp = require("request-ip");

const {
  Signup_Email_HTML,
  Signup_Email_Subject,
} = require("../nodemailer/Signup_mail_content");

const {
  Confirm_Resend_Email_HTML,
  Confirm_Resend_Email_Subject,
} = require("../nodemailer/Resend_confirmation");

const transport = require("../nodemailer/nodemail.config");

route.get("/", (req, res) => {
  if (req.cookies.user_data) {
    return res.redirect("/");
  }
  return res.render("signup");
});

// ***************************************
// *
// ? Signup POST Route
// *
route.post(
  "/",
  [
    body("email").isEmail().not().isEmpty(),
    body("firstName").not().isEmpty(),
    body("user_password").isLength({ min: 8 }).not().isEmpty(),
    body("user_password_confirm").isLength({ min: 8 }).not().isEmpty(),
  ],
  async (req, res) => {
    const err = await validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json({ err: err.array() });
    }

    if (req.body.user_password !== req.body.user_password_confirm) {
      return res.status(400).json({ err: ["Passwords do not match"] });
    }

    const token = jwt.sign(
      { user_email: req.body.email },
      process.env.JWT_SECRET
    );

    const passwordHashed = await bcrypt.hash(req.body.user_password, 13);

    const osInfo = await si
      .osInfo()
      .then((data) => {
        return {
          platform: data.platform,
          distro: data.distro,
          release: data.release,
          hostname: data.hostname,
        };
      })
      .catch((error) => console.error(error));

    let ip = await publicIp.v4();

    const users = await si
      .users()
      .then((data) => {
        return data;
      })
      .catch((error) => console.error(error));
    //*geoip and time zone checking
    var geo = geoip.lookup(ip);
    let zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const uuid = await si
      .uuid()
      .then((data) => {
        return data;
      })
      .catch((error) => console.error(error));

    const clientIp = requestIp.getClientIp(req);

    geo = geoip.lookup(clientIp);

    let url = `https://ipapi.co/${clientIp}/json`;
    const ipdata = await axios.get(url).then((data) => {
      return data.data;
    });

    let temp;
    if (geo !== null) {
      const tzone = geo.timezone;

      temp = new models.Users({
        user_email: req.body.email,
        user_name: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        },
        user_password: passwordHashed,
        user_confirmationCode: token,

        signup_osInfo: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          hostname: osInfo.hostname,
        },
        signup_uuid: {
          os: uuid.os,
          hardware: uuid.hardware,
          macs: uuid.macs,
        },
        signup_geo: {
          range: geo.range,
          country: geo.country,
          timezone: geo.timezone,
          ll: geo.ll,
          public_ip: ip,
          clientIp: clientIp,
          city: ipdata.city,
          region: ipdata.region,
          region_code: ipdata.region_code,
          country_code_iso3: ipdata.country_code_iso3,
          country_name: ipdata.country_name,
          postal_code: ipdata.postal,
          country_calling_code: ipdata.country_calling_code,
          asn: ipdata.asn,
          org: ipdata.org,
          latitude: ipdata.latitude,
          longitude: ipdata.longitude,
        },

        signup_timezone:
          new Date().toLocaleString("en-IN", {
            tzone,
          }) +
          " " +
          tzone +
          " " +
          ipdata.utc_offset +
          " " +
          ip +
          " " +
          clientIp,
      });
    } else {
      temp = new models.Users({
        user_email: req.body.email,
        user_name: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        },
        user_password: passwordHashed,
        user_confirmationCode: token,

        signup_osInfo: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          hostname: osInfo.hostname,
        },
        signup_uuid: {
          os: uuid.os,
          hardware: uuid.hardware,
          macs: uuid.macs,
        },

        signup_timezone:
          new Date().toLocaleString("en-IN", {
            zone,
          }) +
          " " +
          zone,
      });
    }

    await temp.save(async (err, result) => {
      if (err) {
        return res.send({ err: err });
      }

      const user_mail_data = { result };

      const html_template = Signup_Email_HTML(user_mail_data);

      const html_subject = Signup_Email_Subject();

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

      res.cookie(`user_data`, {
        user_status: result.user_status,
        firstName: result.user_name.firstName,
        user_email: result.user_email,
      });

      await res.send({
        message: `User registered successfully! Please check your email 
                  if not received resend: ${process.env.Local_PORT}/signup/confirm/resend`,
      });
    });
  }
);

// ***************************************
// *
// ? Confirmation resend Route
// *
route.post("/confirm/resend", async (req, res) => {
  if (req.cookies.user_data.user_status === "Active") {
    return res
      .status(400)
      .send({ msg: "This account has already been verified. Please log in." });
  }

  const token = jwt.sign(
    { user_email: req.session.user_email },
    process.env.JWT_SECRET
  );

  await models.Users.findOneAndUpdate(
    { user_email: req.cookies.user_data.user_email },
    { user_confirmationCode: token },

    async (err, result) => {
      if (err) {
        return res.send({ err: err });
      }

      const user_mail_data = { result, req, token };

      // console.log(user_mail_data);

      const html_template = Confirm_Resend_Email_HTML(user_mail_data);

      const html_subject = Confirm_Resend_Email_Subject();

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
        message: `Please check your email
                if not received resend: ${process.env.Local_PORT}/signup/confirm/resend`,
      });
    }
  );
});

// ***************************************
// *
// ? Confirmation Route
// *
route.get("/confirm/:token", async (req, res) => {
  await models.Users.findOne(
    { user_confirmationCode: req.params.token },
    async (err, result) => {
      if (err) {
        return res.send(err);
      }
      if (!result)
        return res.status(400).json({
          type: "not-verified",
          msg: "We were unable to find a valid token. Your token my have expired.",
        });

      if (result.user_status !== "Pending") {
        return res.status(400).json({
          type: "already-verified",
          msg: "This user has already been verified.",
        });
      }

      await models.Users.findOneAndUpdate(
        { user_confirmationCode: req.params.token },
        { $set: { user_status: "Active", user_confirmationCode: null } },
        async (err, result) => {
          if (err) return res.status(500).send(`value not updated`);

          res.cookie(`user_data`, {
            user_status: "Active",
            firstName: result.user_name.firstName,
            user_email: result.user_email,
          });

          return res.json({
            message: `User Email Verified`,
            result: result,
          });
        }
      );
    }
  );
});

module.exports = route;
