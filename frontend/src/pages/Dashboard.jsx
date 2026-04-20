import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus, Users, BrainCircuit, RefreshCw, Trash2, StopCircle, CheckCircle2, AlertCircle, Calendar, Search, ShieldAlert, Map } from 'lucide-react';
import GeoManager from '../components/GeoManager';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [voteResults, setVoteResults] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [turnoutStats, setTurnoutStats] = useState(null);

  // Forms
  const [newElection, setNewElection] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [newCandidate, setNewCandidate] = useState({ name: '', party: '' });

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  useEffect(() => {
    fetchElections();
    fetchAuditLogs();
    
    const socket = io('http://localhost:5000');
    socket.on('voteCast', (data) => {
      if (selectedElection && data.electionId === selectedElection) {
        fetchResults(selectedElection);
      }
    });
    // Real-time turnout refresh
    socket.on('turnoutUpdate', (data) => {
      if (selectedElection && data.electionId === selectedElection) {
        fetchTurnout(selectedElection);
        fetchAuditLogs();
      }
    });

    return () => socket.disconnect();
  }, [selectedElection]);

  const fetchElections = async (idToSelect = null) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/elections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setElections(data);
      
      const targetId = idToSelect || selectedElection || (data.length > 0 ? data[0]._id : null);
      if (targetId && data.some(e => e._id === targetId)) {
        if (targetId !== selectedElection) setSelectedElection(targetId);
        fetchElectionDetails(targetId);
        fetchResults(targetId);
        fetchTurnout(targetId);
      } else {
        setSelectedElection('');
        setCandidates([]);
        setVoteResults([]);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load elections', 'error');
    }
  };

  const fetchElectionDetails = async (id) => {
    const { data } = await axios.get(`http://localhost:5000/api/elections/${id}`);
    setCandidates(data.candidates);
  };

  const fetchResults = async (id) => {
    const { data } = await axios.get(`http://localhost:5000/api/votes/results/${id}`);
    setVoteResults(data);
  };

  const fetchTurnout = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/votes/turnout/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurnoutStats(data);
    } catch (err) {
      console.error('Turnout fetch error:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(data);
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  const handleElectionChange = (e) => {
    const id = e.target.value;
    setSelectedElection(id);
    fetchElectionDetails(id);
    fetchResults(id);
    fetchTurnout(id);
    setAiInsights(null); 
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5000/api/elections', newElection, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Election created successfully!');
      setNewElection({ title: '', description: '', startDate: '', endDate: '' });
      fetchElections(data._id); // Auto switch to newly created
    } catch (err) {
      showToast(err.response?.data?.message || 'Error formatting data or processing request', 'error');
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/elections/${selectedElection}/candidates`, newCandidate, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Candidate added successfully!');
      fetchElectionDetails(selectedElection);
      setNewCandidate({ name: '', party: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing request', 'error');
    }
  };

  // ----- NEW FEATURES -----
  const handleEndElection = async () => {
    if (!window.confirm("Are you sure you want to end this election immediately?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/elections/${selectedElection}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Election ended successfully', 'success');
      fetchElections(selectedElection);
    } catch (err) {
      showToast('Failed to end election', 'error');
    }
  };

  const handleDeleteElection = async () => {
    if (!window.confirm("CRITICAL: Delete election and all associated votes permanently?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/elections/${selectedElection}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Election deleted completely', 'success');
      fetchElections(); 
    } catch (err) {
      showToast('Failed to delete election', 'error');
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm("Remove this candidate?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/elections/${selectedElection}/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Candidate removed', 'success');
      fetchElectionDetails(selectedElection);
    } catch (err) {
      showToast('Failed to remove candidate', 'error');
    }
  };
  // -------------------------

  const fetchAiAnalysis = async () => {
    if (!selectedElection) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/ai/analyze/${selectedElection}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiInsights(data.insights);
    } catch (err) {
      showToast('AI request failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const chartData = candidates.map(c => {
    const result = voteResults.find(r => r._id === c._id);
    return { name: c.name, votes: result ? result.count : 0 };
  });

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(candidateSearch.toLowerCase()) || 
    c.party.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const getElectionStatus = (elec) => {
    const now = new Date();
    const start = new Date(elec.startDate);
    const end = new Date(elec.endDate);
    if (now < start) return { text: 'Upcoming', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (now > end) return { text: 'Completed', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
    return { text: 'Active', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
  };

  const currentElecData = elections.find(e => e._id === selectedElection);

  return (
    <div className="space-y-8 relative">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chief Election Officer — Control Panel</h1>
        <p className="text-muted-foreground mt-1">Manage elections, constituencies, booths, and monitor live voting intelligence.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-secondary/20 border border-border rounded-xl p-1 w-fit">
        {[{ id: 'overview', label: 'Election Overview', icon: Activity }, { id: 'geo', label: 'Geo Management', icon: Map }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${ activeTab === tab.id ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground' }`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'geo' && <GeoManager />}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Controls & Management */}
          <div className="space-y-8 lg:col-span-1">
          
          {/* Election Selector */}
          <div className="bg-secondary/10 p-6 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Active Election</h3>
              {currentElecData && (
                <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border ${getElectionStatus(currentElecData).color}`}>
                  {getElectionStatus(currentElecData).text}
                </span>
              )}
            </div>
            
            {elections.length > 0 ? (
              <select 
                className="w-full p-2 bg-background border border-border rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                value={selectedElection}
                onChange={handleElectionChange}
              >
                {elections.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
              </select>
            ) : (
               <div className="p-3 text-sm text-muted-foreground bg-background rounded-lg border border-border">No elections created yet.</div>
            )}
            
            {/* Admin Management Tools for Selected Election */}
            {currentElecData && (
              <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                <button 
                   onClick={handleEndElection}
                   title="End Election Early"
                   className="flex-1 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 rounded border border-orange-400/20 transition-colors"
                >
                  <StopCircle className="w-4 h-4" /> End Early
                </button>
                <button 
                   onClick={handleDeleteElection}
                   title="Delete Election entirely"
                   className="flex-1 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded border border-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}

            {currentElecData && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Add Candidate</h4>
                <form onSubmit={handleCreateCandidate} className="space-y-3">
                  <input required placeholder="Candidate Name" value={newCandidate.name} onChange={e => setNewCandidate({...newCandidate, name: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm transition-all" />
                  <input required placeholder="Party" value={newCandidate.party} onChange={e => setNewCandidate({...newCandidate, party: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm transition-all" />
                  <button type="submit" disabled={!selectedElection} className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm py-2 rounded-lg transition-colors flex justify-center items-center gap-1 disabled:opacity-50">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-primary/10 p-6 rounded-xl border border-primary/20 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><BrainCircuit className="w-32 h-32" /></div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> AI Assistant</h3>
            <p className="text-sm text-muted-foreground mb-4">Run an AI heuristic analysis on the current election data and audit logs to detect fraud patterns.</p>
            {aiInsights ? (
              <div className="bg-background/60 p-4 rounded-lg border border-border/50 text-sm leading-relaxed relative z-10">{aiInsights}</div>
            ) : (
              <button onClick={fetchAiAnalysis} disabled={aiLoading || !selectedElection} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2 relative z-10 disabled:opacity-50">
                {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate Insights'}
              </button>
            )}
          </div>

          {/* Create New Election */}
          <div className="bg-secondary/10 p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Create Election</h3>
            <form onSubmit={handleCreateElection} className="space-y-3">
              <input required placeholder="Election Title" value={newElection.title} onChange={e => setNewElection({...newElection, title: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm transition-all" />
              <textarea required placeholder="Description Context" value={newElection.description} onChange={e => setNewElection({...newElection, description: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm resize-none h-20 transition-all" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</label>
                  <input required type="datetime-local" value={newElection.startDate} onChange={e => setNewElection({...newElection, startDate: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary text-xs transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</label>
                  <input required type="datetime-local" value={newElection.endDate} onChange={e => setNewElection({...newElection, endDate: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary text-xs transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg text-sm transition-colors mt-2">
                Create
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Data visualization and Candidate Management */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-secondary/10 p-6 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Eligible Voters</p>
                  <h4 className="text-3xl font-bold font-mono tracking-tight">{turnoutStats?.totalRegisteredVoters || 0}</h4>
                </div>
                <Users className="h-10 w-10 text-blue-500/20" />
             </div>
             <div className="bg-secondary/10 p-6 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Total Votes Cast</p>
                  <h4 className="text-3xl font-bold font-mono tracking-tight">{turnoutStats?.totalVotes || 0}</h4>
                </div>
                <Activity className="h-10 w-10 text-purple-500/20" />
             </div>
             <div className="bg-secondary/10 p-6 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Voter Turnout</p>
                  <h4 className="text-3xl font-bold font-mono tracking-tight text-primary">{turnoutStats?.overallTurnoutPct || 0}%</h4>
                </div>
                <div className="absolute inset-0 bg-primary/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center relative z-10">
                   <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-pulse" />
                </div>
             </div>
          </div>

          {/* Detailed Turnout Breakdown */}
          {turnoutStats?.byConstituency && (
             <div className="bg-secondary/10 p-6 rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Map className="w-4 h-4" /> Live Constituency Participation
                   </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {turnoutStats.byConstituency.map((c) => (
                      <div key={c.constituencyId} className="bg-background/40 p-3 rounded-lg border border-border/50">
                         <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm truncate pr-2">{c.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/20 text-primary rounded border border-primary/20">
                               {c.turnoutPct}%
                            </span>
                         </div>
                         <div className="w-full bg-border/30 h-1 rounded-full mb-2 overflow-hidden">
                            <div 
                               className="bg-primary h-full rounded-full transition-all duration-1000" 
                               style={{ width: `${c.turnoutPct}%` }}
                            />
                         </div>
                         <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>VOTES: {c.votesCast}</span>
                            <span>REG: {c.totalRegistered}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Live Chart */}
          <div className="bg-secondary/10 p-6 rounded-xl border border-border h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-green-500 animate-pulse" /> Live Vote Density</h3>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold border border-green-500/20 tracking-wider">
                WEBSOCKETS CONNECTED
              </div>
            </div>
            <div className="flex-grow">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff'}} />
                    <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                  Waiting for candidates and vote data...
                </div>
              )}
            </div>
          </div>

          {/* Roster Management */}
          {candidates.length > 0 && (
             <div className="bg-secondary/10 p-6 rounded-xl border border-border">
               <div className="flex items-center justify-between xl:flex-row flex-col gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-foreground/80">Roster Management</h3>
                  <div className="relative w-full xl:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search candidates..." 
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
               </div>
               
               <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredCandidates.length > 0 ? filteredCandidates.map(candidate => (
                   <div key={candidate._id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                      <div className="flex flex-col">
                         <span className="font-semibold text-sm">{candidate.name}</span>
                         <span className="text-xs text-muted-foreground">{candidate.party}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCandidate(candidate._id)}
                        title="Remove Candidate"
                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                      >
                         <Trash2 className="h-4 w-4" />
                      </button>
                   </div>
                 )) : (
                   <p className="text-sm text-muted-foreground italic text-center py-4">No candidates match your search.</p>
                 )}
               </div>
             </div>
          )}

          {/* Audit Timeline */}
          <div className="bg-secondary/10 p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Immutable Audit Logs</h3>
            <div className="relative border-l border-border ml-3 space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {auditLogs.length > 0 ? auditLogs.map(log => (
                <div key={log._id} className="relative pl-6">
                  <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background ${log.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : log.action.includes('FRAUD') ? 'bg-orange-500' : 'bg-primary'}`} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`text-xs font-bold uppercase tracking-wider ${log.severity === 'critical' ? 'text-red-500' : 'text-foreground/80'}`}>{log.action.replace('_', ' ')}</span>
                       <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic pl-6">No system events logged yet.</p>
              )}
            </div>
          </div>

        </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
