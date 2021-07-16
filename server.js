const express = require("express");

const session = require("express-session");

const cookieParser = require("cookie-parser");

require("./models");

const app = express();

const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: ["key1", "key2"],
  })
);

app.use("/signup", require("./routes/SignupRoute"));
app.use("/login", require("./routes/LoginRoute"));

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
