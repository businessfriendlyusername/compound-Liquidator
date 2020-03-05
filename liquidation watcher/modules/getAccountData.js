getLargestBorrow = (address, state) => {
  return new Promise((resolve, reject) => {
    var promises = []
    state.cTokenAddresses.forEach(cTokenAddress => {
      promises.push(state.cTokenContracts[cTokenAddress].methods.borrowBalanceCurrent(address).call().then(borrow => {
        return [borrow, cTokenAddress]
      }))
    })

    Promise.all(promises).then(borrows => {
      var largestEthVal = new bigNumber(0)
      var largestTokenBalance
      var assetCTokenAddress
      borrows.forEach(borrow => {
        //each borrow is an array: [tokensBorrowed, cTokenAddress]
        //logger.debug(borrow[0], tokenData[borrow[1]].priceInEth.toString(), borrow[1])
        var borrowed = new bigNumber(borrow[0])
        var underlying = new bigNumber(state.tokenData[state.cTokenToUnderlying[borrow[1]]].priceInEth)
        var ethVal = borrowed.times(underlying)
        //console.log(ethVal.toString())
        if(ethVal.isGreaterThan(largestEthVal)){
          largestEthVal = ethVal
          largestTokenBalance = borrowed
          assetCTokenAddress = borrow[1]
        }
      })
      //logger.debug(largestTokenBalance, assetCTokenAddress, largestEthVal.toString())
      resolve([largestTokenBalance, assetCTokenAddress])
    })
    .catch(reject)
  })
}

getLargestCollateral = (address, state) => {
  return new Promise((resolve, reject) => {
    var promises = []
    state.cTokenAddresses.forEach(cTokenAddress => {
      promises.push(state.cTokenContracts[cTokenAddress].methods.balanceOfUnderlying(address).call().then(collateral => {
        return [collateral, cTokenAddress]
      }))
    })

    Promise.all(promises).then(collateralAssets => {
      var largestEthVal = new bigNumber(0)
      var largestTokenBalance
      var assetCTokenAddress
      collateralAssets.forEach(asset => {
        //each asset is an array: [collateralTokens, cTokenAddress]
        //logger.debug(asset[0], tokenData[asset[1]].priceInEth.toString(), asset[1])
        var bigNumAsset = new bigNumber(asset[0])
        var underlying = new bigNumber(state.tokenData[state.cTokenToUnderlying[asset[1]]].priceInEth)
        var ethVal = bigNumAsset.times(underlying)
        //console.log(ethVal.toString(), asset[1])
        if(ethVal.isGreaterThan(largestEthVal)){
          largestEthVal = ethVal
          largestTokenBalance = bigNumAsset
          assetCTokenAddress = asset[1]
        }
      })
      //logger.debug(largestTokenBalance, assetCTokenAddress, largestEthVal.toString())
      resolve([largestTokenBalance, assetCTokenAddress])
    })
    .catch(reject)
  })
}