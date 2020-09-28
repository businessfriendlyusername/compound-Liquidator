pragma solidity ^0.6.6;

import "./IERC20.sol";
import "./ICERC20.sol";
import "./ICEther.sol";
import "./ICToken.sol";
import "./IWETH.sol";
import "./SafeMath.sol";
import "./IUniswapV2Callee.sol";
import "./IUniswapV2Pair.sol";
import "./UniswapV2Library.sol";


contract CompoundLiquidator is IUniswapV2Callee {
  using SafeMath for uint256;

  modifier onlyOwner(){
    require(msg.sender == owner, "only the owner can call this function");
    _;
  }

  modifier onlyInvoker(){//must use tx.origin because invoker calls uniswap which calls this contract
    require(tx.origin == invoker, "only the invoker can call this function");
    _;
  }

  mapping (address => address) tokenToCToken;//ERC20 => CERC20
  address invoker; //the account that can invoke liquidations
  address owner; //the account that can change admin settings and withdraw funds
  address payable benefactor; //the account that recieves the withdrawn funds
  address uniswapFactory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

  constructor(address inv, address own, address payable ben) public {
    uint256 MAX_UINT = 2**256 - 1;
    invoker = inv;
    owner = own;
    benefactor = ben;
    tokenToCToken[address(0x0D8775F648430679A709E98d2b0Cb6250d2887EF)] = address(0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E);//BAT
    tokenToCToken[address(0x6B175474E89094C44Da98b954EedeAC495271d0F)] = address(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643);//DAI
    tokenToCToken[address(0xE41d2489571d322189246DaFA5ebDe1F4699F498)] = address(0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407);//ZRX
    tokenToCToken[address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)] = address(0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5);//ETH
    tokenToCToken[address(0x1985365e9f78359a9B6AD760e32412f4a445E862)] = address(0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1);//REP
    tokenToCToken[address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)] = address(0x39AA39c021dfbaE8faC545936693aC917d5E7563);//USDC
    tokenToCToken[address(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599)] = address(0xC11b1268C1A384e55C48c2391d8d480264A3A7F4);//WBTC
    tokenToCToken[address(0xdAC17F958D2ee523a2206206994597C13D831ec7)] = address(0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9);//USDT



    address payable[2][20] memory tokens = [
      [0x0D8775F648430679A709E98d2b0Cb6250d2887EF, 0xB6909B960DbbE7392D405429eB2b3649752b4838],
      
      [0x6B175474E89094C44Da98b954EedeAC495271d0F, 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11],
      [0x6B175474E89094C44Da98b954EedeAC495271d0F, 0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5],
      [0x6B175474E89094C44Da98b954EedeAC495271d0F, 0x231B7589426Ffe1b75405526fC32aC09D44364c4],
      
      [0xE41d2489571d322189246DaFA5ebDe1F4699F498, 0x231B7589426Ffe1b75405526fC32aC09D44364c4],
      //WETH
      [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11],
      [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0xec2D2240D02A8cf63C3fA0B7d2C5a3169a319496],
      [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc],
      [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0xBb2b8038a1640196FbE3e38816F3e67Cba72D940],
      [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0xB6909B960DbbE7392D405429eB2b3649752b4838],
      [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0xc6F348dd3B91a56D117ec0071C1e9b83C0996De4],
      [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852],


      [0x1985365e9f78359a9B6AD760e32412f4a445E862, 0xec2D2240D02A8cf63C3fA0B7d2C5a3169a319496],

      [0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, 0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc],
      [0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, 0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f],
      [0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, 0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5],

      [0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599, 0xBb2b8038a1640196FbE3e38816F3e67Cba72D940],
      [0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599, 0x231B7589426Ffe1b75405526fC32aC09D44364c4],

      [0xdAC17F958D2ee523a2206206994597C13D831ec7, 0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f],
      [0xdAC17F958D2ee523a2206206994597C13D831ec7, 0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852]
    ];
    address payable[8] memory CTokens = [
      0x0D8775F648430679A709E98d2b0Cb6250d2887EF,
      0x6B175474E89094C44Da98b954EedeAC495271d0F,
      0xE41d2489571d322189246DaFA5ebDe1F4699F498,
      0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
      0x1985365e9f78359a9B6AD760e32412f4a445E862,
      0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
      0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599,
      0xdAC17F958D2ee523a2206206994597C13D831ec7
    ];

    for(uint256 i = 0; i < tokens.length; i++) {
      IERC20(tokens[i][0]).approve(tokens[i][1], MAX_UINT);
    }
    for(uint256 j = 0; j < CTokens.length; j++) {
      IERC20(CTokens[j]).approve(tokenToCToken[CTokens[j]], MAX_UINT);
    }
  }


  function setInvoker(address newInvoker) public onlyOwner {
    invoker = newInvoker;
  }

  function setOwner(address newOwner) public onlyOwner {
    owner = newOwner;
  }

  function setBenefactor(address payable newBenefactor) public onlyOwner {
    benefactor = newBenefactor;
  }

  function withdrawETH() public onlyOwner {
    benefactor.transfer(address(this).balance);
  }

  function withdrawToken(address token) public onlyOwner {

  }

  //to add new tokens
  function approveAddress(address token, address addressToApprove) public onlyOwner {
    IERC20(token).approve(addressToApprove, 115792089237316195423570985008687907853269984665640564039457584007913129639935);
  }

  function uniswapV2Call(
    address sender,
    uint amount0,
    uint amount1,
    bytes calldata data
  ) external override onlyInvoker{
    //decode calldata
    (address liquidatee, address repayToken, address seizeToken, uint maxUniswapPayment, address[] memory route, uint blockNumber) = abi.decode(data, (address, address, address, uint, address[], uint));
    
    // //note balances beginning transaction
    // uint repayBalance;//we may not need to check repayBalance
    // uint seizeBalance;
    // if(repayToken == address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)){//if the repay token is ETH
    //   repayBalance = address(this).balance;
    // }
    // else{
    //   repayBalance = IERC20(repayToken).balanceOf(address(this));
    // }

    // if(seizeToken == address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)){//if the seize token is ETH
    //   seizeBalance = address(this).balance;
    // }
    // else{
    //   seizeBalance = IERC20(seizeToken).balanceOf(address(this));
    // }

    assert(block.number == blockNumber);
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~END PRE-CRITICAL OP~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //Swap accross route to repay Token
    uint amountIn = amount0 > amount1 ? amount0 : amount1;//assuming that amount1 and 0 are the parameters for the first swap
    uint[] memory amountsOut = UniswapV2Library.getAmountsOut(uniswapFactory, amountIn, route);
    uint amount0Out = 0;
    uint amount1Out = 0;
    for(uint8 i = 0; i < route.length - 1; i++){
      (address token0,) = UniswapV2Library.sortTokens(route[i], route[i+1]);
      if(token0 == route[i]){
        amount0Out = amountsOut[i];
        amount1Out = 0;
      }
      else{
        amount1Out = amountsOut[i];
        amount0Out = 0;
      }
      IUniswapV2Pair(UniswapV2Library.pairFor(uniswapFactory, route[i], route[i+1])).swap(amount0Out, amount1Out, address(this), "");
    }
    uint repayAmount = amountsOut[amountsOut.length - 1];

    //liquidate
    if(repayToken == address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)){//if the repay token is ETH
      IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2).withdraw(repayAmount);//swap WETH for ETH
      ICEther(tokenToCToken[repayToken]).liquidateBorrow.value(repayAmount)(liquidatee, seizeToken);//send liquidate transaction to the repayToken's respective CToken
    }
    else{
      ICERC20(tokenToCToken[repayToken]).liquidateBorrow(liquidatee, repayAmount, seizeToken);
    }

    //repay
    (address tokenA,) = UniswapV2Library.sortTokens(seizeToken, route[0]);
    uint reserveIn;
    uint reserveOut;
    if(tokenA == seizeToken){
      (reserveIn, reserveOut) = UniswapV2Library.getReserves(uniswapFactory, seizeToken, route[0]);
    }
    else{
      (reserveOut, reserveIn) = UniswapV2Library.getReserves(uniswapFactory, seizeToken, route[0]);
    }
    uint uniswapRepay = UniswapV2Library.getAmountIn(amountIn, reserveIn, reserveOut);

    //redeem and repay
    ICToken(tokenToCToken[seizeToken]).redeemUnderlying(uniswapRepay);
    assert(IERC20(tokenToCToken[seizeToken]).transfer(msg.sender, uniswapRepay));

  }
}