import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(
    await ethers.provider.getBalance(deployer.address)
  ));

  /* ========== 1. 部署 MyERC721 ========== */
  const MyERC721 = await ethers.getContractFactory("MyERC721");
  const myerc721 = await MyERC721.deploy();
  await myerc721.waitForDeployment();

  const myerc721Addr = await myerc721.getAddress();
  console.log("MyERC721 deployed at:", myerc721Addr);

  /* ========== 2. 部署 NFTAuction 实现合约 ========== */
  const NFTAuction = await ethers.getContractFactory("NFTAuction");
  const impl = await NFTAuction.deploy();
  await impl.waitForDeployment();

  const implAddr = await impl.getAddress();
  console.log("NFTAuction impl deployed at:", implAddr);

  /* ========== 3. 编码 initialize ========== */
  const initData = NFTAuction.interface.encodeFunctionData(
    "initialize",
    []
  );

  /* ========== 4. 部署 ERC1967 Proxy ========== */
  const Proxy = await ethers.getContractFactory("MYERC1967Proxy");
  const proxy = await Proxy.deploy(
    implAddr,
    initData
  );
  await proxy.waitForDeployment();

  const proxyAddr = await proxy.getAddress();
  console.log("NFTAuction Proxy deployed at:", proxyAddr);

  const auction = await ethers.getContractAt(
    "NFTAuction",
    proxyAddr
  );

  const version = await auction.test();
  console.log("Auction version:", version);

  console.log("deploy success");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
