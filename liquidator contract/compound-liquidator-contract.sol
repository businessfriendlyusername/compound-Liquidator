pragma solidity ^0.6.1;

import "./contracts/FlashLoanReceiverBase.sol";



contract CompoundLiquidator is flashloanReceiverBase {
    struct tokenData {
        address cToken;
        address uniswapExchange;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "only the owner can call this function");
        _;
    }

    modifier onlyInvoker(){
        require(msg.sender == invoker, "only the invoker can call this function");
        _;
    }

    mapping (address => tokenData) tokens;
    address invoker; //the account that can invoke liquidations
    address owner; //the account that can change admin settings and withdraw funds
    constructor(address invoker, address owner){
        this.invoker = invoker;
        this.owner = owner;
    }

    function changeInvoker(address newInvoker) public onlyOwner {
        invoker = newInvoker;
    }

    function changeOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }
    /*
        Params {
            repayToken: the address of the erc20 token we are repaying
            repayAmount: the atomic amount of the repay Token being repaid
            liquidatee: the address of the account we are liquidating
            collateralToken: the address of the erc20 token we are seizing
            blockNumber: the block in which this transaction is valid
        }
    */
    function liquidate(
        address repayToken,
        uint256 repayAmount,
        address liquidatee,
        address collateralToken,
        uint256 blockNumber) public onlyInvoker {

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Checks~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if(block.number != blockNumber)
            revert('wrong blockNumber');

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~END Checks~~~~~~~~~~~~~~~~~~~~~~~~~~

        //flashLoan()
        //liquidateBorrow()
        //redeemUnderlying()

        if(repayToken == "0xeeeeeeeee")
            buyEthOnUniswap();
        else if(collateralToken == "0xeeeeeeee")
            buyERCwithEthUniswap();
        else
            swapERCforERCUniswap();

        gasTokenOptimization();

    }

}