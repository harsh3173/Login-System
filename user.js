const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require('bcryptjs');


const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});



UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

module.exports = User;
