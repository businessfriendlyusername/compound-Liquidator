pragma solidity ^0.6.1;

import "./imports/aave/mocks/tokens/MintableERC20.sol";
import "./imports/ILendingPool.sol";
import "./imports/aave/flashloan/base/FlashLoanReceiverBase.sol";
import "./imports/aave/configuration/LendingPoolAddressesProvider.sol";
import "./imports/IERC20.sol";
import "@openzeppelin/math/SafeMath.sol";



contract CompoundLiquidator is flashloanReceiverBase {
    using SafeMath for uint256;

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
    address private lendingPool = 0x398eC7346DcD622eDc5ae82352F02bE94C62d119;
    mapping (address => tokenData) tokenMap;//ERC20 => tokenData
    address invoker; //the account that can invoke liquidations
    address owner; //the account that can change admin settings and withdraw funds
    address ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    constructor(address invoker, address owner, LendingPoolAddressesProvider provider)
        FlashLoanReceiverBase(provider)
        public {
            uint256 MAX_UINT = 2**256 - 1;
            this.invoker = invoker;
            this.owner = owner;
            tokenMap[address(0x0D8775F648430679A709E98d2b0Cb6250d2887EF)] = tokenData({cToken:address(0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E), uniswapExchange:address(0x2E642b8D59B45a1D8c5aEf716A84FF44ea665914)});//BAT
            tokenMap[address(0x6B175474E89094C44Da98b954EedeAC495271d0F)] = tokenData({cToken:address(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643), uniswapExchange:address(0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667)});//DAI
            tokenMap[address(0xE41d2489571d322189246DaFA5ebDe1F4699F498)] = tokenData({cToken:address(0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407), uniswapExchange:address(0xaE76c84C9262Cdb9abc0C2c8888e62Db8E22A0bF)});//ZRX
            tokenMap[address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)] = tokenData({cToken:address(0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5), uniswapExchange:address(0)});//ETH
            tokenMap[address(0x1985365e9f78359a9B6AD760e32412f4a445E862)] = tokenData({cToken:address(0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1), uniswapExchange:address(0x48B04d2A05B6B604d8d5223Fd1984f191DED51af)});//REP
            tokenMap[address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)] = tokenData({cToken:address(0x39AA39c021dfbaE8faC545936693aC917d5E7563), uniswapExchange:address(0x97deC872013f6B5fB443861090ad931542878126)});//USDC
            tokenMap[address(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599)] = tokenData({cToken:address(0xC11b1268C1A384e55C48c2391d8d480264A3A7F4), uniswapExchange:address(0x4d2f5cFbA55AE412221182D8475bC85799A5644b)});//WBTC

            address[6] memory tokens = [//approve spending for all of these tokens
                0x0D8775F648430679A709E98d2b0Cb6250d2887EF,
                0x6B175474E89094C44Da98b954EedeAC495271d0F,
                0xE41d2489571d322189246DaFA5ebDe1F4699F498,
                0x1985365e9f78359a9B6AD760e32412f4a445E862,
                0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
                0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
            ];
            for(uint16 i = 0; i < tokens.length; i++) {
                IERC20(tokens[i]).approve(tokenMap[tokens[i]].cToken, MAX_UINT);
                IERC20(tokens[i]).approve(tokenMap[tokens[i]].uniswapExchange, MAX_UINT);
            }
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

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Pre-Checks~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if(block.number != blockNumber)
            revert('wrong blockNumber');
        if(repayToken == ETH){
            uint256 repayBalance = this.balance();
        }
        else{
            uint256 repayBalance = IERC20(repayToken).balanceOf(address(this));
        }


        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~END Pre-Checks~~~~~~~~~~~~~~~~~~~~~~~~~~
        //flashLoan()~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        bytes memory params;
        params.push(repayToken, repayAmount, liquidatee, collateralToken);
        
        ILendingPool(lendingPool).flashLoan(address(this), repayToken, repayAmount, params);

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~Post-Checks~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if(repayBalance < IERC20(repayToken).balanceOf(address(this)))
            revert('lost money on liquidate');
        //~~~~~~~~~~~~~~~~~~~~~~~~~~END Post-Checks~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    }

    function executeOperation(
        address reserve,
        uint256 amount,
        uint256 fee,
        bytes memory params) external {
            
        require(amount <= getBalanceInternal(address(this), reserve), "Invalid balance for the contract");
        //~~~~~~~~~~~~~~~~~BEGIN ACTION WITH FLASH LOAN~~~~~~~~~~~~~~~~~~~~
        
        address repayToken = params[0];
        uint256 repayAmount = params[1];
        address liquidatee = params[2];
        address collateralToken = params[3];

        //liquidate the underwater account~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if(repayToken == ETH){
            cTokenInterface(tokenMap[repayToken].cToken).liquidateBorrow.value(repayAmount)(liquidatee, collateralToken);
        }
        else{
            cTokenInterface(tokenMap[repayToken].cToken).liquidateBorrow(liquidatee, repayAmount, collateralToken);
        }
        //end liquidate~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


        //redeem seized cTokens for underlying tokens~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        cTokenInterface(tokenMap[repayToken].cToken).redeem(IERC20(tokenMap[collateralToken]).balanceOf(address(this)));
        //end redeem~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        //swap seized token for enough of the borrowed token to repay the flash loan
        if(repayToken == ETH)
            buyEthOnUniswap();
        else if(collateralToken == ETH)
            buyERCwithEthUniswap();
        else
            swapERCforERCUniswap();

        gasTokenOptimization();




        //~~~~~~~~~~~~~~~~~~END ACTION WITH FLASH LOAN~~~~~~~~~~~~~~~~~~~~~
        transferFundsBackToPoolInternal(_reserve, _amount.add(_fee));
    }
}