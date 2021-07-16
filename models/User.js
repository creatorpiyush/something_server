const mongoose = require("mongoose");

const timeZone = require("mongoose-timezone");

const userSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true,
    unique: true,
  },

  user_name: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
  },

  user_password: {
    type: String,
    required: true,
  },

  user_status: {
    type: String,
    enum: ["Pending", "Active"],
    default: "Pending",
  },

  user_confirmationCode: {
    type: String,
    expires: 2000,
    unique: true,
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },

  updatedDate: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(timeZone, { paths: ["createdDate", "updatedDate"] });

const Users = mongoose.model("user", userSchema);
module.exports = Users;
