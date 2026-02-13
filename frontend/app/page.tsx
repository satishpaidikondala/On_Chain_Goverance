'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import ConnectWallet from './components/ConnectWallet';
import { GOVERNOR_ADDRESS, TOKEN_ADDRESS, governorABI, tokenABI } from './constants';

const STATE_LABELS: Record<number, string> = {
  0: 'Pending', 1: 'Active', 2: 'Canceled', 3: 'Defeated',
  4: 'Succeeded', 5: 'Queued', 6: 'Expired', 7: 'Executed'
};
const STATE_COLORS: Record<number, string> = {
  0: 'bg-yellow-900 text-yellow-300',
  1: 'bg-green-900 text-green-300',
  2: 'bg-gray-700 text-gray-300',
  3: 'bg-red-900 text-red-300',
  4: 'bg-blue-900 text-blue-300',
  5: 'bg-indigo-900 text-indigo-300',
  6: 'bg-gray-900 text-gray-400',
  7: 'bg-emerald-900 text-emerald-300',
};

interface Proposal {
  id: string;
  description: string;
  state: number;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  votingType: number;
}

function VotingSection({ proposalId, governor, token, refresh, votingType }: {
  proposalId: string; governor: ethers.Contract; token: ethers.Contract;
  refresh: () => void; votingType: number;
}) {
  const [qvVotes, setQvVotes] = useState<string>("3");
  const [loading, setLoading] = useState(false);

  const castVote = async (support: number) => {
    try {
      setLoading(true);
      if (votingType === 1) {
        const numVotes = parseInt(qvVotes);
        const cost = ethers.parseEther((numVotes * numVotes).toString());
        const approveTx = await token.approve(GOVERNOR_ADDRESS, cost);
        await approveTx.wait();
        const tx = await governor.castVoteQuadratic(proposalId, support, numVotes);
        await tx.wait();
      } else {
        const tx = await governor.castVote(proposalId, support);
        await tx.wait();
      }
      alert("Vote cast successfully!");
      refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Vote failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {votingType === 1 && (
        <div className="mb-2">
          <label className="text-sm text-gray-400 mr-2">Votes (cost = votes²):</label>
          <input type="number" min="1" value={qvVotes} onChange={(e) => setQvVotes(e.target.value)}
            className="w-20 p-1 rounded bg-gray-700 border border-gray-600 text-white text-sm" />
        </div>
      )}
      <div className="flex gap-2">
        <button data-testid="vote-for-button" onClick={() => castVote(1)} disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-white text-sm font-medium transition active:scale-95 disabled:opacity-50">For</button>
        <button data-testid="vote-against-button" onClick={() => castVote(0)} disabled={loading}
          className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-white text-sm font-medium transition active:scale-95 disabled:opacity-50">Against</button>
        <button data-testid="vote-abstain-button" onClick={() => castVote(2)} disabled={loading}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded text-white text-sm font-medium transition active:scale-95 disabled:opacity-50">Abstain</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string>('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [description, setDescription] = useState("");
  const [voteType, setVoteType] = useState(0);

  const governor = signer ? new ethers.Contract(GOVERNOR_ADDRESS, governorABI, signer) : null;
  const token = signer ? new ethers.Contract(TOKEN_ADDRESS, tokenABI, signer) : null;

  const fetchProposals = useCallback(async () => {
    if (!provider || !governor) return;
    try {
      const governorRead = new ethers.Contract(GOVERNOR_ADDRESS, governorABI, provider);
      const filter = governorRead.filters.ProposalCreated();
      const events = await governorRead.queryFilter(filter, 0, 'latest');
      
      const items: Proposal[] = [];
      for (const evt of events) {
        const log = evt as ethers.EventLog;
        const proposalId = log.args[0].toString();
        const desc = log.args[8] || "No description";
        
        try {
          const stateNum = await governorRead.state(proposalId);
          const votes = await governorRead.proposalVotes(proposalId);
          const vt = await governorRead.proposalVotingType(proposalId);
          items.push({
            id: proposalId,
            description: desc,
            state: Number(stateNum),
            votesFor: ethers.formatEther(votes[1]),
            votesAgainst: ethers.formatEther(votes[0]),
            votesAbstain: ethers.formatEther(votes[2]),
            votingType: Number(vt),
          });
        } catch {
          items.push({ id: proposalId, description: desc, state: 0, votesFor: '0', votesAgainst: '0', votesAbstain: '0', votingType: 0 });
        }
      }
      setProposals(items);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  }, [provider, governor]);

  useEffect(() => {
    if (provider && signer) fetchProposals();
  }, [provider, signer, fetchProposals]);

  const createProposal = async () => {
    if (!governor || !token || !description.trim()) return;
    try {
      const transferCalldata = token.interface.encodeFunctionData("transfer", [address, 1000]);
      const tx = await governor["propose(address[],uint256[],bytes[],string,uint8)"](
        [TOKEN_ADDRESS], [0], [transferCalldata], description, voteType
      );
      await tx.wait();
      alert("Proposal Created!");
      setDescription("");
      setTimeout(fetchProposals, 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Error: " + msg);
    }
  };

  const delegate = async () => {
    if (!token) return;
    try {
      const tx = await token.delegate(address);
      await tx.wait();
      alert("Delegated votes to self!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white font-sans">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Decentralized Governance
        </h1>
        <ConnectWallet setProvider={setProvider} setSigner={setSigner} setAddress={setAddress} />
      </header>

      <section className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex gap-4">
          <button onClick={delegate} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium transition">
            Delegate to Self
          </button>
          <button onClick={fetchProposals} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition">
            Refresh Proposals
          </button>
        </div>
      </section>

      <section className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Create Proposal</h2>
        <div className="flex flex-col gap-4 max-w-lg">
          <textarea
            placeholder="Proposal Description"
            className="p-3 rounded bg-gray-700 border border-gray-600 text-white min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            className="p-2 rounded bg-gray-700 border border-gray-600 text-white"
            value={voteType}
            onChange={(e) => setVoteType(Number(e.target.value))}
          >
            <option value={0}>Standard Voting (1T1V)</option>
            <option value={1}>Quadratic Voting</option>
          </select>
          <button onClick={createProposal}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold transition">
            Submit Proposal
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Proposals</h2>
        <div className="space-y-4">
          {proposals.length === 0 && (
            <p className="text-gray-500">No proposals yet. Connect wallet and create one!</p>
          )}
          {proposals.map((p) => (
            <div key={p.id} data-testid="proposal-list-item"
              className="p-5 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-lg">{p.description}</h3>
                <span className={`inline-block text-xs px-2 py-1 rounded ${STATE_COLORS[p.state] || 'bg-gray-700'}`}>
                  {STATE_LABELS[p.state] || 'Unknown'}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-400 flex gap-4">
                <span>For: {p.votesFor}</span>
                <span>Against: {p.votesAgainst}</span>
                <span>Abstain: {p.votesAbstain}</span>
                <span className="text-purple-400">{p.votingType === 1 ? 'Quadratic' : 'Standard'}</span>
              </div>
              {p.state === 1 && governor && token && (
                <VotingSection proposalId={p.id} governor={governor} token={token}
                  refresh={fetchProposals} votingType={p.votingType} />
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
