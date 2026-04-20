import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Search, CheckCircle2, AlertCircle } from 'lucide-react';

const VerifyVote = () => {
  const [receiptToken, setReceiptToken] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!receiptToken.trim()) return;
    
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const { data } = await axios.get(`http://localhost:5000/api/votes/verify/${receiptToken.trim()}`);
      setVerificationResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed or token invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Verify Your Ballot</h1>
        <p className="text-muted-foreground">
          Enter your unique cryptographic receipt token below to verify that your vote was successfully written to the database and accurately counted.
        </p>
      </div>

      <div className="bg-secondary/10 border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleVerify} className="flex gap-3">
          <input 
            type="text" 
            placeholder="Paste your 32-character receipt token..." 
            value={receiptToken}
            onChange={(e) => setReceiptToken(e.target.value)}
            className="flex-grow p-4 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            required
          />
          <button 
            type="submit" 
            disabled={loading || !receiptToken.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Searching...' : <><Search className="w-4 h-4" /> Verify</>}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 mb-3 opacity-80" />
          <h3 className="text-lg font-semibold mb-1">Verification Failed</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {verificationResult && (
        <div className="mt-8 p-8 bg-green-500/10 border border-green-500/30 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><CheckCircle2 className="w-32 h-32 text-green-500" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-green-500 mb-6">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-xl font-bold tracking-tight">Vote Verified</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Election</p>
                <p className="text-lg font-medium">{verificationResult.electionTitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Timestamp</p>
                <p className="text-lg font-medium">{new Date(verificationResult.timestamp).toLocaleString()}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Candidate Selected</p>
                <p className="text-xl font-bold text-primary">{verificationResult.candidateName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyVote;
