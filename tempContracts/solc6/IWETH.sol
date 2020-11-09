pragma solidity ^0.6.1;

abstract contract IWETH {
  function withdraw(uint256) virtual public;
  function deposit() virtual public payable;
}