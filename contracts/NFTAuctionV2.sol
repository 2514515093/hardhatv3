// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract NFTAuctionV2 is Initializable,UUPSUpgradeable{
   

    // 状态变量
    mapping(uint256=>Auction) public auctions;
    // 下一个拍卖id
    uint256 public nextAuctionId;
    // 管理员地址
    address public admin;

    // 货币之间的汇率
    mapping(address => AggregatorV3Interface) public priceFeeds;

       struct  Auction{
        //卖家
        address seller;
        //最低价
        uint256 minprice;
        //开始时间
        uint256 startTime;
        //拍卖持续时间
        uint256 cxTime;
        // 是否结束
        bool isend;
        // 买家
        address highestBidder; 
        // 最高价
        uint256 hightestPrice;
        // NFT合约地址
        address nftContract;
        // // tokenid
        uint256 tokenId;
        // // 参与竞价的资产类型 0x 地址表示eth，其他地址表示erc20
        address tokenAddress;

       }

    error BidTooLow(uint256 payValue, uint256 highestBidValue);
       
    function initialize() public initializer {
        admin = msg.sender;
    }

    function test() external view returns(string memory){
        return "v2";
    }




    function setPriceFeed(address tokenAddress,address _priceFeed) public {
        priceFeeds[tokenAddress] = AggregatorV3Interface(_priceFeed);
    }

    // ETH -> USD => 1766 7512 1800 => 1766.75121800
    // USDC -> USD => 9999 4000 => 0.99994000
    function getChainlinkDataFeedLatestAnswer( address tokenAddress) public view returns (int) {
        AggregatorV3Interface priceFeed = priceFeeds[tokenAddress];
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();

        return answer;
    }

        function ngetChainlinkDataFeedLatestAnswer(uint256 mount) public view returns (int) {
        
        return int256(mount);
    }


      // 创建拍卖
    function createAuction(uint256 _duration,uint256 _startPrice,address _nftAddress,uint256 _tokenId) public{  
        require(admin==msg.sender,"only admin start");
        require(_startPrice>0,"startprice > 0");
        // 拍卖持续时间不得超时
        require(_duration>=10,"ODuration must be greater than 10s");
        // 转移NFT到合约
        IERC721(_nftAddress).safeTransferFrom(msg.sender, address(this), _tokenId);
          // 创建拍卖
        auctions[nextAuctionId] = Auction({
            seller: msg.sender,
            cxTime: _duration,
            minprice: _startPrice,
            isend: false,
            highestBidder: address(0),
            hightestPrice: 0.0,
            startTime: block.timestamp,
            nftContract: _nftAddress,
            tokenId: _tokenId,
            tokenAddress: address(0)
        });
        nextAuctionId++;

    }


    //买家参与
    function buyerpr(uint256 _auctionID,uint256 amount,address _tokenAddress) external payable {
        
        // 根据拍卖id查找拍卖
        Auction storage auction = auctions[_auctionID];
        // 判断拍卖是否结束（状态结束以及是否超时）
        require(!auction.isend && auction.startTime + auction.cxTime >block.timestamp,"Auction has ended");


        // 判断出价是否超过当前最高价(并且处理不同资产的价值 )
        uint payValue;
        if (_tokenAddress != address(0)) {
            // 处理 ERC20
            payValue = amount * uint(getChainlinkDataFeedLatestAnswer(_tokenAddress));
            require(1==1,"erc20");
        } else {
            // 处理 ETH
            amount = msg.value;
            payValue = amount * uint(getChainlinkDataFeedLatestAnswer(address(0)));
            
        }
        uint startPriceValue = auction.minprice*uint(getChainlinkDataFeedLatestAnswer(auction.tokenAddress));
        uint highestBidValue = auction.hightestPrice *uint(getChainlinkDataFeedLatestAnswer(auction.tokenAddress));
        require(payValue >= startPriceValue && payValue > highestBidValue,"Bid must be higher than the current highest bid");

        // 转移erc20到合约(upgreate)
        if (_tokenAddress != address(0)) {
            // 处理 ERC20
            IERC20(_tokenAddress).transferFrom(msg.sender, address(this), amount);
        } 
        // else {
        //     payable(address(this)).transfer(msg.value);
        // }


        // 退还之前最高价
        if (auction.hightestPrice > 0) {
            if (_tokenAddress == address(0)) {
                payable(auction.highestBidder).transfer(auction.hightestPrice);
            }else{
                IERC20(auction.tokenAddress).transfer(auction.highestBidder,auction.hightestPrice);
            }
        }
        

        // 更新最新的
        auction.tokenAddress = _tokenAddress;
        auction.hightestPrice = amount;
        auction.highestBidder = msg.sender;
    }

        // 结束拍卖
    function endAuction(uint256 _auctionID) external{
        // 根据拍卖id查找拍卖
        Auction storage auction = auctions[_auctionID];
        // 判断拍卖是否结束（状态结束以及是否超时）
        require(!auction.isend && auction.startTime+ auction.cxTime<=block.timestamp,"Auction has ended");
        // 转移NFT到最高出价者
        IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);

        // 转移剩余的资金到卖家
        // payable(address(this)).transfer(address(this).balance);
        //如果是ERC20，则转移REC20资产，如果是EHT，则转移合约中的资金
        if (auction.tokenAddress != address(0)) {
            IERC20(auction.tokenAddress).transfer(auction.seller,auction.hightestPrice);
        }else{
            payable(auction.seller).transfer(address(this).balance);
        }


        // 修改状态
        auction.isend = true;

    } 

       // 只有管理员可以升级合约
    function _authorizeUpgrade(address newImplementation) internal override view {
        // 只有管理员可以升级合约
        require(msg.sender == admin, "Only admin can upgrade");
    
    }



    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

}