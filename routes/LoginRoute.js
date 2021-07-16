const route = require("express").Router();

const models = require("../models");

const { body, validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");

const si = require("systeminformation");

var geoip = require("geoip-lite");

const transport = require("../nodemailer/nodemail.config");

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

              const users = await si
                .users()
                .then((data) => {
                  return data;
                  // console.log(osinfo);
                })
                .catch((error) => console.error(error));
              //*geoip and time zone checking
              var geo = geoip.lookup(users.ip);
              let zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              //   console.log(
              //     new Date().toLocaleString("en-US", { zone }) + " " + zone
              //   );

              const uuid = await si
                .uuid()
                .then((data) => {
                  return data;
                  //   console.log(uuid);
                })
                .catch((error) => console.error(error));
              //   console.log(uuid);

              if (geo !== null) {
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
                      region: geo.region,
                      eu: geo.eu,
                      timezone: geo.timezone,
                      city: geo.city,
                      ll: geo.ll,
                    },

                    $push: {
                      login_dates_regions:
                        new Date().toLocaleString("en-US", {
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
                        new Date().toLocaleString("en-US", {
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

              transport.sendMail({
                from: process.env.Nodemailer_USER,
                to: result.user_email,
                subject: `New Login To Your Account from ${osInfo.platform} System with ${req.headers["user-agent"]}`,
                html: `<h1>New Login To Your Account from ${
                  osInfo.platform
                } System with ${req.headers["user-agent"]}</h1>
                  <h2>Hello ${result.user_name.firstName}</h2>
                  <p>If Not You!!!, Change your password by clicking on the following link</p>
                  <a href=http://localhost:${
                    process.env.PORT || 5555
                  }/password> Click here</a>
                  </div>`,
              });

              return res.status(200).json(result);
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
            msg: `Please Verify your Account first or Request Resend Confirmation Mail http://localhost:${
              process.env.PORT || 5555
            }/signup/confirm/resend`,
          });
        }
      }
    );
  }
);

module.exports = route;
