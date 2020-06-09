pragma solidity ^0.6.1;

abstract contract IUniswap {
  function liquidateBorrow(address borrower, uint amount, address cTokenCollateral) virtual public;
  function ethToTokenSwapOutput(uint256 tokens_bought, uint256 deadline) virtual public;
  function tokenToEthSwapOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline) virtual public;
  function tokenToTokenSwapOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address outputToken) virtual public;
}