const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  disease: String,
  doctor: String
});

module.exports = mongoose.model('Patient', patientSchema);
