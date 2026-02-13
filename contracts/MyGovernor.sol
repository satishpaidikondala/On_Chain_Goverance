// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    using SafeERC20 for IERC20;

    enum VotingType { Standard, Quadratic }

    mapping(uint256 => VotingType) public proposalVotingType;

    constructor(IVotes _token)
        Governor("MyGovernor")
        GovernorSettings(1 /* 1 block */, 50400 /* 1 week */, 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    // Custom Propose function to include VotingType
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        VotingType _votingType
    ) public returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalVotingType[proposalId] = _votingType;
        return proposalId;
    }

    // Custom castVote with specific support for QV
    function castVoteQuadratic(uint256 proposalId, uint8 support, uint256 votes) public returns (uint256) {
        require(proposalVotingType[proposalId] == VotingType.Quadratic, "Not a quadratic proposal");
        
        // Cost = votes^2 * 1e18 (assuming 'votes' is the integer weight unit)
        uint256 cost = votes * votes * 10**18;
        uint256 weight = votes * 10**18;

        IERC20 token = IERC20(address(token()));
        // Transfer cost from user to this contract (or burn address)
        token.transferFrom(msg.sender, address(0xdEaD), cost);

        return _castVoteQuadratic(proposalId, msg.sender, support, weight);
    }
    
    function _castVoteQuadratic(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");

        // _countVote is internal in counting module.
        _countVote(proposalId, account, support, weight, ""); 
        
        emit VoteCast(account, proposalId, support, weight, "");
        return weight;
    }
    
    // Override _castVote to prevent standard voting on QV proposals
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal override returns (uint256) {
        if (proposalVotingType[proposalId] == VotingType.Quadratic) {
            revert("Use castVoteQuadratic for this proposal");
        }
        return super._castVote(proposalId, account, support, reason, params);
    }
}
