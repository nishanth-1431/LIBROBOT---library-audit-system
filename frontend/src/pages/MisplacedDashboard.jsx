import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../socket';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
    AlertTriangle, CheckCircle, MapPin, BookOpen, RefreshCw,
    ArrowRight, Search, Download, Activity, Layers, Shield
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';

/* ── Helpers ── */
const SHELF_COLORS = {
    A1: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
    B1: { text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
    C1: { text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30' },
    D1: { text: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
    E1: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    F1: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    G1: { text: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30' },
};
const getShelfStyle = (shelf) =>
    SHELF_COLORS[shelf] || { text: 'text-textDim', bg: 'bg-surface/50', border: 'border-border/50' };

const ShelfBadge = ({ shelf, size = 'sm' }) => {
    const s = getShelfStyle(shelf);
    return (
        <span className={`inline-flex items-center gap-1 rounded-lg border font-mono font-black uppercase tracking-widest
            ${s.text} ${s.bg} ${s.border}
            ${size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-[11px]'}`}>
            <MapPin size={size === 'lg' ? 12 : 9} />
            {shelf}
        </span>
    );
};

/* ── stat card ── */
const StatCard = ({ icon: Icon, label, value, color, glow }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 flex items-center gap-4"
        style={{ boxShadow: glow ? `0 0 30px ${glow}15` : undefined }}
    >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon size={20} style={{ color }} />
        </div>
        <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-textDim">{label}</p>
            <p className="text-2xl font-black text-textMain leading-tight mt-0.5">{value}</p>
        </div>
    </motion.div>
);

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function MisplacedDashboard() {
    const [misplaced, setMisplaced]   = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterShelf, setFilterShelf] = useState('All');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLive, setIsLive]           = useState(true);

    /* Fetch status and extract misplaced */
    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE}/status`);
            setMisplaced(res.data.misplaced || []);
            setLastUpdated(new Date());
        } catch (e) {
            console.error('Failed to fetch status', e);
        }
    };

    useEffect(() => {
        fetchStatus();

        /* Listen to live socket events */
        const onNewScan = (data) => {
            if (data.full_status?.misplaced) {
                setMisplaced(data.full_status.misplaced);
                setLastUpdated(new Date());
            }
        };
        const onReset = (data) => {
            setMisplaced(data.misplaced || []);
            setLastUpdated(new Date());
        };
        const onInitial = (data) => {
            setMisplaced(data.misplaced || []);
            setLastUpdated(new Date());
        };

        socket.on('new_scan',      onNewScan);
        socket.on('session_reset', onReset);
        socket.on('initial_state', onInitial);

        return () => {
            socket.off('new_scan',      onNewScan);
            socket.off('session_reset', onReset);
            socket.off('initial_state', onInitial);
        };
    }, []);

    /* Filtered list */
    const filtered = useMemo(() => {
        return misplaced.filter(b => {
            const matchSearch =
                b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.department || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchShelf = filterShelf === 'All' || b.shelf === filterShelf || b.found_on_shelf === filterShelf;
            return matchSearch && matchShelf;
        });
    }, [misplaced, searchTerm, filterShelf]);

    /* Aggregate: how many books per wrong shelf */
    const shelfGroups = useMemo(() => {
        const groups = {};
        misplaced.forEach(b => {
            const key = b.shelf || 'Unknown';
            groups[key] = (groups[key] || 0) + 1;
        });
        return Object.entries(groups).sort((a, b) => b[1] - a[1]);
    }, [misplaced]);

    const uniqueShelves = useMemo(() => {
        const s = new Set(misplaced.flatMap(b => [b.shelf, b.found_on_shelf].filter(Boolean)));
        return ['All', ...Array.from(s).sort()];
    }, [misplaced]);

    const handleExport = () => {
        window.open(`${API_BASE}/export_word`, '_blank');
    };

    return (
        <div className="min-h-screen bg-background text-textMain flex overflow-hidden font-sans transition-colors duration-300">
            {/* Ambient glows */}
            <div className="fixed top-0 right-0 w-[500px] h-[400px] bg-warning/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[400px] h-[300px] bg-danger/5 rounded-full blur-[100px] pointer-events-none" />

            <Sidebar subtitle="Misplaced Books" />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* ── Header ── */}
                <header className="px-8 pt-8 pb-6 border-b border-border/50 bg-header/80 backdrop-blur-sm shrink-0">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-9 h-9 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center">
                                    <AlertTriangle size={18} className="text-warning" />
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-textMain">Misplaced Books</h1>
                                {misplaced.length > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="px-2.5 py-0.5 bg-warning/15 text-warning border border-warning/30 rounded-full text-xs font-black"
                                    >
                                        {misplaced.length} flagged
                                    </motion.span>
                                )}
                            </div>
                            <p className="text-xs text-textDim ml-12">
                                Books detected on a shelf other than their registered location
                            </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={fetchStatus}
                                className="flex items-center gap-1.5 px-3 py-2 bg-surface/60 hover:bg-surface text-textDim hover:text-textMain text-xs font-semibold rounded-lg border border-border transition-all uppercase tracking-wider"
                            >
                                <RefreshCw size={13} /> Refresh
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1.5 px-3 py-2 bg-primary/90 hover:bg-primary text-white text-xs font-bold rounded-lg transition-all uppercase tracking-wider shadow-[0_2px_10px_rgba(var(--primary-rgb),0.25)]"
                            >
                                <Download size={13} /> Export Report
                            </button>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center gap-2 mt-4 ml-12">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Live Feed</span>
                        </div>
                        {lastUpdated && (
                            <span className="text-[10px] text-textDim">
                                · Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard icon={AlertTriangle} label="Total Misplaced" value={misplaced.length} color="#f59e0b" glow="#f59e0b" />
                        <StatCard icon={Layers}        label="Affected Shelves" value={shelfGroups.length} color="#8b5cf6" />
                        <StatCard icon={Shield}        label="In Correct Shelf" value="—" color="#10b981" />
                    </div>

                    {/* ── Shelf Breakdown Pills ── */}
                    {shelfGroups.length > 0 && (
                        <div className="glass-panel p-5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-textDim mb-4 flex items-center gap-2">
                                <Activity size={13} /> Books Found Outside Registered Shelf
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {shelfGroups.map(([shelf, count]) => {
                                    const s = getShelfStyle(shelf);
                                    return (
                                        <motion.div
                                            key={shelf}
                                            whileHover={{ scale: 1.04 }}
                                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${s.bg} ${s.border} cursor-pointer`}
                                            onClick={() => setFilterShelf(shelf === filterShelf ? 'All' : shelf)}
                                        >
                                            <MapPin size={13} className={s.text} />
                                            <span className={`font-black font-mono text-sm ${s.text}`}>{shelf}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${s.bg} ${s.text} border ${s.border}`}>{count}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Table ── */}
                    <div className="glass-panel overflow-hidden flex flex-col">
                        {/* Table Controls */}
                        <div className="px-5 py-4 border-b border-border/50 bg-surface/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-textMain text-sm uppercase tracking-wider">Misplaced Book Registry</h2>
                                <span className="px-2 py-0.5 bg-warning/15 text-warning text-[10px] font-black rounded border border-warning/30">
                                    {filtered.length} records
                                </span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-52">
                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textDim" />
                                    <input
                                        type="text"
                                        placeholder="Search books..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-textMain focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <select
                                    value={filterShelf}
                                    onChange={e => setFilterShelf(e.target.value)}
                                    className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-textMain focus:outline-none focus:border-primary cursor-pointer"
                                >
                                    {uniqueShelves.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Table Header */}
                        <div className="bg-background/80 border-b border-border/50 sticky top-0">
                            <div className="grid grid-cols-[50px_2.5fr_1.5fr_1fr_130px_130px] gap-4 px-6 py-3">
                                {['#', 'Book', 'Author', 'Department', 'Registered Shelf', 'Found On Shelf'].map(h => (
                                    <div key={h} className="text-[10px] font-bold text-textDim uppercase tracking-widest">{h}</div>
                                ))}
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-textDim gap-4">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 3 }}
                                        className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center"
                                    >
                                        <CheckCircle size={28} className="text-success/60" />
                                    </motion.div>
                                    <div className="text-center">
                                        <p className="font-bold text-textMain">No misplaced books detected</p>
                                        <p className="text-xs text-textDim mt-1">
                                            {misplaced.length === 0
                                                ? 'Start a scan session to detect misplaced books'
                                                : 'No results match your current filter'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/20">
                                    <AnimatePresence initial={false}>
                                        {filtered.map((book, idx) => {
                                            const regStyle   = getShelfStyle(book.shelf || '?');
                                            const foundStyle = getShelfStyle(book.found_on_shelf || '?');
                                            return (
                                                <motion.div
                                                    key={book.barcode + idx}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.4) }}
                                                    className="grid grid-cols-[50px_2.5fr_1.5fr_1fr_130px_130px] gap-4 px-6 py-4 items-center hover:bg-warning/4 transition-all border-l-2 border-transparent hover:border-warning/40 group"
                                                >
                                                    <div className="text-xs font-mono text-textDim">{idx + 1}</div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-textMain group-hover:text-warning transition-colors truncate">{book.name}</div>
                                                        <div className="text-[10px] font-mono text-textDim mt-0.5">{book.barcode}</div>
                                                    </div>
                                                    <div className="text-xs text-textDim truncate italic">{book.author}</div>
                                                    <div className="text-[11px] font-bold text-textDim uppercase tracking-tight truncate">{book.department || 'General'}</div>
                                                    <div>
                                                        <ShelfBadge shelf={book.shelf || '?'} />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <ArrowRight size={12} className="text-warning shrink-0" />
                                                        <ShelfBadge shelf={book.found_on_shelf || '?'} />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
