pragma solidity ^0.6.1;

abstract contract ILendingPool {
  function flashLoan(address _receiver, address _reserve, uint256 _amount, bytes memory _params) virtual public;
}