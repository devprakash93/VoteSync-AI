import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Activity } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-4xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-sm font-medium">AI-Powered Voting System</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
          Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Secure</span> Voting
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Ensure election integrity with real-time tracking, cryptographic anonymity, and AI-driven fraud detection heuristics.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex sm:flex-row flex-col gap-4"
      >
        <Link to="/register">
          <button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 w-full sm:w-auto">
            Get Started
          </button>
        </Link>
        <Link to="/login">
          <button className="h-12 px-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg border border-border shadow-sm w-full sm:w-auto">
            Voter Login
          </button>
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-16 pt-16 border-t border-border/50"
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
