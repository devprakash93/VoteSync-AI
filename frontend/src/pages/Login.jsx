import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ShieldCheck, Vote, User } from 'lucide-react';

// ── Demo credential profiles ──────────────────────────────────────────────
const DEMO_USERS = [
  {
    label: 'Admin / Chief Election Officer',
    email: 'admin@elections.gov.in',
    password: 'Admin@123',
    role: 'admin',
    badge: 'ADMIN',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: ShieldCheck,
    iconColor: 'text-purple-400',
    description: 'Full dashboard — manage elections, view live analytics',
  },
  {
    label: 'Voter — Delhi (New Delhi Sadar)',
    email: 'voter.a.0@elections.demo',
    password: 'Voter@123',
    role: 'voter',
    badge: 'VOTER',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Vote,
    iconColor: 'text-blue-400',
    description: 'Cast a vote in constituency & national elections',
  },
  {
    label: 'Voter — Maharashtra (Andheri East)',
    email: 'voter.a.2@elections.demo',
    password: 'Voter@123',
    role: 'voter',
    badge: 'VOTER',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: User,
    iconColor: 'text-green-400',
    description: 'Vote in Mumbai constituency elections',
  },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDemoClick = (demo, idx) => {
    setActiveDemo(idx);
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      // Smart redirect based on role
      navigate(result.role === 'admin' ? '/dashboard' : '/vote');
    } else {
      setError(result.message);
      setActiveDemo(null);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[85vh] py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to cast your vote or manage elections</p>
        </div>

        {/* ── Demo Credential Cards ───────────────────────────────────────── */}
        <div className="bg-secondary/10 border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Quick Demo Access — Click to Auto-fill
          </p>
          <div className="space-y-2">
            {DEMO_USERS.map((demo, idx) => {
              const Icon = demo.icon;
              const isActive = activeDemo === idx;
              return (
                <motion.button
                  key={idx}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleDemoClick(demo, idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    isActive
                      ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                      : 'border-border bg-background/50 hover:border-primary/40 hover:bg-secondary/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 ${demo.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold truncate">{demo.label}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${demo.badgeColor} shrink-0`}>
                        {demo.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{demo.description}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 truncate">{demo.email}</p>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Login Form ───────────────────────────────────────────────────── */}
        <div className="bg-secondary/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl shadow-black/20">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/30"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setActiveDemo(null); }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="login-password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setActiveDemo(null); }}
                />
              </div>
            </div>

            <motion.button
              id="login-submit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing In…
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
