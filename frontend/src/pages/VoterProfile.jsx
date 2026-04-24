import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, Building2, ShieldCheck, IdCard,
  Vote, CheckCircle2, Clock, ChevronRight, Eye,
  EyeOff, ArrowRight, History, Activity, BarChart2,
} from 'lucide-react';
import api from '../services/api';

const statusBadge = (status) => {
  const map = {
    Active:    'bg-green-500/20 text-green-400 border-green-500/30',
    Completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    Upcoming:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return map[status] || map.Active;
};

const VoterProfile = () => {
  const { user: authUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [elections, setElections] = useState({ active: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [visibleTokens, setVisibleTokens] = useState({});
  const printRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profileRes, historyRes, electionsRes] = await Promise.all([
          api.get('/api/profile/me'),
          api.get('/api/profile/history'),
          api.get('/api/profile/elections'),
        ]);
        setProfile(profileRes.data);
        setHistory(historyRes.data);
        setElections(electionsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const toggleToken = (id) => setVisibleTokens(prev => ({ ...prev, [id]: !prev[id] }));

  const tabs = [
    { id: 'info',      label: 'My Info',      icon: User },
    { id: 'activity',  label: 'My Activity',   icon: History },
    { id: 'elections', label: 'Elections',     icon: Vote },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const votedElectionIds = new Set(history.map(h => h.electionId?.toString()));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-purple-900/30 border border-primary/30 rounded-2xl p-6"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-2 right-4 text-8xl font-black text-primary">VOTER</div>
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <IdCard className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Election Commission of India — Voter Profile</span>
            </div>
            <h1 className="text-3xl font-bold">{profile?.name || authUser?.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">{profile?.voterId || 'Voter ID Not Assigned'}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {profile?.constituency?.name || 'No Constituency'}{profile?.constituency?.state ? `, ${profile.constituency.state}` : ''}
              </span>
              {profile?.constituency?.district && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {profile.constituency.district}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-start md:items-end">
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${profile?.isVerified ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
              <ShieldCheck className="w-3 h-3" />
              {profile?.isVerified ? 'Verified Voter' : 'Pending Verification'}
            </div>
            <div className="text-2xl font-bold text-primary">
              {history.length} <span className="text-sm font-normal text-muted-foreground">elections participated</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-secondary/20 border border-border rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── MY INFO TAB ── */}
        {activeTab === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="bg-secondary/10 border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Personal Information</h3>
              {[
                { label: 'Full Name',     value: profile?.name },
                { label: 'Email',         value: profile?.email },
                { label: 'Voter ID',      value: profile?.voterId || 'Not Assigned', mono: true },
                { label: 'Account Role',  value: profile?.role?.toUpperCase() },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{row.label}</span>
                  <span className={`font-medium ${row.mono ? 'font-mono text-sm' : ''}`}>{row.value || '—'}</span>
                </div>
              ))}
            </div>

            {/* Constituency & Booth */}
            <div className="bg-secondary/10 border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Constituency & Booth</h3>
              {[
                { label: 'Constituency', value: profile?.constituency?.name },
                { label: 'State',        value: profile?.constituency?.state },
                { label: 'District',     value: profile?.constituency?.district },
                { label: 'Pincode',      value: profile?.constituency?.pincode },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{row.label}</span>
                  <span className="font-medium">{row.value || '—'}</span>
                </div>
              ))}
              {profile?.assignedBooth && (
                <div className="mt-4 pt-4 border-t border-border/50 bg-background/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Assigned Polling Booth</p>
                  <p className="font-semibold">{profile.assignedBooth.name}</p>
                  {profile.assignedBooth.location && <p className="text-xs text-muted-foreground">{profile.assignedBooth.location}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Capacity: {profile.assignedBooth.currentAssigned}/{profile.assignedBooth.maxCapacity}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── MY ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Voting History</h3>
              <p className="text-xs text-muted-foreground bg-secondary/30 border border-border px-2 py-1 rounded">
                🔒 Vote choice is never stored or shown
              </p>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 bg-secondary/10 rounded-xl border border-border">
                <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">You haven't voted in any elections yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <div key={item._id} className="bg-secondary/10 border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{item.electionTitle}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge(item.electionStatus)}`}>
                            {item.electionStatus}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.constituencyName || 'National'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.votedAt).toLocaleString()}</span>
                        </div>

                        {/* Receipt Token — hidden by default */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono bg-background/60 border border-border/50 rounded px-2 py-1 flex-1 truncate">
                            {visibleTokens[item._id] ? item.receiptToken : '••••••••••••••••••••••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleToken(item._id)}
                            className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Toggle receipt token"
                          >
                            {visibleTokens[item._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Voted
                        </div>
                        {item.electionStatus === 'Completed' && (
                          <Link to={`/results/${item.electionId}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            View Results <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── ELECTIONS TAB ── */}
        {activeTab === 'elections' && (
          <motion.div key="elections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-8">
            {/* Active Elections */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active Elections ({elections.active.length})
              </h3>
              {elections.active.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No active elections for your constituency right now.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {elections.active.map(e => {
                    const voted = votedElectionIds.has(e._id.toString());
                    return (
                      <div key={e._id} className="bg-secondary/10 border border-border rounded-xl p-4 hover:border-primary/40 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${e.type === 'National' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                            {e.type}
                          </span>
                          {voted ? (
                            <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Voted</span>
                          ) : (
                            <span className="text-xs text-amber-400">Eligible</span>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm mb-3 line-clamp-2">{e.title}</h4>
                        {!voted && (
                          <Link to="/vote"
                            className="inline-flex items-center gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg transition-colors font-medium">
                            <Vote className="w-3 h-3" /> Cast Vote
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed Elections */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                Completed Elections ({elections.completed.length})
              </h3>
              {elections.completed.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No completed elections yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {elections.completed.map(e => {
                    const voted = votedElectionIds.has(e._id.toString());
                    return (
                      <div key={e._id} className="bg-secondary/10 border border-border rounded-xl p-4 opacity-80">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-gray-500/20 text-gray-400 border-gray-500/30">
                            COMPLETED
                          </span>
                          <span className={`text-xs flex items-center gap-1 ${voted ? 'text-green-400' : 'text-muted-foreground'}`}>
                            {voted ? <><CheckCircle2 className="w-3 h-3" /> Voted</> : 'Did not vote'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm mb-3 line-clamp-2">{e.title}</h4>
                        <Link to={`/results/${e._id}`}
                          className="inline-flex items-center gap-1.5 text-xs border border-border hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          View Results <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming */}
            {elections.upcoming.length > 0 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Upcoming Elections ({elections.upcoming.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {elections.upcoming.map(e => (
                    <div key={e._id} className="bg-secondary/10 border border-border rounded-xl p-4 opacity-70">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-500/20 text-blue-400 border-blue-500/30 mb-2 inline-block">UPCOMING</span>
                      <h4 className="font-semibold text-sm mb-1">{e.title}</h4>
                      <p className="text-xs text-muted-foreground">Starts {new Date(e.startDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoterProfile;
