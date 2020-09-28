pragma solidity ^0.6.6;

import "./UniswapV2Library.sol";
import "./IERC20.sol";
import "./IUniswapV2Pair.sol";

contract TestRouter {
  address uniswapFactory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
  function swap(address address0, address address1, uint _amount0Out, uint _amount1Out) public returns (uint, uint, uint){
    address pair = UniswapV2Library.pairFor(uniswapFactory, address0, address1);
    (address first, address second) = UniswapV2Library.sortTokens(address0, address1);
    (uint reserve0, uint reserve1) = UniswapV2Library.getReserves(uniswapFactory, first, second);
    uint amount0Out; uint amount1Out;
    if(address0 != first){
      amount0Out = _amount1Out;
      amount1Out = _amount0Out;
    }
    else{
      amount0Out = _amount0Out;
      amount1Out = _amount1Out;
    }
    uint amountIn;
    if(amount0Out == 0){
      amountIn = UniswapV2Library.getAmountIn(amount1Out, reserve0, reserve1);
      IERC20(first).transferFrom(msg.sender, pair, amountIn);
    }
    else{
      amountIn = UniswapV2Library.getAmountIn(amount0Out, reserve1, reserve0);
      IERC20(second).transferFrom(msg.sender, pair, amountIn);
    }
    IUniswapV2Pair(pair).swap(amount0Out, amount1Out, msg.sender, new bytes(0));
    return (amountIn, IERC20(first).balanceOf(msg.sender), IERC20(second).balanceOf(msg.sender));
  }
}