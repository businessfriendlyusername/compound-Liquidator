const mongoose = require('mongoose')
const Schema = mongoose.Schema

const accountSchema = new Schema({
  address: String,
  collateralizationRatio: Decimal128
})