const bigNumber = require('bignumber.js')
//scores accounts based on watching priority


//account follows the structure outlined in accountSchema.js
//prices are a dictionary mapping the cToken address to the price mantissa and conversion rate
//This function scores with the following priority: liquidatable with high debt, almost liquidatable with high debt, liquidatable with small debt, everything else

function score(account, prices){
  var highDebt = false//true if debt in a single asset exceeds some level
  var totalDebt = 0
  var totalCollateral = 0
  account.balances.forEach(cToken => {
    var collateral = new bigNumber(cToken.collateral)
  })
}
