const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const token = await hre.ethers.deployContract("GovernanceToken");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("GovernanceToken deployed to:", tokenAddress);

  // Delegate votes to self
  await token.delegate(deployer.address);
  console.log("Delegated votes to deployer");

  const governor = await hre.ethers.deployContract("MyGovernor", [tokenAddress]);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("MyGovernor deployed to:", governorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
