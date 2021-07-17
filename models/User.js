const mongoose = require("mongoose");

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

  signup_osInfo: {
    platform: String,
    distro: String,
    release: String,
    hostname: String,
  },

  signup_uuid: {
    os: String,
    hardware: String,
    macs: [String],
  },

  signup_geo: {
    range: [Number],
    country: String,
    timezone: String,
    ll: [Number],
    public_ip: String,
    city: String,
    region: String,
    region_code: String,
    country_code_iso3: String,
    country_name: String,
    postal_code: String,
    country_calling_code: String,
    asn: String,
    org: String,
    latitude: Number,
    longitude: Number,
  },

  signup_geo_request: {
    range: [Number],
    country: String,
    region: String,
    eu: String,
    timezone: String,
    city: String,
    ll: [Number],
    clientIp: String,
  },

  last_login_osInfo: {
    platform: String,
    distro: String,
    release: String,
    hostname: String,
  },

  last_login_uuid: {
    os: String,
    hardware: String,
    macs: [String],
  },

  last_login_geo: {
    range: [Number],
    country: String,
    timezone: String,
    ll: [Number],
    public_ip: String,
    clientIp: String,
    city: String,
    region: String,
    region_code: String,
    country_code_iso3: String,
    country_name: String,
    postal_code: String,
    country_calling_code: String,
    asn: String,
    org: String,
    latitude: Number,
    longitude: Number,
  },

  // last_login_geo_request: {
  //   range: [Number],
  //   country: String,
  //   region: String,
  //   eu: String,
  //   timezone: String,
  //   city: String,
  //   ll: [Number],
  //   clientIp: String,
  // },

  login_dates_regions: [String],

  signup_timezone: String,

  // createdDate: {
  //   type: Date,
  //   default: Date.now,
  // },

  // updatedDate: {
  //   type: Date,
  //   default: Date.now,
  // },
});

const Users = mongoose.model("user", userSchema);
module.exports = Users;
