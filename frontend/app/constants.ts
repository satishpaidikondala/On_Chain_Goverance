import MyGovernorABI from './abi/MyGovernor.json';
import GovernanceTokenABI from './abi/GovernanceToken.json';

// START: Add your deployed addresses here after deployment logs
export const GOVERNOR_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // from deployment log
export const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";    // from deployment log

export const governorABI = MyGovernorABI.abi;
export const tokenABI = GovernanceTokenABI.abi;
