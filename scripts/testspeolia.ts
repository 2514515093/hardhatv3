import { network  } from "hardhat"; 

const { ethers  } = await network.connect();

async function main() {
  const contract = await ethers.getContractAt(
    "NFTAuction",
    "0x374903888Cd5F3C97F931D4dB6441338f89AAEC5"
  );


  const result = await contract.test(); // 你的 view 函数
  console.log("=========================",result.toString());

  //升级合约
   const newImpl = "0xa0D6a1Be84483b4308A5Cf4124d5bC50A8Dda7C8";
   await contract.upgradeToAndCall(newImpl,"0x");
   const resultv2 = await contract.test(); // 你的 view 函数
   console.log("=========================",resultv2.toString());

   // ETH / USD（tokenAddress 用 address(0)）
//   const tx1 = await contract.setPriceFeed(
//     ethers.ZeroAddress,
//     "0x694AA1769357215DE4FAC081bf1f309aDC325306"
//   );
//   await tx1.wait();
//   console.log("ETH/USD price feed set");

//   // USDC / USD
//   const tx2 = await contract.setPriceFeed(
//     "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
//     "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"
//   );
//   await tx2.wait();
//   console.log("USDC/USD price feed set");

  /* ========= 3. 读取价格 ========= */

  const ethPrice = await contract.getChainlinkDataFeedLatestAnswer(
    ethers.ZeroAddress
  );
  console.log("ETH/USD raw:", ethPrice.toString());
  console.log(
    "ETH/USD:",
    Number(ethPrice) / 1e8
  );

  const usdcPrice = await contract.getChainlinkDataFeedLatestAnswer(
    "0x07865c6e87b9f70255377e024ace6630c1eaa37f"
  );
  console.log("USDC/USD raw:", usdcPrice.toString());
  console.log(
    "USDC/USD:",
    Number(usdcPrice) / 1e8
  );
    const erc721 = await ethers.getContractAt(
    "MyERC721",
    "0x29B3C0062DF7AB7e46111002a364BF3a61F1b397"
  );
    // minit 10 个nft
        // for (let i = 10; i < 20; i++) {
        // await erc721.mint("0x5dA10147Bce2004355547cCcAa8dCAc0683Ad7af", i + 1);
        // }
        // await erc721.approve("0x5dA10147Bce2004355547cCcAa8dCAc0683Ad7af", 11);
        // await erc721.mint("0x5dA10147Bce2004355547cCcAa8dCAc0683Ad7af", 21);
        // 1️⃣ 查看 tokenId 单独授权
        const approved = await erc721.getApproved(21);
        console.log(`NFT 21 is approved for:`, approved);
        const nums = await erc721.totalSupply();
        console.log("nums",nums);
        const [defaultSigner] = await ethers.getSigners();

        console.log("default signer:", defaultSigner.address);
        console.log("proxy owner:", await contract.admin());
        

   //创建拍卖
        await contract.createAuction(
        10,
        ethers.parseEther("0.00001"),
        "0x29B3C0062DF7AB7e46111002a364BF3a61F1b397",
        21  
      );
      const auctionid = contract.auctions(0);
      console.log("创建拍卖成功：",auctionid);

       const provider = ethers.provider;
       const buyer = new ethers.Wallet(
       "==",
       provider
       );
      //参与拍卖
      await contract.connect(buyer).buyerpr(0,0,ethers.ZeroAddress,
      { value: ethers.parseEther("0.002") }  
      );
   

       // 结束拍卖
      await new Promise((resolve)=>setTimeout(resolve,1000*10))
      console.log("结束拍卖");
      await contract.endAuction(0);

        // 验证结果
      const auctionResult=await contract.auctions(0)
      console.log("结束拍卖后读取拍卖成功：：", auctionResult);

}

main();