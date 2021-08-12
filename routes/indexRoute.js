const route = require("express").Router();

const models = require("../models");

route.get("/", (req, res) => {
  if (!req.cookies.user_data) {
    return res.redirect("/login");
  }

  if (req.cookies.user_data.password_done) {
    models.Users.findOne({ user_email: req.cookies.user_data.user_email }).then(
      (user) => {
        return res.render("index", { user });
      }
    );
  } else {
    return res.render("index", {
      error: req.flash("Error found"),
    });
  }
});

module.exports = route;
