import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Lock, ArrowLeft, Search, Users,
  MapPin, Clock, Download, Filter, ChevronDown,
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AdminParticipation = () => {
  const { electionId } = useParams();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [constituencyFilter, setConstituencyFilter] = useState('all');
  const [constituencies, setConstituencies] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [partRes, geoRes] = await Promise.all([
          api.get(`/api/admin/participation/${electionId}`),
          api.get('/api/geo/constituencies'),
        ]);
        setData(partRes.data);
        setConstituencies(geoRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load participation data.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [electionId]);

  const handleExportCSV = () => {
    if (!data?.participation?.length) return;
    const header = 'Voter ID,Name,Constituency,State,Booth,Timestamp,Vote Choice\n';
    const rows = data.participation
      .map(p => `${p.voterId},"${p.voterName}","${p.constituencyName}","${p.constituencyState}","${p.boothName}","${new Date(p.timestamp).toLocaleString()}","PROTECTED"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `participation_${electionId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = (data?.participation || []).filter(p => {
    const matchSearch = !search || p.voterId.toLowerCase().includes(search.toLowerCase()) || p.voterName.toLowerCase().includes(search.toLowerCase());
    const matchConst  = constituencyFilter === 'all' || p.constituencyName === constituencyFilter;
    return matchSearch && matchConst;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading participation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-60" />
        <h2 className="text-xl font-bold mb-2">Access Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link to="/dashboard" className="text-primary hover:underline flex items-center gap-1 justify-center">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const uniqueConstituencies = [...new Set((data?.participation || []).map(p => p.constituencyName).filter(Boolean))];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" /> Voter Participation Registry
          </h1>
          <p className="text-sm text-muted-foreground">Privacy-preserving turnout data — vote choices cryptographically hidden</p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold mb-1">Zero-Knowledge Privacy Architecture</p>
          <p className="text-amber-400/80">{data?.note}</p>
          <p className="text-amber-400/60 text-xs mt-1">This access has been logged in the immutable audit trail.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-secondary/10 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Total Participants</p>
          <p className="text-3xl font-bold">{data?.totalParticipants || 0}</p>
        </div>
        <div className="bg-secondary/10 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Constituencies</p>
          <p className="text-3xl font-bold">{uniqueConstituencies.length}</p>
        </div>
        <div className="bg-secondary/10 border border-border rounded-xl p-4 md:col-span-1 col-span-2">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Showing</p>
          <p className="text-3xl font-bold">{filtered.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Voter ID or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={constituencyFilter}
            onChange={e => setConstituencyFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none appearance-none min-w-[180px]"
          >
            <option value="all">All Constituencies</option>
            {uniqueConstituencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-secondary/10 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Voter ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Constituency</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Booth</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Voted At</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Vote Choice</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No participation records match your filters.
                    </td>
                  </tr>
                ) : filtered.map((p, i) => (
                  <motion.tr
                    key={p.activityId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-primary">{p.voterId}</td>
                    <td className="px-4 py-3 font-medium">{p.voterName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.constituencyName} {p.constituencyState && <span className="text-xs">({p.constituencyState})</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.boothName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full w-fit">
                        <Lock className="w-2.5 h-2.5" /> Protected
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminParticipation;
