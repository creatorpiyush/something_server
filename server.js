const express = require("express");

const session = require("express-session");

const cookieParser = require("cookie-parser");

const flash = require("req-flash");

require("./models");

const app = express();

const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(__dirname + "/public"));
app.set("view engine", "hbs");
app.set("views", "./public/views");

app.use(flash());

app.use(cookieParser());

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: ["key1", "key2"],
  })
);

app.use("/", require("./routes/indexRoute"));
app.use("/signup", require("./routes/SignupRoute"));
app.use("/login", require("./routes/LoginRoute"));
app.use("/forgetpassword", require("./routes/ForgetPassword"));
// app.use("/resetpassword", require("./routes/ResetPassword"));
app.use("/logout", require("./routes/LogoutRoute"));

app.listen(PORT, () => {
  console.log(`Server started at ${process.env.Local_PORT}`);
});
