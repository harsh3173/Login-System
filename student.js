const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  }
});

StudentSchema.plugin(passportLocalMongoose);

const Student = mongoose.model('Student', StudentSchema,"students");

module.exports = Student;
