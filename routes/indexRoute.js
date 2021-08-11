const route = require("express").Router();

route.get("/", (req, res) => {
  if (!req.cookies.user_data) {
    return res.redirect("/login");
  }

  res.render("index");
});

module.exports = route;
