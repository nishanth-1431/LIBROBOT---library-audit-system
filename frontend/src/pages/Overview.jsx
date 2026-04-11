import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Database, BookOpen, PieChart as PieIcon, AlertTriangle, CheckCircle, BarChart3, MapPin, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Sidebar from '../components/Sidebar';

export default function Overview() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [auditStatus, setAuditStatus] = useState({ available: [], missing: [], misplaced: [], safely_issued: [] });
    const [loading, setLoading] = useState(true);
    const API_BASE = import.meta.env.PROD ? '' : 'http://127.0.0.1:5000';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [booksRes, statusRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/books`),
                    axios.get(`${API_BASE}/status`)
                ]);
                setBooks(Object.values(booksRes.data));
                setAuditStatus(statusRes.data);
            } catch (err) {
                console.error("Failed to load overview data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Analytics Calculations
    const totalBooks = books.length;
    const missingCount = auditStatus.missing?.length || 0;
    const misplacedCount = auditStatus.misplaced?.length || 0;
    const foundCount = auditStatus.available?.length || 0;

    const statusData = useMemo(() => [
        { name: 'Found', value: foundCount, color: '#10b981' },
        { name: 'Missing', value: missingCount, color: '#ef4444' },
        { name: 'Misplaced', value: misplacedCount, color: '#f59e0b' }
    ].filter(d => d.value > 0), [foundCount, missingCount, misplacedCount]);

    // Critical Flags List (Missing & Misplaced)
    const auditFlags = useMemo(() => {
        const flags = [];
        (auditStatus.missing || []).forEach(b => flags.push({ ...b, flag_type: 'MISSING', severity: 'high' }));
        (auditStatus.misplaced || []).forEach(b => flags.push({ ...b, flag_type: 'MISPLACED', severity: 'medium' }));
        return flags.sort((a, b) => b.flag_type.localeCompare(a.flag_type));
    }, [auditStatus]);

    // Dept Breakdown of all books
    const deptDistribution = useMemo(() => {
        const depts = {};
        books.forEach(b => {
            const d = b.department || 'General';
            depts[d] = (depts[d] || 0) + 1;
        });
        return Object.entries(depts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [books]);

    return (
        <div className="min-h-screen bg-background text-textMain flex overflow-hidden font-sans">
            {/* Ambient glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
            
            <Sidebar subtitle="Library Intelligence" />

            {/* ── Main ───────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden px-8 pt-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-textMain">Library Intelligence</h2>
                        <p className="text-xs text-textDim mt-1 uppercase tracking-wider">Inventory Health & Audit Status</p>
                    </div>
                    {auditStatus.target_shelf && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                            <MapPin size={14} className="text-primary" />
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">Active Audit: {auditStatus.target_shelf}</span>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-primary">
                            <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8 max-w-6xl">
                            {/* Top Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Inventory', val: totalBooks, icon: Database, color: 'text-primary', bg: 'bg-primary/10' },
                                    { label: 'Verified Found', val: foundCount, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'Missing Items', val: missingCount, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                                    { label: 'Misplaced Label', val: misplacedCount, icon: PieIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                ].map((s, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-5 bg-surface/30 rounded-2xl flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                                            <s.icon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-textDim tracking-widest">{s.label}</p>
                                            <p className="text-2xl font-black text-textMain">{s.val}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Audit Status Chart */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1 glass-panel p-6 bg-surface/30 rounded-2xl">
                                    <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                        <PieIcon size={14} className="text-primary" /> Session Audit Quality
                                    </h3>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} itemStyle={{ color: '#f8fafc' }} />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-center text-[10px] text-textDim uppercase font-bold tracking-widest mt-2">
                                        {auditStatus.target_shelf ? `Shelf ${auditStatus.target_shelf} specific audit scan` : 'Overall inventory scan session'}
                                    </p>
                                </motion.div>

                                {/* Audit Alert Flags */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 glass-panel p-6 bg-surface/30 rounded-2xl flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                            <AlertTriangle size={14} /> Critical Audit Flags
                                        </h3>
                                        <div className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full font-bold">
                                            {auditFlags.length} ISSUES
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar h-[250px] relative">
                                        {auditFlags.length === 0 ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-textDim/50 gap-2">
                                                <CheckCircle size={32} className="text-emerald-500/30" />
                                                <p className="text-xs uppercase tracking-widest font-semibold mt-2">Inventory fully accounted for</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/30">
                                                {auditFlags.map((b, i) => (
                                                    <div key={b.barcode + i} className="py-3 flex justify-between items-center group hover:bg-surface/50 px-2 rounded-lg transition-colors">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-textMain">{b.name}</span>
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${b.flag_type === 'MISSING' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                    {b.flag_type}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-textDim uppercase font-mono mt-0.5">Barcode: {b.barcode} · Dept: {b.department}</span>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end">
                                                            <div className="flex items-center gap-1.5 text-textDim">
                                                                <MapPin size={10} className="text-primary/60" />
                                                                <span className="text-[10px] font-bold font-mono">Registered: {b.shelf || 'A1'}</span>
                                                            </div>
                                                            {b.found_on_shelf && (
                                                                <div className="flex items-center gap-1.5 text-amber-400 mt-1">
                                                                    <AlertTriangle size={10} />
                                                                    <span className="text-[10px] font-bold font-mono">Found On: {b.found_on_shelf}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Departmental Composition Bar Chart or Table */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6 bg-surface/30 rounded-2xl">
                                <h3 className="text-sm font-bold text-textMain mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                    <BarChart3 size={14} className="text-violet-500" /> Departmental Distribution
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {deptDistribution.map((d, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/40 flex flex-col items-center text-center">
                                            <p className="text-[10px] font-bold text-textDim uppercase tracking-tight mb-1 truncate w-full">{d.name}</p>
                                            <p className="text-xl font-black text-textMain">{d.value}</p>
                                            <div className="w-full h-1 bg-border/40 rounded-full mt-2 overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary/60" 
                                                    style={{ width: `${(d.value / totalBooks) * 100}%` }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
