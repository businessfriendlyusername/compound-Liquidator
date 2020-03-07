pragma solidity ^0.6.1;

abstract contract ICEther {
  function liquidateBorrow(address borrower, address cTokenCollateral) virtual public payable;
  function redeemUnderlying(uint redeemAmount) virtual public;
}