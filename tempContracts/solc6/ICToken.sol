pragma solidity ^0.6.1;

abstract contract ICToken {
  function redeemUnderlying(uint redeemAmount) virtual public;
}