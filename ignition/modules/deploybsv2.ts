import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
/* ========== 2. 部署 NFTAuctionv2 实现合约 ========== */
  const NFTAuction = await ethers.getContractFactory("NFTAuctionV2");
  const impl = await NFTAuction.deploy();
  await impl.waitForDeployment();

  const implAddr = await impl.getAddress();
  console.log("NFTAuctionv2 impl deployed at:", implAddr);
}


main().catch((err) => {
  console.error(err);
  process.exit(1);
});