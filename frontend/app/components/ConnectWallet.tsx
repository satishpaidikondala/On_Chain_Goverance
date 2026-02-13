'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface ConnectWalletProps {
  setProvider: (provider: ethers.BrowserProvider) => void;
  setSigner: (signer: ethers.JsonRpcSigner) => void;
  setAddress: (address: string) => void;
}

export default function ConnectWallet({ setProvider, setSigner, setAddress }: ConnectWalletProps) {
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setAddress(address);
        setCurrentAddress(address);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setError("Please install MetaMask!");
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <button 
        data-testid="connect-wallet-button"
        onClick={connect}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
      >
        {currentAddress ? 'Connected' : 'Connect Wallet'}
      </button>
      {currentAddress && <span data-testid="user-address" className="text-sm text-gray-400">{currentAddress}</span>}
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}
