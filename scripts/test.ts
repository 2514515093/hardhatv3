import { network  } from "hardhat"; 

const { ethers  } = await network.connect();

async function main() {

   const erc721 = await ethers.getContractAt(
    "MyERC721",
    "0x29B3C0062DF7AB7e46111002a364BF3a61F1b397"
  );
//    // 获取总量
//   const total = await erc721.totalSupply();
//   console.log("Total NFTs:", total.toString());

//   const tokenIds: number[] = [];

//   // 遍历每个 tokenId
//   for (let i = 0; i < Number(total); i++) {
//     const tokenId = await erc721.tokenByIndex(i); // ERC721Enumerable 方法
//     tokenIds.push(Number(tokenId));
//   }
//   console.log("所有 tokenIds:", tokenIds);
  const approvedAddress = await erc721.getApproved(21);
//   await erc721.approve("0x5dA10147Bce2004355547cCcAa8dCAc0683Ad7af", 21);
   const approved = await erc721.getApproved(21);
   console.log(`NFT 21 is approved for:`, approved);
  console.log(`nNFT 21 is approved for:`, approvedAddress);

}
  main();