import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Vote, AlertCircle, MapPin, Building2, ShieldCheck, IdCard, Users } from 'lucide-react';

const VotingPortal = () => {
  const { user } = useContext(AuthContext);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState('');
  const [boothInfo, setBoothInfo] = useState(null);

  useEffect(() => {
    fetchElections();
    if (user?.assignedBooth?._id || user?.assignedBooth) {
      fetchBoothInfo();
    }
  }, [user]);

  const fetchElections = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/elections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setElections(data.filter(e => e.status === 'Active'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoothInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const boothId = user?.assignedBooth?._id || user?.assignedBooth;
      if (!boothId) return;
      const { data } = await axios.get(`http://localhost:5000/api/geo/booths?constituency=${user?.constituency?._id || user?.constituency}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myBooth = data.find(b => b._id === boothId.toString() || b._id === boothId);
      setBoothInfo(myBooth || null);
    } catch (err) { console.error(err); }
  };

  const handleSelectElection = async (id) => {
    try {
      setStatusMsg({ text: '', type: '' });
      setReceipt('');
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/elections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedElection(data.election);
      setCandidates(data.candidates);
      setSelectedCandidate(null);
    } catch (err) { console.error(err); }
  };

  const handleVote = async () => {
    if (!selectedCandidate) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5000/api/votes',
        { electionId: selectedElection._id, candidateId: selectedCandidate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMsg({ text: 'Vote cast securely!', type: 'success' });
      setReceipt(data.receiptToken);
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Error casting vote', type: 'error' });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading your constituency elections...</p>
      </div>
    </div>
  );

  const constituencyName = user?.constituency?.name || 'Not Assigned';
  const stateName = user?.constituency?.state || '';

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Voter Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-purple-900/30 border border-primary/30 rounded-2xl p-6"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-2 right-4 text-8xl font-black text-primary">ECI</div>
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <IdCard className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Election Commission of India — Voter Card</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{user?.voterId || 'Voter ID Not Assigned'}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{constituencyName}{stateName ? `, ${stateName}` : ''}</span>
              </div>
              {user?.constituency?.district && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>{user.constituency.district} District</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            {(user?.assignedBooth?.name || boothInfo?.name) && (
              <div className="bg-background/50 border border-border rounded-xl p-4 text-sm min-w-[200px]">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Assigned Polling Booth</p>
                <p className="font-semibold">{user?.assignedBooth?.name || boothInfo?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.assignedBooth?.location || boothInfo?.location}</p>
              </div>
            )}
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${user?.isVerified ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
              <ShieldCheck className="w-3 h-3" />
              {user?.isVerified ? 'Verified Voter' : 'Pending Verification'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Elections Section */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Your Constituency Elections</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Showing elections available for <span className="text-primary font-medium">{constituencyName}</span>
        </p>

        <AnimatePresence mode="wait">
          {!selectedElection ? (
            <motion.div
              key="elections-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {elections.length === 0 ? (
                <div className="col-span-2 text-center py-16 bg-secondary/10 rounded-xl border border-border">
                  <Vote className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground font-medium">No active elections for your constituency.</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back during election season.</p>
                </div>
              ) : elections.map((election) => (
                <motion.div
                  key={election._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleSelectElection(election._id)}
                  className="p-6 bg-secondary/10 border border-border rounded-xl cursor-pointer hover:bg-secondary/30 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${election.type === 'National' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : election.type === 'State' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                      {election.type}
                    </span>
                    <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-1">{election.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{election.description}</p>
                  {election.constituencies?.[0]?.name && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {election.constituencies[0].name}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : receipt ? (
            <motion.div
              key="receipt-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-secondary/10 border border-green-500/30 rounded-xl p-8 text-center space-y-6"
            >
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ballot Secured</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Your vote has been cryptographically secured. Keep your receipt to verify your vote was counted.
                </p>
              </div>
              <div className="bg-background border border-border p-5 rounded-xl text-left max-w-lg mx-auto">
                <p className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> CRYPTOGRAPHIC RECEIPT TOKEN</p>
                <p className="font-mono text-sm break-all font-bold text-primary select-all">{receipt}</p>
                <p className="text-xs text-muted-foreground mt-3">Visit <span className="text-primary">/verify</span> to confirm your vote was counted</p>
              </div>
              <button onClick={() => { setSelectedElection(null); setReceipt(''); }}
                className="px-6 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors">
                Back to Elections
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="voting-interface"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-secondary/10 border border-border rounded-xl p-8"
            >
              <button onClick={() => setSelectedElection(null)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
                ← Back to elections
              </button>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold">{selectedElection.title}</h2>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${selectedElection.type === 'National' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                  {selectedElection.type}
                </span>
              </div>
              <p className="text-muted-foreground mb-2 text-sm">{selectedElection.description}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-6 pb-6 border-b border-border/50">
                <MapPin className="w-3 h-3 text-primary" />
                <span>Constituency: <span className="text-primary font-medium">{constituencyName}</span></span>
              </div>

              {statusMsg.text && (
                <div className={`p-4 rounded-lg flex items-center gap-2 mb-6 ${statusMsg.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                  {statusMsg.text}
                </div>
              )}

              <div className="space-y-3 mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Candidates — {constituencyName}</h3>
                {candidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No candidates found for your constituency in this election.</p>
                  </div>
                ) : candidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    onClick={() => setSelectedCandidate(candidate._id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedCandidate === candidate._id ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}
                  >
                    <div>
                      <h4 className="font-bold text-base">{candidate.name}</h4>
                      <p className="text-sm text-muted-foreground">{candidate.party}</p>
                      {candidate.constituency?.name && (
                        <p className="text-xs text-primary/70 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {candidate.constituency.name}</p>
                      )}
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCandidate === candidate._id ? 'border-primary' : 'border-muted-foreground'}`}>
                      {selectedCandidate === candidate._id && <div className="h-3 w-3 rounded-full bg-primary" />}
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleVote}
                disabled={!selectedCandidate || statusMsg.type === 'success'}
                className="w-full h-13 bg-primary text-primary-foreground font-bold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                <Vote className="h-5 w-5" />
                Cast My Secure Ballot
              </motion.button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Your vote is anonymized via SHA-256 hashing. Secret ballot principle enforced.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VotingPortal;
