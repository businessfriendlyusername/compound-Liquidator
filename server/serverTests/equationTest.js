checkFunctions = (I, c, y) => {
  var x = (c + y) / (I / (c + y - (y / 500)))
  
  var testY = (500 * c * (I - x)) / ((499 * x) - (500 * I))

  console.log(y, testY)
  if(y === testY)
  console.log('penis')
  else
  console.log('vagina')
}

checkFunctions(1.0 , 420.0, 69.69)