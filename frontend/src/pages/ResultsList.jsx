import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, ArrowRight, BarChart2, Info } from 'lucide-react';
import api from '../services/api';

const ResultsList = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        const { data } = await api.get('/api/elections/completed');
        setElections(data);
      } catch (err) {
        setError('Failed to load completed elections.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading completed elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" /> Election Results
        </h1>
        <p className="text-muted-foreground">Official certified results from completed elections</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      {elections.length === 0 ? (
        <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-border border-dashed">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-semibold mb-1">No Completed Elections</h2>
          <p className="text-muted-foreground">Results will appear here once active elections conclude.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map((election) => (
            <motion.div
              key={election._id}
              whileHover={{ y: -4 }}
              className="bg-secondary/10 border border-border rounded-2xl p-6 flex flex-col hover:border-primary/40 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded border tracking-widest uppercase ${
                  election.type === 'National' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-primary/20 text-primary border-primary/30'
                }`}>
                  {election.type}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(election.endDate).toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{election.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-grow">{election.description}</p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3" /> {election.totalVotesCast || 0} votes
                  </div>
                  {election.turnoutPct && (
                    <div className="flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" /> {election.turnoutPct}% turnout
                    </div>
                  )}
                </div>
                <Link
                  to={`/results/${election._id}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 transition-all"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsList;
