import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Building2, MapPin, Plus, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import api from '../services/api';

const GeoManager = () => {
  const { user } = useContext(AuthContext);
  const [constituencies, setConstituencies] = useState([]);
  const [booths, setBooths] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [newC, setNewC] = useState({ name: '', state: '', district: '', pincode: '' });
  const [newB, setNewB] = useState({ name: '', constituency: '', location: '', maxCapacity: 1000 });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };



  useEffect(() => { fetchConstituencies(); fetchBooths(); }, []);

  const fetchConstituencies = async () => {
    try {
      const { data } = await api.get('/api/geo/constituencies');
      setConstituencies(data);
    } catch (e) { console.error(e); }
  };

  const fetchBooths = async (constituencyId = '') => {
    try {
      const url = constituencyId ? `/api/geo/booths?constituency=${constituencyId}` : '/api/geo/booths';
      const { data } = await api.get(url);
      setBooths(data);
    } catch (e) { console.error(e); }
  };

  const handleCreateConstituency = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/geo/constituencies', newC);
      showToast(`Constituency "${newC.name}" created!`);
      setNewC({ name: '', state: '', district: '', pincode: '' });
      fetchConstituencies();
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleCreateBooth = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/geo/booths', newB);
      showToast(`Booth "${newB.name}" created!`);
      setNewB({ name: '', constituency: '', location: '', maxCapacity: 1000 });
      fetchBooths(selectedConstituency);
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const groupedByState = constituencies.reduce((acc, c) => {
    if (!acc[c.state]) acc[c.state] = [];
    acc[c.state].push(c);
    return acc;
  }, {});

  const filteredBooths = selectedConstituency
    ? booths.filter(b => b.constituency?._id === selectedConstituency)
    : booths;

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast.show && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Create Constituency ─────────────────── */}
        <div className="bg-secondary/10 border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Add Constituency
          </h3>
          <form onSubmit={handleCreateConstituency} className="space-y-3">
            {[
              { placeholder: 'Constituency Name', key: 'name' },
              { placeholder: 'State (e.g. Maharashtra)', key: 'state' },
              { placeholder: 'District', key: 'district' },
              { placeholder: 'Pincode', key: 'pincode' },
            ].map(({ placeholder, key }) => (
              <input key={key} required={key !== 'pincode'} type="text" placeholder={placeholder}
                value={newC[key]} onChange={e => setNewC({ ...newC, [key]: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none" />
            ))}
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Create Constituency
            </button>
          </form>
        </div>

        {/* ─── Create Booth ────────────────────────── */}
        <div className="bg-secondary/10 border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Add Polling Booth
          </h3>
          <form onSubmit={handleCreateBooth} className="space-y-3">
            <input required type="text" placeholder="Booth Name"
              value={newB.name} onChange={e => setNewB({ ...newB, name: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none" />
            <select required value={newB.constituency} onChange={e => setNewB({ ...newB, constituency: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none">
              <option value="">— Select Constituency —</option>
              {constituencies.map(c => <option key={c._id} value={c._id}>{c.name} ({c.state})</option>)}
            </select>
            <input type="text" placeholder="Location / Address"
              value={newB.location} onChange={e => setNewB({ ...newB, location: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none" />
            <input type="number" placeholder="Max Capacity"
              value={newB.maxCapacity} onChange={e => setNewB({ ...newB, maxCapacity: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none" />
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Create Booth
            </button>
          </form>
        </div>
      </div>

      {/* ─── Constituency Drill-Down View ─────────────────────── */}
      <div className="bg-secondary/10 border border-border rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Regional Hierarchy</h3>
          <select value={selectedConstituency} onChange={e => { setSelectedConstituency(e.target.value); fetchBooths(e.target.value); }}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none min-w-[200px]">
            <option value="">All Constituencies</option>
            {constituencies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* State grouped constituency list */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {Object.entries(groupedByState).map(([state, cList]) => (
            <div key={state} className="bg-background border border-border rounded-xl overflow-hidden">
              <div className="bg-primary/10 px-4 py-2 border-b border-border flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-sm text-primary">{state}</span>
                <span className="ml-auto text-xs text-muted-foreground">{cList.length} constituencies</span>
              </div>
              {cList.map(c => (
                <div key={c._id} onClick={() => { setSelectedConstituency(c._id); fetchBooths(c._id); }}
                  className={`flex items-center justify-between px-4 py-3 text-sm border-b border-border/50 last:border-0 cursor-pointer transition-colors ${selectedConstituency === c._id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/30'}`}>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.district}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Booth cards */}
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Polling Booths {selectedConstituency && `— ${constituencies.find(c => c._id === selectedConstituency)?.name}`}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooths.length === 0 ? (
            <p className="text-muted-foreground text-sm col-span-3 py-4 text-center">No booths found.</p>
          ) : filteredBooths.map(b => {
            const pct = b.currentAssigned > 0 ? Math.round((b.currentAssigned / b.maxCapacity) * 100) : 0;
            return (
              <div key={b._id} className="bg-background border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-sm">{b.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${pct > 80 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                    {pct}% full
                  </span>
                </div>
                {b.location && <p className="text-xs text-muted-foreground">{b.location}</p>}
                <div className="w-full bg-border rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${pct > 80 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.currentAssigned} assigned</span>
                  <span>Max: {b.maxCapacity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GeoManager;
