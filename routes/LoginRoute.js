const route = require("express").Router();

const models = require("../models");

const { body, validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");

const session = require("express-session");

const si = require("systeminformation");

const axios = require("axios").default;

const publicIp = require("public-ip");

var geoip = require("geoip-lite");

const requestIp = require("request-ip");

const {
  Login_Email_HTML,
  Login_Email_Subject,
} = require("../nodemailer/Login_mail_content");

const transport = require("../nodemailer/nodemail.config");

route.get("/", (req, res) => {
  if (req.cookies.user_data) {
    return res.redirect("/");
  }
  return res.render("login");
});

route.post(
  "/",
  [
    body("email").isEmail().normalizeEmail().not().isEmpty(),
    body("user_password").isLength({ min: 8 }).not().isEmpty(),
  ],
  async (req, res) => {
    const err = await validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json({ err: err.array() });
    }

    models.Users.findOne(
      { user_email: req.body.email },
      async (err, result) => {
        if (err) {
          return res.status(500).send(err);
        }

        res.cookie(`user_data`, {
          user_email: req.body.email,
        });

        if (result.user_status === "Active") {
          if (result) {
            // matching password
            const isMatch = bcrypt.compareSync(
              req.body.user_password,
              result.user_password
            );

            // check password is matched
            if (isMatch) {
              // password match
              res.cookie(`user_data`, {
                user_status: result.user_status,
                firstName: result.user_name.firstName,
                user_email: result.user_email,
              });

              const osInfo = await si
                .osInfo()
                .then((data) => {
                  return {
                    platform: data.platform,
                    distro: data.distro,
                    release: data.release,
                    hostname: data.hostname,
                  };
                  // console.log(osinfo);
                })
                .catch((error) => console.error(error));

              // console.log(await publicIp.v4());
              let ip = await publicIp.v4();

              const users = await si
                .users()
                .then((data) => {
                  return data;
                  // console.log(osinfo);
                })
                .catch((error) => console.error(error));
              // * geoip and time zone checking
              var geo = geoip.lookup(ip);
              let zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              //   console.log(
              //     new Date().toLocaleString("en-US", { zone }) + " " + zone
              //   );
              // console.log(geo);

              const uuid = await si
                .uuid()
                .then((data) => {
                  return data;
                  //   console.log(uuid);
                })
                .catch((error) => console.error(error));
              //   console.log(uuid);

              const clientIp = requestIp.getClientIp(req);

              // console.log(clientIp);

              geo = geoip.lookup(clientIp);

              let url = `https://ipapi.co/${clientIp}/json`;
              const ipdata = await axios.get(url).then((data) => {
                return data.data;
              });

              // console.log(ipdata);

              if (geo !== null) {
                const tzone = geo.timezone;

                await models.Users.findOneAndUpdate(
                  { user_email: req.body.email },
                  {
                    last_login_osInfo: {
                      platform: osInfo.platform,
                      distro: osInfo.distro,
                      release: osInfo.release,
                      hostname: osInfo.hostname,
                    },
                    last_login_uuid: {
                      os: uuid.os,
                      hardware: uuid.hardware,
                      macs: uuid.macs,
                    },
                    last_login_geo: {
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

                    $push: {
                      login_dates_regions:
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
                    },
                  }
                ),
                  (err, result) => {
                    if (err) return res.status(404).json(err);
                    return res.json(result);
                  };
              } else {
                await models.Users.findOneAndUpdate(
                  { user_email: req.body.email },
                  {
                    last_login_osInfo: {
                      platform: osInfo.platform,
                      distro: osInfo.distro,
                      release: osInfo.release,
                      hostname: osInfo.hostname,
                    },
                    last_login_uuid: {
                      os: uuid.os,
                      hardware: uuid.hardware,
                      macs: uuid.macs,
                    },

                    $push: {
                      login_dates_regions:
                        new Date().toLocaleString("en-IN", {
                          zone,
                        }) +
                        " " +
                        zone,
                    },
                  }
                ),
                  (err, result) => {
                    if (err) return res.status(404).json(err);
                    return res.json(result);
                  };
              }
              //   console.log(osinfo);

              const user_mail_data = { req, result, osInfo, geo };

              const html_template = Login_Email_HTML(user_mail_data);

              const html_subject = Login_Email_Subject(user_mail_data);

              await transport.sendMail({
                from: process.env.Nodemailer_USER,
                to: result.user_email,
                subject: html_subject,
                html: html_template,
              });

              // return res.status(200).json(result);

              res.cookie(`user_data`, {
                user_status: result.user_status,
                firstName: result.user_name.firstName,
                user_email: result.user_email,
                password_done: true,
              });

              // req.flash("message", "Hi");

              return res.redirect("/");
            }
            // if password is incorrect
            else {
              return res
                .status(500)
                .json({ err: `!!! Password Not Matched !!!` });
            }
          } else {
            return res.status(500).json({ err: "Email not Found" });
          }
        } else {
          return res.json({
            type: "not-verified",
            msg: `Please Verify your Account first or Request Resend Confirmation Mail ${process.env.Local_PORT}/signup/confirm/resend`,
          });
        }
      }
    );
  }
);

module.exports = route;
