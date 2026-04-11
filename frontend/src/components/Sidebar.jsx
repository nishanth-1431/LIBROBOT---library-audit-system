import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    BookOpen, ScanLine, Database, BarChart3, LogOut, BookMarked, AlertTriangle, MapPin
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/overview',   label: 'Overview',        icon: BarChart3 },
    { path: '/dashboard',  label: 'Live Dashboard',  icon: ScanLine },
    { path: '/misplaced',  label: 'Misplaced Books', icon: AlertTriangle },
    { path: '/admin',      label: 'Admin Panel',     icon: Database },
];

// We will fetch this from the backend
// const SHELF_LEGEND = [ ... ];

export default function Sidebar({ subtitle = '', extraNav = null }) {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { currentUser, logout } = useAuth();
    const [shelfMap, setShelfMap] = React.useState({});
    const API_BASE = import.meta.env.PROD ? '' : 'http://127.0.0.1:5000';

    React.useEffect(() => {
        const fetchShelves = async () => {
            try {
                const res = await (await fetch(`${API_BASE}/api/shelves`)).json();
                setShelfMap(res.shelf_map || {});
            } catch (e) {
                console.error("Sidebar shelf fetch failed", e);
            }
        };
        fetchShelves();
    }, []);

    const handleLogout = async () => {
        try { await logout(); navigate('/login'); }
        catch (e) { console.error('Logout failed', e); }
    };

    return (
        <aside className="w-60 bg-sidebar border-r border-border backdrop-blur-xl flex flex-col z-10 shrink-0 transition-colors">
            {/* ── Logo ── */}
            <div className="p-6 border-b border-border/50">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2.5 mb-1 group focus:outline-none w-full text-left"
                    title="Return Home"
                >
                    <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                        <BookMarked size={13} className="text-primary" />
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase text-textMain group-hover:text-primary transition-colors">LIBRO-BOT</span>
                </button>
                {subtitle && (
                    <p className="text-[10px] text-textDim uppercase tracking-widest ml-9 font-semibold">{subtitle}</p>
                )}
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                <p className="px-3 py-2 text-[9px] text-textDim uppercase tracking-widest font-bold mb-1">Navigation</p>

                {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                    const active = location.pathname === path;
                    const isMisplaced = path === '/misplaced';
                    return (
                        <motion.button
                            key={path}
                            onClick={() => navigate(path)}
                            whileHover={{ x: active ? 0 : 2 }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                active
                                    ? isMisplaced
                                        ? 'bg-warning/10 text-warning border border-warning/20 font-semibold'
                                        : 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                                    : 'text-textDim hover:bg-surface hover:text-textMain border border-transparent'
                            }`}
                        >
                            <Icon
                                size={15}
                                className={active ? (isMisplaced ? 'text-warning' : 'text-primary') : ''}
                            />
                            <span>{label}</span>
                            {active && (
                                <span className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse ${isMisplaced ? 'bg-warning' : 'bg-primary'}`} />
                            )}
                        </motion.button>
                    );
                })}

                {extraNav && (
                    <>
                        <div className="h-px bg-border/40 my-3" />
                        {extraNav}
                    </>
                )}

                {/* ── Shelf Map Legend ── */}
                <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="px-3 py-1 text-[9px] text-textDim uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                        <MapPin size={9} /> Shelf Map
                    </p>
                    <div className="space-y-0.5 px-1">
                        {Object.entries(shelfMap).map(([dept, shelf]) => (
                            <div key={dept} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface/50 transition-colors group">
                                <span className="w-7 text-center text-[10px] font-black text-primary/70 bg-primary/8 border border-primary/15 rounded px-1 py-0.5 font-mono shrink-0">{shelf}</span>
                                <span className="text-[10px] text-textDim group-hover:text-textMain transition-colors truncate">{dept}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </nav>

            {/* ── User & Sign Out ── */}
            <div className="p-4 border-t border-border/50 space-y-3">
                {currentUser && (
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-xs">{currentUser.email?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-textMain truncate">{currentUser.email}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-emerald-500">Active session</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full py-2 bg-rose-500/8 hover:bg-rose-500/15 text-rose-400 rounded-lg text-xs font-semibold transition-colors border border-rose-500/15 flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                    <LogOut size={13} /> Sign Out
                </button>
            </div>
        </aside>
    );
}
