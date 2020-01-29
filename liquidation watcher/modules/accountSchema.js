const mongoose = require('mongoose')
const Schema = mongoose.Schema

const accountSchema = new Schema({
  address: String,
  balances: [{
    cToken: String,
    collateral: Number,
    borrowed: Number
  }],
})

module.exports = mongoose.model('account', accountSchema)