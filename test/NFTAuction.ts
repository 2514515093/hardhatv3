import { expect } from "chai";
import { network  } from "hardhat"; 

const { ethers  } = await network.connect();

describe("MyERC721", function () {
    it("Test myerc721 ", async function () {
        const [signer, buyer] = await ethers.getSigners();
        const myerc721 = await ethers.deployContract("MyERC721");
        await myerc721.waitForDeployment();
        const MYERC721Address=await myerc721.getAddress()
        console.log("MYERC721Address",MYERC721Address);
        // minit 10 个nft
        for (let i = 0; i < 10; i++) {
        await myerc721.mint(signer.address, i + 1);
        }
        const nums = await myerc721.totalSupply();
        console.log("nums",nums);
        const tokenId = 1;

        //部署拍卖合约
        const nftauction = await ethers.deployContract("NFTAuction");
        await nftauction.waitForDeployment();
        const ERC1967Proxy = await ethers.getContractFactory("MYERC1967Proxy");
        const initializeData = nftauction.interface.encodeFunctionData("initialize");

        const proxy = await ERC1967Proxy.deploy(
        await nftauction.getAddress(),
        initializeData
        );
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress(); 
        const auction = await ethers.getContractAt(
        "NFTAuction",
        proxyAddress
        );
        console.log("Proxy deployed at:", auction.getAddress());
        const version = await auction.test();
        console.log("版本===",version);


        const nftauctionTwo = await ethers.deployContract("NFTAuctionV2");
        await nftauctionTwo.waitForDeployment();
        // 3. 调用 upgradeTo
        await auction.connect(signer).upgradeToAndCall(await nftauctionTwo.getAddress(),"0x");

        const version2 = await auction.test();
        console.log("版本===",version2);

        // await auction.connect(signer).initialize();
        await myerc721.connect(signer).setApprovalForAll( auction.getAddress(), true);

        //创建拍卖
        await auction.connect(signer).createAuction(
        10,
        ethers.parseEther("0.00001"),
        MYERC721Address,
        tokenId    
      );
      const auctionid = auction.auctions(0);
      console.log("创建拍卖成功：",auctionid);

      //参与拍卖
      await auction.connect(buyer).buyerpr(0,0,ethers.ZeroAddress,
      { value: ethers.parseEther("0.02") }  
      );
   

       // 结束拍卖
      await new Promise((resolve)=>setTimeout(resolve,1000*10))
      console.log("结束拍卖");
      await auction.connect(signer).endAuction(0);

        // 验证结果
      const auctionResult=await auction.auctions(0)
      console.log("结束拍卖后读取拍卖成功：：", auctionResult);
      expect(auctionResult.highestBidder).to.equal(buyer.address); 
      expect(auctionResult.hightestPrice).to.equal(ethers.parseEther("0.02")); 
      // 验证nft所有权
      const owner =await myerc721.ownerOf(tokenId);
      console.log("owner::", owner);
      expect(owner).to.equal(buyer.address);

    })
    
});