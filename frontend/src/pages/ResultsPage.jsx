import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  Trophy, ArrowLeft, Users, CheckCircle2, AlertCircle,
  MapPin, BarChart2, PieChartIcon, Info, Calendar, Lock,
} from 'lucide-react';
import api from '../services/api';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-secondary border border-border rounded-lg px-4 py-2 shadow-xl text-sm">
        <p className="font-bold">{payload[0].name}</p>
        <p className="text-primary">{payload[0].value} votes</p>
        {payload[0].payload.voteSharePct && (
          <p className="text-muted-foreground">{payload[0].payload.voteSharePct}% share</p>
        )}
      </div>
    );
  }
  return null;
};

const ResultsPage = () => {
  const { electionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [constituencyFilter, setConstituencyFilter] = useState('all');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(`/api/votes/results/${electionId}/final`);
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [electionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading election results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-60" />
        <h2 className="text-xl font-bold mb-2">Results Unavailable</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link to="/" className="text-primary hover:underline flex items-center gap-1 justify-center">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const { election, snapshot } = data;
  const winner = snapshot?.[0];
  const totalVotes = election?.totalVotesCast || snapshot?.reduce((s, c) => s + c.votes, 0) || 0;
  const turnoutPct = election?.turnoutPct || '0';
  const lockedAt = election?.resultsLockedAt;

  // Chart data
  const chartData = (snapshot || []).map((c, i) => ({
    name: c.candidateName,
    votes: c.votes,
    voteSharePct: c.voteSharePct,
    party: c.party,
    fill: COLORS[i % COLORS.length],
  }));

  const pieData = chartData.map(c => ({
    name: `${c.name} (${c.party})`,
    value: c.votes,
    fill: c.fill,
  }));

  const constituencies = election?.constituencies || [];

  const tabs = [
    { id: 'summary', label: 'Summary', icon: Trophy },
    { id: 'bar',     label: 'Bar Chart', icon: BarChart2 },
    { id: 'pie',     label: 'Vote Share', icon: PieChartIcon },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
              election?.type === 'National' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : election?.type === 'State' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-primary/20 text-primary border-primary/30'
            }`}>{election?.type}</span>
            <span className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Results Declared
            </span>
          </div>
          <h1 className="text-2xl font-bold">{election?.title}</h1>
          {lockedAt && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Results locked {new Date(lockedAt).toLocaleString()} — immutable
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Votes', value: totalVotes.toLocaleString(), icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Voter Turnout', value: `${turnoutPct}%`, icon: Users, color: 'text-blue-500' },
          { label: 'Candidates', value: snapshot?.length || 0, icon: Info, color: 'text-purple-500' },
          { label: 'Constituencies', value: constituencies.length || '—', icon: MapPin, color: 'text-amber-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-secondary/10 border border-border rounded-xl p-4 flex items-center gap-3">
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-70`} />
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Winner Card */}
      {winner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-background border-2 border-yellow-500/30 rounded-2xl p-8"
        >
          <div className="absolute -right-8 -top-8 opacity-[0.07]">
            <Trophy className="w-48 h-48 text-yellow-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-yellow-400 mb-3">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Winner — Declared</span>
            </div>
            <h2 className="text-4xl font-extrabold mb-1">{winner.candidateName}</h2>
            <p className="text-lg text-muted-foreground mb-4">{winner.party}</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Votes Received</p>
                <p className="text-3xl font-bold text-primary">{winner.votes.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vote Share</p>
                <p className="text-3xl font-bold text-yellow-400">{winner.voteSharePct}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Margin Over 2nd</p>
                <p className="text-3xl font-bold text-green-400">
                  {snapshot.length > 1 ? `+${(winner.votes - snapshot[1].votes).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Constituency Filter */}
      {constituencies.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <button
            onClick={() => setConstituencyFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg border transition-all ${constituencyFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}
          >All</button>
          {constituencies.map(c => (
            <button key={c._id}
              onClick={() => setConstituencyFilter(c._id)}
              className={`px-3 py-1 text-sm rounded-lg border transition-all ${constituencyFilter === c._id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}
            >{c.name}</button>
          ))}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 bg-secondary/20 border border-border rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'summary' && (
          <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              {(snapshot || []).map((c, i) => {
                const pct = parseFloat(c.voteSharePct) || 0;
                return (
                  <div key={c.candidateId || i} className={`p-4 rounded-xl border ${i === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border bg-secondary/10'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                        <div>
                          <p className="font-bold">{c.candidateName}</p>
                          <p className="text-sm text-muted-foreground">{c.party}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{c.votes.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{c.voteSharePct}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-border/30 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'bar' && (
          <motion.div key="bar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-secondary/10 border border-border rounded-xl p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 12 }} stroke="#888" />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {activeTab === 'pie' && (
          <motion.div key="pie" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-secondary/10 border border-border rounded-xl p-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" outerRadius={140} innerRadius={60}
                  dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} votes`]} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultsPage;
