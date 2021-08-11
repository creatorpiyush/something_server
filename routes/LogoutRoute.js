const route = require("express").Router();

route.post("/", (req, res) => {
  res.clearCookie("user_data");
  return res.redirect("/login");
});

module.exports = route;
