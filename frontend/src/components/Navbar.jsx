import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Vote, LogOut, User as UserIcon, ShieldCheck, BarChart2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 sticky top-0">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Vote className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">VoteSync AI</span>
        </Link>

        <div className="flex items-center gap-5">
          {/* Results link — visible to everyone */}
          <Link to="/results" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex items-center gap-1">
            <BarChart2 className="w-4 h-4" /> Results
          </Link>

          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
              )}

              <Link to="/vote" className="text-sm font-medium hover:text-primary transition-colors">
                Voting Portal
              </Link>

              <Link to="/verify" className="text-sm font-medium hover:text-primary transition-colors hidden md:flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Verify Vote
              </Link>

              {/* Profile link — voters get Voter Profile, admins have Dashboard */}
              {user.role !== 'admin' && (
                <Link to="/profile" className="text-sm font-medium hover:text-primary transition-colors hidden md:flex items-center gap-1">
                  <UserCircle className="w-4 h-4" /> My Profile
                </Link>
              )}

              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Log in
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
