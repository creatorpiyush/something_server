const mongoose = require("mongoose");

require("dotenv").config();

mongoose.connect(
  process.env.DB_URL,
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  (err, info) => {
    if (err) console.log(err);
    else console.log("DB Connected");
  }
);

module.exports = {
  Users: require("./User"),
};
