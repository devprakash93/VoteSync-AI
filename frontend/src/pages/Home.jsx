import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Activity, Copy, Check, Vote, User, Shield } from 'lucide-react';
import { useState } from 'react';

// ── Demo credentials displayed on the home page ───────────────────────────
const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@elections.gov.in',
    password: 'Admin@123',
    desc: 'Full control — create elections, view live analytics',
    badge: 'ADMIN',
    color: 'border-purple-500/30 bg-purple-500/5',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    Icon: Shield,
    iconBg: 'bg-purple-500/20 text-purple-400',
  },
  {
    role: 'Voter (Delhi)',
    email: 'voter.a.0@elections.demo',
    password: 'Voter@123',
    desc: 'New Delhi Sadar constituency — cast constituency & national vote',
    badge: 'VOTER',
    color: 'border-blue-500/30 bg-blue-500/5',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    Icon: Vote,
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  {
    role: 'Voter (Mumbai)',
    email: 'voter.a.2@elections.demo',
    password: 'Voter@123',
    desc: 'Andheri East constituency — Maharashtra elections',
    badge: 'VOTER',
    color: 'border-green-500/30 bg-green-500/5',
    badgeColor: 'bg-green-500/20 text-green-400',
    Icon: User,
    iconBg: 'bg-green-500/20 text-green-400',
  },
];

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-5xl mx-auto space-y-16 px-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium">AI-Powered Voting System — Live Demo</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
          Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Secure</span> Voting
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Ensure election integrity with real-time tracking, cryptographic anonymity, and AI-driven fraud detection heuristics.
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex sm:flex-row flex-col gap-4"
      >
        <Link to="/login">
          <button id="home-login-btn" className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 w-full sm:w-auto">
            Sign In to Vote
          </button>
        </Link>
        <Link to="/register">
          <button id="home-register-btn" className="h-12 px-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg border border-border shadow-sm w-full sm:w-auto">
            Register Now
          </button>
        </Link>
      </motion.div>

      {/* ── Demo Credentials Panel ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="w-full"
      >
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Demo Credentials — Try the Platform
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {DEMO_ACCOUNTS.map((acc, i) => {
            const Icon = acc.Icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`p-4 rounded-2xl border ${acc.color} backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${acc.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{acc.role}</span>
                    <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${acc.badgeColor}`}>
                      {acc.badge}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{acc.desc}</p>
                <div className="space-y-1.5 bg-background/40 rounded-lg p-2.5 border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground/80 truncate">{acc.email}</span>
                    <CopyButton text={acc.email} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground/80">{acc.password}</span>
                    <CopyButton text={acc.password} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-8 border-t border-border/50"
      >
        <div className="flex flex-col items-center space-y-4 p-6 bg-secondary/30 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Secure & Anonymous</h3>
          <p className="text-muted-foreground text-sm">Every vote is cryptographically anonymized to ensure the secret ballot is untampered.</p>
        </div>
        <div className="flex flex-col items-center space-y-4 p-6 bg-secondary/30 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">AI Fraud Detection</h3>
          <p className="text-muted-foreground text-sm">Heuristics analyze voting velocity and origin to instantly detect and flag anomalous behavior.</p>
        </div>
        <div className="flex flex-col items-center space-y-4 p-6 bg-secondary/30 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Real-time Analytics</h3>
          <p className="text-muted-foreground text-sm">Watch the democratic process unfold live with instant, rich graphical dashboards via WebSockets.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
