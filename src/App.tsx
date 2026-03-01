import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Trophy, 
  Plus, 
  Minus, 
  Activity, 
  Trash2, 
  CheckCircle2, 
  LayoutDashboard, 
  Settings2,
  Table as TableIcon,
  ChevronRight,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, Sport, ServerToClientEvents, ClientToServerEvents } from './types';

const SPORTS: (Sport | 'All')[] = ['All', 'Football', 'Basketball', 'Cricket', 'Volleyball', 'Badminton', 'Table Tennis'];

const SPORT_PERIODS: Record<Sport, string[]> = {
  'Football': ['1st Half', 'Half Time', '2nd Half', 'Full Time'],
  'Basketball': ['Q1', 'Q2', 'Half Time', 'Q3', 'Q4', 'Full Time'],
  'Volleyball': ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5', 'Finished'],
  'Cricket': ['1st Innings', 'Innings Break', '2nd Innings', 'Finished'],
  'Badminton': ['Set 1', 'Set 2', 'Set 3', 'Finished'],
  'Table Tennis': ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5', 'Finished']
};

export default function App() {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<number | null>(null);

  // Form state
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [newMatchSport, setNewMatchSport] = useState<Sport>('Football');

  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
    setSocket(newSocket);

    newSocket.on('matches:init', (initialMatches) => {
      setMatches(initialMatches);
    });

    newSocket.on('match:created', (newMatch) => {
      setMatches(prev => [...prev, newMatch]);
    });

    newSocket.on('match:updated', (updatedMatch) => {
      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    });

    newSocket.on('match:deleted', (id) => {
      setMatches(prev => prev.filter(m => m.id !== id));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && teamA && teamB) {
      socket.emit('match:create', { sport: newMatchSport, teamA, teamB });
      setTeamA('');
      setTeamB('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleUpdateScore = (id: number, team: 'A' | 'B', delta: number) => {
    socket?.emit('match:updateScore', { id, team, delta });
  };

  const handleUpdatePeriod = (id: number, period: string) => {
    socket?.emit('match:updatePeriod', { id, period });
  };

  const handleFinishMatch = (id: number) => {
    socket?.emit('match:finish', id);
  };

  const handleDeleteMatch = (id: number) => {
    if (deletingMatchId === id) {
      console.log('Emitting match:delete for ID:', id);
      socket?.emit('match:delete', id);
      setDeletingMatchId(null);
    } else {
      setDeletingMatchId(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => {
        setDeletingMatchId(prev => prev === id ? null : prev);
      }, 3000);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') { // Simple password for demo
      setIsOrganizer(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Invalid password');
    }
  };

  const filteredMatches = useMemo(() => {
    if (selectedSport === 'All') return matches;
    return matches.filter(m => m.sport === selectedSport);
  }, [matches, selectedSport]);

  const liveMatches = filteredMatches.filter(m => m.status === 'Live');
  const finishedMatches = filteredMatches.filter(m => m.status === 'Finished');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-[#111111] border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Trophy className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ArenaLive</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tournament Hub</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 px-2">Navigation</p>
          <button 
            onClick={() => setShowDataTable(false)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${!showDataTable ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              Live Scoreboard
            </div>
            {matches.filter(m => m.status === 'Live').length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
          <button 
            onClick={() => setShowDataTable(true)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showDataTable ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <TableIcon className="w-4 h-4" />
            Tournament Archive
          </button>
        </nav>

        <div className="flex flex-col gap-4 mt-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-2">Access Control</p>
          {isOrganizer ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                Organizer Mode Active
              </div>
              <button 
                onClick={() => setIsOrganizer(false)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-xs font-bold transition-colors"
              >
                <Lock className="w-4 h-4" />
                Logout Admin
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-xs font-bold transition-colors"
            >
              <Unlock className="w-4 h-4" />
              Organizer Login
            </button>
          )}
        </div>

        {isOrganizer && !showDataTable && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-2 text-white">
              <Settings2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold">Launch Match</h2>
            </div>
            <form onSubmit={handleCreateMatch} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-white/30">Sport</label>
                <select 
                  value={newMatchSport}
                  onChange={(e) => setNewMatchSport(e.target.value as Sport)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {SPORTS.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-white/30">Team A</label>
                <input 
                  type="text" 
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  placeholder="Home Team"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-white/30">Team B</label>
                <input 
                  type="text" 
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  placeholder="Away Team"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-500 text-black rounded-lg py-2 text-sm font-bold hover:bg-emerald-400 transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Match
              </button>
            </form>
          </motion.div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 right-8 z-[100] bg-emerald-500 text-black px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5" />
              Match Created Successfully!
            </motion.div>
          )}

          {showAdminLogin && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#111111] border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl"
              >
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="p-4 bg-emerald-500/10 rounded-full">
                    <ShieldAlert className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Admin Access</h2>
                  <p className="text-white/40 text-sm text-center">Enter the organizer password to unlock match controls.</p>
                </div>
                <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Password (admin123)"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-emerald-500 text-black py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all"
                    >
                      Unlock
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showDataTable ? (
          <div className="max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-2">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-5xl font-black tracking-tighter uppercase italic"
                >
                  {selectedSport === 'All' ? 'Global Arena' : selectedSport}
                </motion.h2>
                <p className="text-white/40 font-mono text-xs tracking-widest uppercase">
                  {liveMatches.length} Live Matches • {finishedMatches.length} Completed
                </p>
              </div>
              <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                {SPORTS.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${selectedSport === sport ? 'bg-emerald-500 text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </header>

            {/* Live Matches Section */}
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <h3 className="text-sm font-black uppercase tracking-widest italic">Live Action</h3>
              </div>
              
              {liveMatches.length === 0 ? (
                <div className="bg-white/5 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                  <Activity className="w-12 h-12 text-white/10 mb-4" />
                  <p className="text-white/40 font-medium">No live matches currently in progress.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AnimatePresence mode="popLayout">
                    {liveMatches.map(match => (
                      <motion.div
                        key={match.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative bg-[#111111] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-6">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-3 py-1 rounded-full">
                            {match.sport}
                          </span>
                        </div>
                        
                        <div className="p-8">
                          <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              {match.period}
                            </div>
                            <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest">
                              <Clock className="w-3 h-3" />
                              {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-8">
                            <div className="text-right">
                              <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-1 leading-none">{match.teamA}</h4>
                              <p className="text-[10px] font-bold uppercase text-white/20">Home</p>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                              <span className="text-5xl font-black italic tracking-tighter text-emerald-500">{match.scoreA}</span>
                              <span className="text-white/10 text-2xl font-light">-</span>
                              <span className="text-5xl font-black italic tracking-tighter text-emerald-500">{match.scoreB}</span>
                            </div>

                            <div className="text-left">
                              <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-1 leading-none">{match.teamB}</h4>
                              <p className="text-[10px] font-bold uppercase text-white/20">Away</p>
                            </div>
                          </div>
                        </div>

                        {isOrganizer && (
                          <div className="bg-white/5 border-t border-white/5 p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleUpdateScore(match.id, 'A', -1)}
                                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleUpdateScore(match.id, 'A', 1)}
                                  className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                  Score {match.teamA}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleUpdateScore(match.id, 'B', 1)}
                                  className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                  Score {match.teamB}
                                </button>
                                <button 
                                  onClick={() => handleUpdateScore(match.id, 'B', -1)}
                                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex gap-4">
                              <select 
                                value={match.period}
                                onChange={(e) => handleUpdatePeriod(match.id, e.target.value)}
                                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              >
                                {SPORT_PERIODS[match.sport].map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleFinishMatch(match.id)}
                                className="flex-1 bg-emerald-500 text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg"
                              >
                                Finalize Match
                              </button>
                              <button 
                                onClick={() => handleDeleteMatch(match.id)}
                                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${deletingMatchId === match.id ? 'bg-rose-500 text-white animate-pulse px-4' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'}`}
                              >
                                {deletingMatchId === match.id ? (
                                  <>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Confirm?</span>
                                    <Trash2 className="w-4 h-4" />
                                  </>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Completed Matches Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                <h3 className="text-sm font-black uppercase tracking-widest italic text-white/40">Tournament Results</h3>
              </div>

              {finishedMatches.length === 0 ? (
                <p className="text-white/20 text-sm italic">No completed matches yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finishedMatches.map(match => (
                    <motion.div 
                      key={match.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{match.sport}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Final</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className={`text-lg font-black italic uppercase tracking-tighter ${match.scoreA > match.scoreB ? 'text-emerald-500' : 'text-white/60'}`}>
                            {match.teamA}
                          </span>
                          <span className={`text-lg font-black italic uppercase tracking-tighter ${match.scoreB > match.scoreA ? 'text-emerald-500' : 'text-white/60'}`}>
                            {match.teamB}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-lg font-black italic ${match.scoreA > match.scoreB ? 'text-emerald-500' : 'text-white/60'}`}>{match.scoreA}</span>
                          <span className={`text-lg font-black italic ${match.scoreB > match.scoreA ? 'text-emerald-500' : 'text-white/60'}`}>{match.scoreB}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/20 uppercase">{new Date(match.startTime).toLocaleDateString()}</span>
                        {isOrganizer && (
                          <button 
                            onClick={() => handleDeleteMatch(match.id)}
                            className={`transition-all flex items-center gap-1 ${deletingMatchId === match.id ? 'text-rose-500 font-black animate-pulse' : 'text-rose-500/40 hover:text-rose-500'}`}
                          >
                            {deletingMatchId === match.id && <span className="text-[8px] uppercase">Confirm?</span>}
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <header className="mb-12">
              <h2 className="text-5xl font-black tracking-tighter uppercase italic">Tournament Archive</h2>
              <p className="text-white/40 font-mono text-xs tracking-widest uppercase">Historical Record of All Matches</p>
            </header>

            <div className="bg-[#111111] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Sport</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Matchup</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Result</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Date</th>
                      {isOrganizer && <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {matches.map(match => (
                      <tr key={match.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-xs font-black uppercase tracking-widest text-white/60">{match.sport}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3 text-sm font-black italic uppercase tracking-tighter">
                            <span className={match.scoreA > match.scoreB ? 'text-emerald-500' : 'text-white'}>{match.teamA}</span>
                            <span className="text-white/10 font-normal not-italic">vs</span>
                            <span className={match.scoreB > match.scoreA ? 'text-emerald-500' : 'text-white'}>{match.teamB}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-mono font-black text-emerald-500 italic">{match.scoreA} - {match.scoreB}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${match.status === 'Live' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'}`}>
                            {match.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-bold text-white/20 uppercase">{new Date(match.startTime).toLocaleString()}</span>
                        </td>
                        {isOrganizer && (
                          <td className="px-8 py-6">
                            <button 
                              onClick={() => handleDeleteMatch(match.id)}
                              className={`transition-all flex items-center gap-2 ${deletingMatchId === match.id ? 'text-rose-500 font-black animate-pulse' : 'text-rose-500/40 hover:text-rose-500'}`}
                            >
                              {deletingMatchId === match.id && <span className="text-[10px] uppercase">Confirm?</span>}
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {matches.length === 0 && (
                      <tr>
                        <td colSpan={isOrganizer ? 6 : 5} className="px-8 py-20 text-center text-white/20 text-sm italic">
                          Archive is currently empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


