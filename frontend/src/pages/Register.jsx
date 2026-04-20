import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Shield, MapPin } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('voter');
  const [constituencyId, setConstituencyId] = useState('');
  const [constituencies, setConstituencies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch constituencies for the registration form (public route not available — use a guest bypass)
    // We mock a temp guest token or just call a public endpoint
    axios.get('http://localhost:5000/api/geo/constituencies', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(({ data }) => setConstituencies(data)).catch(() => setConstituencies([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(name, email, password, role, null, constituencyId || null);
    setLoading(false);
    if (result.success) {
      if (role === 'admin') navigate('/dashboard');
      else navigate('/vote');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[85vh] py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 space-y-6 bg-secondary/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl shadow-black/20"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 rounded-2xl mb-4">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Voter Registration</h2>
          <p className="text-muted-foreground mt-2 text-sm">Election Commission of India — Digital Platform</p>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-500/10 text-red-400 rounded-lg border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" required placeholder="As per Aadhaar Card"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" required placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" required placeholder="Min. 8 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          {/* Constituency Selector */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Your Constituency</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={constituencyId}
                onChange={e => setConstituencyId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none"
              >
                <option value="">— Select your constituency —</option>
                {constituencies.map(c => (
                  <option key={c._id} value={c._id}>{c.name} — {c.state} ({c.district})</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground pt-1">A polling booth will be auto-assigned based on capacity.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Account Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none"
                value={role} onChange={e => setRole(e.target.value)}>
                <option value="voter">Voter</option>
                <option value="admin">Admin (Chief Election Officer)</option>
              </select>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full h-11 mt-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register as Voter'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
