pragma solidity ^0.6.1;

abstract contract ICERC20 {
  function liquidateBorrow(address borrower, uint amount, address cTokenCollateral) virtual public;
  function redeemUnderlying(uint redeemAmount) virtual public;
  function approve(address spender, uint256 value) virtual public;
}