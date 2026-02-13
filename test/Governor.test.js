const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MyGovernor", function () {
  let token, governor;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GovernanceToken");
    token = await Token.deploy();
    await token.waitForDeployment();

    const Governor = await ethers.getContractFactory("MyGovernor");
    const tokenAddress = await token.getAddress();
    governor = await Governor.deploy(tokenAddress);
    await governor.waitForDeployment();

    // Mint tokens to addr1 and addr2
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.transfer(addr2.address, ethers.parseEther("100"));

    // Delegate votes
    await token.connect(addr1).delegate(addr1.address);
    await token.connect(addr2).delegate(addr2.address);
  });

  it("Should create a standard proposal and vote", async function () {
    try {
        console.log("Starting Standard Vote Test");
        const proposalDesc = "Proposal #1: Standard Vote";
        const transferCalldata = token.interface.encodeFunctionData("transfer", [owner.address, 1000]);
        
        const proposeParams = [
          [await token.getAddress()],
          [0],
          [transferCalldata],
          proposalDesc,
          0 // VotingType.Standard
        ];

        // Get ID first
        const proposalId = await governor.connect(addr1)["propose(address[],uint256[],bytes[],string,uint8)"].staticCall(...proposeParams);
        console.log("Proposal ID:", proposalId.toString());

        // Propose
        const tx = await governor.connect(addr1)["propose(address[],uint256[],bytes[],string,uint8)"](...proposeParams);
        await tx.wait();

        // Mine blocks
        await mine(10); 
        console.log("Advanced blocks");

        // Vote Standard
        await governor.connect(addr1).castVote(proposalId, 1); // For
        console.log("Voted Standard");

        const proposalVotes = await governor.proposalVotes(proposalId);
        console.log("Votes:", proposalVotes[1].toString());
        expect(proposalVotes[1]).to.equal(ethers.parseEther("100")); 
    } catch (error) {
        console.error(error);
        throw error;
    }
  });

  it("Should create a quadratic proposal and vote quadratically", async function () {
    try {
        console.log("Starting Quadratic Vote Test");
        const proposalDesc = "Proposal #2: Quadratic Vote";
        const transferCalldata = token.interface.encodeFunctionData("transfer", [owner.address, 1000]);

        const proposeParams = [
          [await token.getAddress()],
          [0],
          [transferCalldata],
          proposalDesc,
          1 // VotingType.Quadratic
        ];

        // Get ID
        const proposalId = await governor.connect(addr1)["propose(address[],uint256[],bytes[],string,uint8)"].staticCall(...proposeParams);

        // Propose
        await governor.connect(addr1)["propose(address[],uint256[],bytes[],string,uint8)"](...proposeParams);

        await mine(10);

        // Vote Quadratic
        const cost = ethers.parseEther("81");
        await token.connect(addr1).approve(await governor.getAddress(), cost);
        console.log("Approved tokens");

        await governor.connect(addr1).castVoteQuadratic(proposalId, 1, 9); // 9 votes
        console.log("Voted Quadratic");

        const proposalVotes = await governor.proposalVotes(proposalId);
        console.log("Votes:", proposalVotes[1].toString());
        expect(proposalVotes[1]).to.equal(ethers.parseEther("9")); 
        
        expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("19")); 
    } catch (error) {
        console.error(error);
        throw error;
    }
  });
});
