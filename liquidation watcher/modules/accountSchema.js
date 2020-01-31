const mongoose = require('mongoose')
const Schema = mongoose.Schema

const accountSchema = new Schema({
  address: String,
  balances: {
    asset: {
      cTokenBalance: String,
      borrowBalance: String,
      inAsset: Boolean
    }
  },
})

module.exports = mongoose.model('account', accountSchema)

prices = {
  cMKR: {
    price: 100,
    exchangeRate: 100
  }
}