import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../socket';
import { 
    Camera, CalendarClock, Download, RefreshCw, CheckCircle, AlertTriangle, XCircle, Search, Filter, ScanLine, Play, Pause, Square, Database, Book as BookIcon, Settings, Volume2, Shield, Activity, Monitor, Palette, Globe, Lock, Moon, Sun, BarChart3, PieChart as PieIcon, TrendingUp, ChevronLeft, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

// --- ANIMATED COUNTER ---
const AnimatedCounter = ({ value, color }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        let start = displayValue;
        const end = value;
        if (start === end) return;

        let totalDuration = 500;
        let frameRate = 1000 / 60;
        let totalFrames = Math.round(totalDuration / frameRate);
        let frame = 0;

        const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easedProgress);
            
            setDisplayValue(current);

            if (frame === totalFrames) {
                clearInterval(timer);
            }
        }, frameRate);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <motion.div
            key={value}
            initial={{ scale: 1.2, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="text-xl font-black leading-none"
            style={{ color: displayValue !== value ? color : 'var(--text-main)' }}
        >
            {displayValue}
        </motion.div>
    );
};

// --- SCAN RIPPLE ---
const ScanRipple = ({ active }) => (
    <AnimatePresence>
        {active && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.5] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 z-10 pointer-events-none border-4 border-primary/50 bg-primary/10 rounded-2xl"
            />
        )}
    </AnimatePresence>
);

// --- SLIM PAGE HEADER (used inside main next to Sidebar) ---
const PageHeader = ({ stats, handleReset, onOpenSettings, onAnalyticsToggle, showAnalytics }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleExport = () => {
        const url = import.meta.env.PROD ? '/export_word' : 'http://localhost:5000/export_word';
        window.open(url, '_blank');
    };

    return (
        <header className="shrink-0 bg-header/90 backdrop-blur-xl border-b border-border/60 px-6 py-3 flex items-center justify-between gap-4 transition-colors">
            {/* Left: Time */}
            <div className="flex items-center gap-2 text-[11px] text-textDim font-mono">
                <CalendarClock size={13} className="text-primary/60" />
                <span>{currentTime.toLocaleDateString()} · {currentTime.toLocaleTimeString()}</span>
            </div>

            {/* Center: Stat Pills */}
            <div className="flex gap-2">
                {[
                    { label: 'Total', value: stats.totalScans, color: 'var(--primary)' },
                    { label: 'Unique', value: stats.uniqueScans, color: 'var(--success)' },
                    { label: 'Dupes', value: stats.duplicates, color: 'var(--warning)' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/60 border border-border/50">
                        <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color }}>{label}</div>
                        <AnimatedCounter value={value} color={color} />
                    </div>
                ))}
            </div>

            {/* Right: Actions */}
            <div className="flex gap-1.5">
                <button
                    onClick={onAnalyticsToggle}
                    title={showAnalytics ? 'Exit Intelligence View' : 'Open Analytics'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all uppercase tracking-wider ${showAnalytics ? 'bg-primary text-white border-primary' : 'bg-surface/60 hover:bg-surface text-textDim hover:text-textMain border-border/50'}`}
                >
                    <BarChart3 size={13} /> Intel
                </button>
                <button onClick={handleReset} title="Reset Session" className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/60 hover:bg-surface text-textDim text-xs font-semibold rounded-lg border border-border/50 hover:border-border transition-all uppercase tracking-wider">
                    <RefreshCw size={13} /> Reset
                </button>
                <button onClick={onOpenSettings} title="Settings" className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/60 hover:bg-surface text-textDim text-xs font-semibold rounded-lg border border-border/50 hover:border-border transition-all uppercase tracking-wider">
                    <Settings size={13} /> Settings
                </button>
                <button onClick={handleExport} title="Export Word Report" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/90 hover:bg-primary text-white text-xs font-bold rounded-lg transition-all uppercase tracking-wider shadow-[0_2px_10px_rgba(var(--primary-rgb),0.25)]">
                    <Download size={13} /> Export
                </button>
            </div>
        </header>
    );
};

// --- CAMERA FEED CARD ---
const CameraCard = ({ videoUrl, isScanning, lastScanTime, cameraState, handleCameraControl, showTelemetry, shelves, targetShelf, onTargetShelfChange }) => {
    const [telemetry, setTelemetry] = useState({ fps: 0, ping: 0 });
    const cardRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    useEffect(() => {
        if (cameraState !== 'PLAYING') {
            setTelemetry({ fps: 0, ping: 0 });
            return;
        }

        // Initial set
        setTelemetry({ fps: 29, ping: 48 });

        const interval = setInterval(() => {
            setTelemetry({
                fps: Math.floor(Math.random() * (30 - 24 + 1)) + 24, // 24-30 FPS
                ping: Math.floor(Math.random() * (60 - 45 + 1)) + 45   // 45-60 ms
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [cameraState]);

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className="glass-panel overflow-hidden flex flex-col h-full bg-surface transition-colors duration-300 group/card relative"
        >
            {/* Spotlight effect */}
            <div 
                className="absolute inset-0 z-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--primary-rgb), 0.05), transparent 40%)`
                }}
            />

            <div className="px-4 py-3 border-b border-border/50 flex flex-col gap-2 bg-surface/50 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                    <h2 className="font-semibold text-textMain flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cameraState === 'PLAYING' ? 'bg-success animate-pulse' : cameraState === 'PAUSED' ? 'bg-warning' : 'bg-danger'}`} /> Vision Feed
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Target Shelf Selector */}
                        <div className="flex items-center gap-2 border-r border-border/50 pr-3">
                            <span className="text-[10px] uppercase font-bold text-textDim tracking-wider hidden sm:block">Target Shelf:</span>
                            <select 
                                value={targetShelf} 
                                onChange={(e) => onTargetShelfChange(e.target.value)}
                                className="bg-background border border-border/60 rounded px-2 py-1 text-xs text-textMain focus:outline-none focus:border-primary transition-colors cursor-pointer w-[130px] shadow-sm"
                                disabled={cameraState === 'PLAYING'}
                                title={cameraState === 'PLAYING' ? "Cannot change shelf while camera is running" : "Select target shelf for intelligent audit"}
                            >
                                <option value="">General Audit</option>
                                {shelves.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleCameraControl('start')} className={`p-1.5 rounded-lg transition-colors ${cameraState === 'PLAYING' ? 'bg-success/20 text-success' : 'hover:bg-surface text-textDim hover:text-textMain'}`} title="Start Camera">
                                <Play size={16} />
                            </button>
                            <button onClick={() => handleCameraControl('pause')} className={`p-1.5 rounded-lg transition-colors ${cameraState === 'PAUSED' ? 'bg-warning/20 text-warning' : 'hover:bg-surface text-textDim hover:text-textMain'}`} title="Pause Camera">
                                <Pause size={16} />
                            </button>
                            <button onClick={() => handleCameraControl('stop')} className={`p-1.5 rounded-lg transition-colors ${cameraState === 'STOPPED' ? 'bg-danger/20 text-danger' : 'hover:bg-surface text-textDim hover:text-textMain'}`} title="Stop Camera">
                                <Square size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-textDim font-mono">
                    {isScanning ? (
                        <span className="text-primary font-medium animate-pulse">Scanning array...</span>
                    ) : lastScanTime ? (
                        <span>Last Scan: {lastScanTime.toLocaleTimeString()}</span>
                    ) : (
                        <span>Awaiting input</span>
                    )}
                </div>
            </div>
            <div className={`bg-black flex-1 relative flex items-center justify-center p-2 overflow-hidden bg-black overflow-hidden group`}>
                <ScanRipple active={isScanning} />
                {/* Full-card Camera Flash Effect on Scan */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 1, backgroundColor: '#ffffff' }}
                            animate={{ opacity: 0, backgroundColor: '#ffffff' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute inset-0 z-30 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {cameraState === 'STOPPED' ? (
                    <div className="flex flex-col items-center justify-center text-slate-500 h-full w-full">
                        <Camera size={48} className="mb-4 opacity-30" />
                        <p>Camera is Stopped.</p>
                        <p className="text-sm mt-2">Press Play to start the session.</p>
                    </div>
                ) : (
                    <>
                        <img
                            src={videoUrl || ''}
                            alt="Camera Feed"
                            className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-contain rounded-lg border border-slate-800 z-10"
                        />
                    </>
                )}
            </div>

            {/* Hardware Health Telemetry Bar */}
            {showTelemetry && (
                <div className="px-4 py-2 border-t border-border/50 bg-background/80 backdrop-blur-sm flex justify-between items-center text-[10px] text-textDim font-mono uppercase tracking-wider relative z-20">
                    <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${cameraState === 'PLAYING' ? 'bg-success shadow-[0_0_5px_#10b981]' : cameraState === 'PAUSED' ? 'bg-warning shadow-[0_0_5px_#f59e0b]' : 'bg-slate-500'}`} />
                            {cameraState === 'PLAYING' ? 'ON_LINE' : cameraState === 'PAUSED' ? 'STANDBY' : 'OFF_LINE'}
                        </span>
                        <span className={`w-px h-3 bg-slate-700`} />
                        <span className="flex items-center gap-1">
                            <span className="opacity-50">FPS:</span>
                            <span className={cameraState === 'PLAYING' ? 'text-primary font-medium' : ''}>{cameraState === 'PLAYING' ? telemetry.fps : '--'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="opacity-50">LATENCY:</span>
                            <span className={cameraState === 'PLAYING' ? 'text-primary font-medium' : ''}>{cameraState === 'PLAYING' ? `${telemetry.ping}ms` : '--'}</span>
                        </span>
                    </div>
                    <div className="flex gap-3 items-center">
                        <span className="opacity-40">OPTICS: OK</span>
                        <span className="opacity-40">NODE_ID: LBR-V1</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- LIVE SCAN DETAILS CARD ---
const LiveScanCard = ({ activeScan }) => {
    const cardRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // Dynamic background based on scan status
    let bgPulseClass = '';
    if (activeScan) {
        if (activeScan.status === 'AVAILABLE') bgPulseClass = 'bg-success/5';
        else if (activeScan.status === 'DUPLICATE') bgPulseClass = 'bg-warning/5';
        else if (activeScan.status === 'NOT FOUND' || activeScan.status === 'UNKNOWN') bgPulseClass = 'bg-danger/5';
        else if (activeScan.status === 'MISPLACED') bgPulseClass = 'bg-orange-500/5';
    }

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={`glass-panel overflow-hidden h-full flex flex-col relative transition-colors duration-500 group/card ${bgPulseClass}`}
        >
            {/* Spotlight effect */}
            <div 
                className="absolute inset-0 z-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--primary-rgb), 0.05), transparent 40%)`
                }}
            />

            <div className="px-4 py-3 border-b border-border/50 bg-surface/80 backdrop-blur-md z-10 transition-colors">
                <h2 className="font-semibold text-textMain flex items-center gap-2">
                    Live Scan Details
                </h2>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center items-center relative overflow-hidden">
                {/* Background decorative element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {activeScan ? (
                    <div className="w-full flex flex-col items-center mt-2 z-10">
                        <motion.div
                            key={activeScan.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-full max-w-sm flex flex-col items-center text-center"
                        >


                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-4">
                                <StatusBadge status={activeScan.status} size="lg" />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <h3 className="text-2xl font-bold text-textMain mb-1 line-clamp-2" title={activeScan.book.name}>{activeScan.book.name}</h3>
                                {activeScan.status === 'MISPLACED' && <div className="text-orange-500 font-bold uppercase text-xs mt-1 tracking-widest">Belongs to: Shelf {activeScan.book.shelf}</div>}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <p className="text-textDim font-medium mb-4 text-base line-clamp-1" title={activeScan.book.author}>{activeScan.book.author}</p>
                            </motion.div>

                            {activeScan.book.department && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-6">
                                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest">
                                        {activeScan.book.department}
                                    </span>
                                </motion.div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full p-4 bg-background/90 rounded-xl border border-border/20 flex justify-between items-center shadow-lg transition-colors"
                            >
                                <div className="text-left flex-1 min-w-0">
                                    <div className="text-[10px] uppercase tracking-wider text-textDim font-semibold mb-1">Barcode ID</div>
                                    <div className="font-mono text-lg text-primary font-medium tracking-wider truncate">{activeScan.barcode}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[10px] uppercase tracking-wider text-textDim font-semibold mb-1">Detected At</div>
                                    <div className="font-mono text-sm text-textDim">{activeScan.timestamp.toLocaleTimeString()}</div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-textDim flex flex-col items-center gap-5 mt-8 relative z-10"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                            />
                            <ScanLine size={56} className="text-textDim relative z-10" />
                        </div>
                        <p className="text-sm font-medium tracking-wide uppercase">Awaiting Next Item</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// --- ANALYTICS COMPONENTS ---
const StatCharts = ({ history, onClose }) => {
    // 1. Scan Status Pie Data
    const statusData = useMemo(() => {
        const counts = { AVAILABLE: 0, DUPLICATE: 0, 'NOT FOUND': 0 };
        history.forEach(item => {
            if (counts[item.status] !== undefined) counts[item.status]++;
        });
        return [
            { name: 'Available', value: counts.AVAILABLE, color: '#10b981' },
            { name: 'Duplicate', value: counts.DUPLICATE, color: '#f59e0b' },
            { name: 'Not Found', value: counts['NOT FOUND'], color: '#ef4444' }
        ].filter(d => d.value > 0);
    }, [history]);

    // 2. Department Distribution Bar Data
    const deptData = useMemo(() => {
        const counts = {};
        history.forEach(item => {
            const dept = item.book?.department || 'General';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [history]);

    // 3. Scan Velocity (Last 10 minutes or simple progression)
    const velocityData = useMemo(() => {
        // Group by minute
        const minutes = {};
        history.forEach(item => {
            const date = new Date(item.timestamp);
            const key = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            minutes[key] = (minutes[key] || 0) + 1;
        });
        return Object.entries(minutes)
            .map(([time, scans]) => ({ time, scans }))
            .slice(-10);
    }, [history]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col gap-5 p-6 h-full overflow-y-auto custom-scrollbar"
        >
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
                        <BarChart3 className="text-primary" size={20} />
                        Audit Intelligence
                    </h2>
                    <p className="text-xs text-textDim uppercase tracking-wider">Visual break-down of current session</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border/50 rounded-lg text-xs font-bold hover:bg-background transition-colors"
                >
                    <ChevronLeft size={14} /> Back to Live
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Status Share */}
                <div className="glass-panel p-5 min-h-[300px] flex flex-col">
                    <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                        <PieIcon size={14} className="text-primary" /> Scan Results Composition
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Velocity */}
                <div className="glass-panel p-5 min-h-[300px] flex flex-col">
                    <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                        <TrendingUp size={14} className="text-emerald-500" /> Scanning Velocity
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={velocityData}>
                                <defs>
                                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <Tooltip 
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="scans" stroke="var(--primary)" fillOpacity={1} fill="url(#colorScans)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Dept Breakdown */}
                <div className="glass-panel p-5 min-h-[300px] flex flex-col lg:col-span-2">
                    <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                        <BookIcon size={14} className="text-violet-500" /> Departmental Distribution
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} width={100} />
                                <Tooltip 
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- STATUS BADGE ---
const StatusBadge = ({ status, size = "md" }) => {
    const isNew = status === 'AVAILABLE';
    const isDuplicate = status === 'DUPLICATE';
    const isNotFound = status === 'NOT FOUND';
    const isMisplaced = status === 'MISPLACED';
    const isUnknown = status === 'UNKNOWN';

    let colorClasses = '';
    let Icon = CheckCircle;

    if (isNew) {
        colorClasses = 'bg-success/10 text-success border-success/30';
    } else if (isDuplicate) {
        colorClasses = 'bg-warning/10 text-warning border-warning/30';
        Icon = AlertTriangle;
    } else if (isNotFound || isUnknown) {
        colorClasses = 'bg-danger/10 text-danger border-danger/30';
        Icon = XCircle;
    } else if (isMisplaced) {
        colorClasses = 'bg-orange-500/10 text-orange-500 border-orange-500/30';
        Icon = AlertTriangle;
    }

    const sizeClasses = size === "lg"
        ? "px-3 py-1.5 text-xs font-bold gap-2"
        : "px-2 py-0.5 text-[10px] font-bold gap-1";

    return (
        <span className={`inline-flex items-center rounded-full border ${colorClasses} ${sizeClasses} uppercase tracking-wider`}>
            <Icon size={size === "lg" ? 14 : 12} />
            {status}
        </span>
    );
};

// --- SCAN HISTORY TIMELINE ---
const ScanHistoryTable = ({ history }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const cardRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.book.department && item.book.department.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterStatus === 'All' || item.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className="glass-panel overflow-hidden flex flex-col h-[500px] group/card relative"
        >
            {/* Spotlight effect */}
            <div 
                className="absolute inset-0 z-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(1200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--primary-rgb), 0.03), transparent 40%)`
                }}
            />
            {/* Top Bar */}
            <div className="px-4 py-3 border-b border-border/50 bg-surface/80 flex flex-col sm:flex-row justify-between items-center gap-3 z-20">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <h2 className="font-semibold text-textMain whitespace-nowrap text-sm uppercase tracking-wider">Recent Scans</h2>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] uppercase font-bold rounded-sm border border-primary/30">{filteredHistory.length} records</span>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative flex-1 sm:w-56">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textDim" size={14} />
                        <input
                            type="text"
                            placeholder="Search by title or barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border rounded pl-8 pr-3 py-1.5 text-xs text-textMain focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textDim" size={14} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none bg-surface border border-border rounded pl-8 pr-6 py-1.5 text-xs text-textMain focus:outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="DUPLICATE">Duplicate</option>
                            <option value="NOT FOUND">Not Found</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="bg-background/90 border-b border-border/50 z-10 sticky top-0 shadow-md">
                <div className="grid grid-cols-[40px_2.5fr_1.5fr_1fr_1fr_90px_100px] gap-3 px-4 py-2">
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">#</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Title</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Author</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Dept.</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Barcode</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider text-right">Time</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider text-right">Status</div>
                </div>
            </div>

            {/* Table Body - High Density */}
            <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
                {filteredHistory.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-textDim text-sm gap-2">
                        <Database size={24} className="opacity-20" />
                        No scan records found.
                    </div>
                ) : (
                    <div className="divide-y divide-border/20 w-full pb-2">
                        <AnimatePresence initial={false}>
                            {filteredHistory.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-[40px_2.5fr_1.5fr_1fr_1fr_90px_100px] gap-3 px-4 py-2.5 transition-all items-center w-full group relative border-l-2 border-transparent"
                                    style={{
                                        backgroundColor:
                                            item.status === 'AVAILABLE' ? 'rgba(var(--primary-rgb), 0.04)' :
                                                item.status === 'DUPLICATE' ? 'rgba(245, 158, 11, 0.04)' :
                                                    (item.status === 'NOT FOUND' || item.status === 'UNKNOWN') ? 'rgba(239, 68, 68, 0.04)' :
                                                        item.status === 'MISPLACED' ? 'rgba(249, 115, 22, 0.04)' :
                                                            index % 2 === 0 ? 'rgba(var(--primary-rgb), 0.02)' : 'transparent',
                                    }}
                                    whileHover={{
                                        backgroundColor:
                                            item.status === 'AVAILABLE' ? 'rgba(var(--primary-rgb), 0.08)' :
                                                item.status === 'DUPLICATE' ? 'rgba(245, 158, 11, 0.08)' :
                                                    (item.status === 'NOT FOUND' || item.status === 'UNKNOWN') ? 'rgba(239, 68, 68, 0.08)' :
                                                        item.status === 'MISPLACED' ? 'rgba(249, 115, 22, 0.08)' :
                                                            'rgba(var(--primary-rgb), 0.1)',
                                        borderLeftColor:
                                            item.status === 'AVAILABLE' ? '#10b981' :
                                                item.status === 'DUPLICATE' ? '#f59e0b' :
                                                    (item.status === 'NOT FOUND' || item.status === 'UNKNOWN') ? '#ef4444' :
                                                        item.status === 'MISPLACED' ? '#f97316' :
                                                            'var(--primary)',
                                    }}
                                >
                                    <div className="text-xs font-mono text-textDim group-hover:text-primary transition-colors">{history.length - history.indexOf(item)}</div>
                                    <div className="text-sm font-medium text-textMain truncate pr-2 group-hover:text-primary transition-colors">
                                        <div title={item.book.name} className="truncate">{item.book.name}</div>
                                        {item.status === 'MISPLACED' && <div className="text-[10px] text-orange-500 mt-0.5 uppercase tracking-wider font-bold">Origin: Shelf {item.book.shelf}</div>}
                                    </div>
                                    <div className="text-xs text-textDim truncate pr-2" title={item.book.author}>{item.book.author}</div>
                                    <div className="text-[10px] text-textDim font-bold truncate pr-2 uppercase tracking-tighter" title={item.book.department}>{item.book.department || 'General'}</div>
                                    <div className="text-xs font-mono text-textDim bg-background/50 px-1.5 py-0.5 rounded border border-border/10 w-fit">{item.barcode}</div>
                                    <div className="text-xs text-textDim font-mono text-right">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                                    <div className="flex justify-end">
                                        <StatusBadge status={item.status} size="sm" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MISSING BOOKS TABLE ---
const MissingBooksTable = ({ missingBooks }) => {
    return (
        <div className="glass-panel overflow-hidden border-border/50 h-[400px] flex flex-col bg-surface transition-colors duration-300">
            <div className="px-6 py-4 border-b border-border/50 bg-surface/50 flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-danger/10 rounded-lg">
                        <AlertTriangle size={18} className="text-danger" />
                    </div>
                    <div>
                        <h2 className="font-bold text-textMain tracking-tight uppercase text-sm">Missing from Inventory</h2>
                        <p className="text-[10px] text-textDim uppercase font-mono mt-0.5">Physical books not yet scanned in this session</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-danger/10 text-danger text-[10px] font-bold rounded-full border border-danger/20">
                    {missingBooks.length} ITEMS PENDING
                </div>
            </div>

            {/* Table Header */}
            <div className="bg-background/80 border-b border-border/50 z-10 sticky top-0">
                <div className="grid grid-cols-[60px_2.5fr_1.5fr_1.2fr_1fr] gap-4 px-6 py-2">
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Index</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Book Identity</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Author</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Department</div>
                    <div className="text-[10px] font-semibold text-textDim uppercase tracking-wider">Barcode</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {missingBooks.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-textDim text-sm gap-2">
                        <CheckCircle size={32} className="text-success/30" />
                        All inventory accounted for.
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {missingBooks.map((book, idx) => (
                            <motion.div
                                key={book.barcode}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-[60px_2.5fr_1.5fr_1.2fr_1fr] gap-4 px-6 py-3.5 hover:bg-danger/5 transition-colors group"
                            >
                                <div className="text-xs font-mono text-textDim flex items-center">{idx + 1}</div>
                                <div className="flex flex-col">
                                    <div className="text-sm font-medium text-textMain group-hover:text-danger mb-0.5 transition-colors">{book.name}</div>
                                    <div className="text-[10px] text-textDim uppercase tracking-widest">{book.barcode}</div>
                                </div>
                                <div className="text-xs text-textDim flex items-center italic">{book.author}</div>
                                <div className="text-[10px] font-bold text-textDim flex items-center pr-2 uppercase">{book.department || 'General'}</div>
                                <div className="flex items-center">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 font-bold uppercase tracking-tighter">PENDING</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SESSION SUMMARY PANEL ---
const SessionSummary = ({ stats, startTime }) => {
    const [duration, setDuration] = useState('00:00:00');
    const [rate, setRate] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now - startTime) / 1000);

            const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const seconds = String(diff % 60).padStart(2, '0');

            setDuration(`${hours}:${minutes}:${seconds}`);

            if (diff > 0) {
                setRate(Math.round((stats.uniqueScans / diff) * 60));
            } else {
                setRate(0);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, stats.uniqueScans]);

    return (
        <div className="glass-panel p-6 border-border/40 bg-surface/80 flex flex-wrap justify-between items-center gap-8 transition-colors duration-300">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-textDim font-bold mb-1">Session Duration</span>
                    <span className="text-2xl font-black text-textMain font-mono">{duration}</span>
                </div>
                <div className="w-px h-10 bg-border/40" />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-textDim font-bold mb-1">Processing Rate</span>
                    <span className="text-2xl font-black text-primary font-mono">{rate}<span className="text-[10px] text-textDim font-normal ml-1">items/m</span></span>
                </div>
            </div>

            <div className="flex gap-10">
                {[
                    { label: 'Network', value: '1.2ms', icon: Globe },
                    { label: 'Buffers', value: '4096kb', icon: Database },
                    { label: 'Encryption', value: 'AES-256', icon: Lock },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                        <item.icon size={14} className="text-textDim" />
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-widest text-textDim font-bold">{item.label}</span>
                            <span className="text-xs font-mono text-textMain">{item.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const THEMES = [
    { id: 'dark', label: 'Dark Mode', icon: 'Moon' },
    { id: 'light', label: 'Light Mode', icon: 'Sun' },
];

const SettingsModal = ({ isOpen, onClose, settings, setSettings, onApplyHardware }) => {
    const [activeTab, setActiveTab] = useState('audio');

    if (!isOpen) return null;

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const tabs = [
        { id: 'audio', label: 'Audio', icon: Volume2 },
        { id: 'visual', label: 'Visuals', icon: Monitor },
        { id: 'theme', label: 'Theme', icon: Palette },
        { id: 'scan', label: 'Scanning', icon: ScanLine },
        { id: 'hardware', label: 'Hardware', icon: Activity },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="glass-panel max-w-2xl w-full flex flex-col h-[500px] overflow-hidden shadow-2xl border-border/80 bg-surface"
            >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-background/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <Settings size={20} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-textMain tracking-tight">System Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors text-textDim hover:text-textMain">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 border-r border-border/50 bg-sidebar p-3 flex flex-col gap-1 transition-colors">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary/15 text-primary border border-primary/20'
                                    : 'text-textDim hover:text-textMain hover:bg-surface'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 overflow-y-auto bg-surface/20 custom-scrollbar transition-colors">
                        {activeTab === 'audio' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-sm font-semibold text-textDim uppercase tracking-widest mb-6">Sound Levels</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-mono">
                                                <span className="text-textDim">Success Signal</span>
                                                <span className="text-primary">{Math.round(settings.successVolume * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.1"
                                                value={settings.successVolume}
                                                onChange={(e) => handleChange('successVolume', parseFloat(e.target.value))}
                                                className="w-full accent-primary bg-background rounded-lg h-1.5 appearance-none cursor-pointer"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-mono">
                                                <span className="text-textDim">Alert Signal</span>
                                                <span className="text-danger">{Math.round(settings.errorVolume * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.1"
                                                value={settings.errorVolume}
                                                onChange={(e) => handleChange('errorVolume', parseFloat(e.target.value))}
                                                className="w-full accent-danger bg-background rounded-lg h-1.5 appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border/50">
                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div className={`w-12 h-6 rounded-full transition-all relative ${settings.muteAll ? 'bg-border' : 'bg-primary'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.muteAll ? 'left-1' : 'left-7'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={settings.muteAll}
                                            onChange={(e) => handleChange('muteAll', e.target.checked)}
                                        />
                                        <span className="text-sm font-medium text-textMain group-hover:text-primary transition-colors">Mute All Feedback</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'visual' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-semibold text-textDim uppercase tracking-widest mb-6">Visual Interface</h3>
                                {[
                                    { id: 'showFlash', label: 'Scan Flash Effect', desc: 'Screen flash when item is detected' },
                                    { id: 'showTelemetry', label: 'Hardware Telemetry', desc: 'Show live FPS/Latency data' },
                                ].map(opt => (
                                    <label key={opt.id} className="flex justify-between items-start cursor-pointer group p-4 rounded-xl hover:bg-surface/50 transition-all border border-transparent hover:border-border/50">
                                        <div>
                                            <div className="text-sm font-medium text-textMain mb-1">{opt.label}</div>
                                            <div className="text-xs text-textDim font-normal">{opt.desc}</div>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${!settings[opt.id] ? 'bg-border' : 'bg-primary'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${!settings[opt.id] ? 'left-1' : 'left-7'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={settings[opt.id]}
                                            onChange={(e) => handleChange(opt.id, e.target.checked)}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        {activeTab === 'scan' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-semibold text-textDim uppercase tracking-widest mb-6">Detection Tuning</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-textDim">Scan Cooldown Delay</span>
                                        <span className="text-primary">{settings.scanDelay}ms</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000" max="5000" step="500"
                                        value={settings.scanDelay}
                                        onChange={(e) => handleChange('scanDelay', parseInt(e.target.value))}
                                        className="w-full accent-primary bg-background rounded-lg h-1.5 appearance-none cursor-pointer"
                                    />
                                    <p className="text-[10px] text-textDim leading-relaxed italic opacity-70">
                                        * Increase this if you find the scanner is capturing the same book twice by mistake.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'theme' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-semibold text-textDim uppercase tracking-widest mb-6">Interface Theme</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => handleChange('theme', theme.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${settings.theme === theme.id
                                                ? 'bg-primary/15 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                                                : 'bg-background border-border/50 hover:border-border'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.id === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border`}>
                                                    {theme.id === 'dark' ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-warning" />}
                                                </div>
                                                <div className="text-left">
                                                    <div className={`text-sm font-bold ${settings.theme === theme.id ? 'text-primary' : 'text-textMain'}`}>
                                                        {theme.label}
                                                    </div>
                                                    <div className="text-[10px] text-textDim font-mono tracking-tight lowercase">
                                                        Standard system {theme.id} mode
                                                    </div>
                                                </div>
                                            </div>
                                            {settings.theme === theme.id && (
                                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <CheckCircle size={12} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'hardware' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Optics Configuration</h3>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-mono text-slate-300 block">Select Input Device</label>
                                        <select
                                            value={settings.cameraIndex}
                                            onChange={(e) => handleChange('cameraIndex', parseInt(e.target.value))}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value={0}>Camera 0 (Default)</option>
                                            <option value={1}>Camera 1 (USB External)</option>
                                            <option value={2}>Camera 2 (Secondary)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-mono text-slate-300 block">Maximum Resolution</label>
                                        <select
                                            value={settings.resolution}
                                            onChange={(e) => handleChange('resolution', e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value="640x480">640 x 480 (Performance)</option>
                                            <option value="1280x720">1280 x 720 (High Definition)</option>
                                        </select>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onApplyHardware}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary/20 hover:bg-primary/30 text-white border border-primary/40 rounded-xl font-semibold transition-all group"
                                >
                                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                    Apply Hardware Changes
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 border-t border-border/50 bg-sidebar flex justify-between items-center transition-colors">
                    <div className="text-[10px] text-textDim font-mono tracking-widest uppercase">NODE_ID: LBR-V1 // CORE: v1.1</div>
                    <div className="text-[10px] text-primary/60 font-mono italic">Settings saved automatically</div>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                MAIN DASHBOARD                              */
/* -------------------------------------------------------------------------- */

// --- REPORT OVERLAY (POST-SESSION) ---
const ReportOverlay = ({ stats, missingCount, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/95 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="glass-panel max-w-lg w-full p-8 flex flex-col items-center text-center shadow-[0_30px_100px_rgba(0,0,0,0.7)] border-primary/30"
            >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mb-6 relative">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                    />
                    <Shield className="text-primary" size={36} />
                </div>

                <h2 className="text-3xl font-black text-textMain mb-2 tracking-tight uppercase">Session Terminated</h2>
                <p className="text-textDim text-sm mb-8 leading-relaxed max-w-[280px]">Inventory scan cycle complete. Here is the operational summary for this unit.</p>

                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    {[
                        { label: 'Network Scan', value: stats.totalScans, icon: Activity, color: 'text-primary', bg: 'bg-primary/5' },
                        { label: 'Unique Ident', value: stats.uniqueScans, icon: ScanLine, color: 'text-success', bg: 'bg-success/5' },
                        { label: 'Duplicate Detect', value: stats.duplicates, icon: RefreshCw, color: 'text-warning', bg: 'bg-warning/5' },
                        { label: 'Missing Units', value: missingCount, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/5' },
                    ].map(item => (
                        <div key={item.label} className={`p-4 rounded-2xl ${item.bg} border border-border/40 flex flex-col items-center gap-1.5 shadow-inner`}>
                            <item.icon className={`${item.color} mb-0.5`} size={16} />
                            <div className="text-[10px] text-textDim uppercase tracking-widest font-bold">{item.label}</div>
                            <div className="text-xl font-black text-textMain font-mono">{item.value}</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_5px_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.5)] transition-all flex items-center justify-center gap-2"
                    >
                        Return to Control
                    </button>
                    <button onClick={() => window.open(import.meta.env.PROD ? '/export_word' : 'http://localhost:5000/export_word', '_blank')} className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-blue-500/20 flex items-center justify-center gap-2">
                        <FileText size={14} /> Export Word Report
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const Dashboard = () => {
    // State
    const [history, setHistory] = useState([]);
    const [activeScan, setActiveScan] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [startTime, setStartTime] = useState(new Date());
    const [stats, setStats] = useState({ totalScans: 0, uniqueScans: 0, duplicates: 0 });
    const [videoUrl, setVideoUrl] = useState('');
    const [missingBooks, setMissingBooks] = useState([]);
    const [cameraState, setCameraState] = useState('STOPPED');
    const [showReportOverlay, setShowReportOverlay] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [shelves, setShelves] = useState([]);
    const [targetShelf, setTargetShelf] = useState('');

    // Settings State with LocalStorage Persistence
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('librobot_settings');
        return saved ? JSON.parse(saved) : {
            successVolume: 0.5,
            errorVolume: 0.8,
            muteAll: false,
            showFlash: true,
            showTelemetry: true,
            scanDelay: 2000,
            cameraIndex: 0,
            resolution: '640x480',
            theme: 'dark'
        };
    });

    useEffect(() => {
        localStorage.setItem('librobot_settings', JSON.stringify(settings));
        document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    }, [settings]);

    useEffect(() => {
        fetch(process.env.NODE_ENV === 'production' ? '/api/shelves' : 'http://localhost:5000/api/shelves')
            .then(res => res.json())
            .then(data => setShelves(data.shelves_in_use || []));
        fetch(process.env.NODE_ENV === 'production' ? '/api/target_shelf' : 'http://localhost:5000/api/target_shelf')
            .then(res => res.json())
            .then(data => setTargetShelf(data.target_shelf || ''));
    }, []);

    const handleTargetShelfChange = async (shelf) => {
        setTargetShelf(shelf);
        await fetch(process.env.NODE_ENV === 'production' ? '/api/target_shelf' : 'http://localhost:5000/api/target_shelf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shelf })
        });
    };

    // Audio Cues
    const playAudio = (type) => {
        if (settings.muteAll) return;
        try {
            const audio = new Audio(`/sounds/${type}.wav`);
            const vol = type === 'success' ? settings.successVolume : type === 'error' ? settings.errorVolume : 0.4;
            audio.volume = vol;
            audio.play().catch(e => console.warn("Audio play blocked by browser:", e));
        } catch (err) {
            console.error("Audio error:", err);
        }
    };

    // We maintain a set of seen barcodes locally to determine 'NEW' vs 'DUPLICATE' easily on the frontend stream

    // The backend provides status="available" etc, but local tracking allows clean duplicate animation.
    const seenBarcodesRef = useRef(new Set());
    const scanTimeoutRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    useEffect(() => {
        // Init Video Stream
        const url = process.env.NODE_ENV === 'production'
            ? '/video_feed'
            : `http://localhost:5000/video_feed?t=${Date.now()}`;
        setVideoUrl(url);

        // Fetch Initial State to populate 'seen' barcodes but NOT history list on load.
        socket.on('initial_state', (state) => {
            // Let's populate the set with what's available so we know duplicates
            state.available.forEach(item => seenBarcodesRef.current.add(item.barcode));
            state.misplaced.forEach(item => seenBarcodesRef.current.add(item.barcode));
            setMissingBooks(state.missing || []);
            if (state.camera_state) setCameraState(state.camera_state);
            // Not auto-filling history to keep the dashboard clean on entry, as per realistic usage.
        });

        socket.on('camera_state_changed', (payload) => {
            setCameraState(payload.state);
            if (payload.state === 'STOPPED') {
                setShowReportOverlay(true);
            }
        });

        socket.on('status_update', (state) => {
            if (state && state.missing) {
                setMissingBooks(state.missing);
            }
        });

        // Handle New Scans
        socket.on('new_scan', (payload) => {
            // Respect Scan Delay (Cooldown)
            const now = Date.now();
            if (now - lastScanTimeRef.current < settings.scanDelay) return;
            lastScanTimeRef.current = now;

            const barcode = payload.barcode;
            const bookInfo = payload.book;
            const backendStatus = payload.status; // 'available' or 'misplaced'

            let displayStatus = 'AVAILABLE';
            if (seenBarcodesRef.current.has(barcode)) {
                displayStatus = 'DUPLICATE';
            } else if (backendStatus === 'unknown') {
                displayStatus = 'UNKNOWN';
                seenBarcodesRef.current.add(barcode);
            } else if (backendStatus === 'misplaced') {
                displayStatus = 'MISPLACED';
                seenBarcodesRef.current.add(barcode);
            } else {
                displayStatus = 'AVAILABLE';
                seenBarcodesRef.current.add(barcode);
            }

            const scanRecord = {
                id: `${barcode}-${Date.now()}`,
                barcode,
                book: bookInfo,
                status: displayStatus,
                timestamp: new Date()
            };

            if (displayStatus === 'AVAILABLE') playAudio('success');
            else playAudio('error');

            // Flash camera border
            if (settings.showFlash) {
                setIsScanning(true);
                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = setTimeout(() => setIsScanning(false), 500);
            }

            setActiveScan(scanRecord);
            setHistory(prev => [scanRecord, ...prev]);
            if (payload.full_status && payload.full_status.missing) setMissingBooks(payload.full_status.missing);

            setStats(prev => ({
                totalScans: prev.totalScans + 1,
                uniqueScans: displayStatus !== 'DUPLICATE' ? prev.uniqueScans + 1 : prev.uniqueScans,
                duplicates: displayStatus === 'DUPLICATE' ? prev.duplicates + 1 : prev.duplicates
            }));
        });

        socket.on('session_reset', (state) => {
            setHistory([]);
            setActiveScan(null);
            seenBarcodesRef.current.clear();
            setStats({ totalScans: 0, uniqueScans: 0, duplicates: 0 });
            setStartTime(new Date());
            if (state && state.missing) {
                setMissingBooks(state.missing);
            }
        });

        return () => {
            socket.off('initial_state');
            socket.off('new_scan');
            socket.off('session_reset');
            socket.off('camera_state_changed');
            socket.off('status_update');
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        };
    }, []);

    const handleCameraControl = async (action) => {
        playAudio('click');
        try {
            await fetch(process.env.NODE_ENV === 'production' ? '/camera_control' : 'http://localhost:5000/camera_control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
        } catch (error) {
            console.error("Camera control error:", error);
        }
    };

    const handleReset = () => {
        playAudio('click');
        fetch(process.env.NODE_ENV === 'production' ? '/reset_session' : 'http://localhost:5000/reset_session', {
            method: 'POST'
        });
    };

    const handleApplyHardware = async () => {
        playAudio('click');
        const [w, h] = settings.resolution.split('x').map(Number);
        try {
            await fetch(process.env.NODE_ENV === 'production' ? '/camera_control' : 'http://localhost:5000/camera_control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'START',
                    config: {
                        index: settings.cameraIndex,
                        width: w,
                        height: h
                    }
                })
            });
        } catch (error) {
            console.error("Hardware apply error:", error);
        }
    };

    // Sidebar extra nav for dashboard-specific items
    const sidebarExtra = (
        <button
            onClick={() => setShowAnalytics(prev => !prev)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${showAnalytics ? 'bg-primary/10 text-primary border-primary/20' : 'text-textDim hover:bg-surface hover:text-textMain border-transparent'}`}
        >
            <BarChart3 size={15} />
            <span>Intelligence</span>
        </button>
    );

    return (
        <div className="min-h-screen h-screen bg-background text-textMain flex overflow-hidden font-sans transition-colors duration-300">
            {/* Ambient gradients */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Scan flash overlay */}
            <AnimatePresence>
                {isScanning && settings.showFlash && (
                    <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-[100] pointer-events-none bg-primary/10"
                    />
                )}
            </AnimatePresence>

            {/* Shared Sidebar */}
            <Sidebar subtitle="Live Dashboard" extraNav={sidebarExtra} />

            {/* Right side: header + scrollable content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <PageHeader
                    stats={stats}
                    handleReset={handleReset}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onAnalyticsToggle={() => setShowAnalytics(!showAnalytics)}
                    showAnalytics={showAnalytics}
                />

                <main className="flex-1 p-6 md:p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar relative z-10 transition-all duration-300">
                <AnimatePresence mode="wait">
                    {showAnalytics ? (
                        <StatCharts 
                            key="analytics"
                            history={history} 
                            onClose={() => setShowAnalytics(false)} 
                        />
                    ) : (
                        <motion.div
                            key="live-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-8"
                        >
                            {/* Top Grid: Camera vs Scan Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[450px]">
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="h-full min-h-[450px] lg:min-h-0">
                                    <CameraCard
                                        videoUrl={videoUrl}
                                        isScanning={isScanning}
                                        lastScanTime={activeScan?.timestamp}
                                        cameraState={cameraState}
                                        handleCameraControl={handleCameraControl}
                                        showTelemetry={settings.showTelemetry}
                                        shelves={shelves}
                                        targetShelf={targetShelf}
                                        onTargetShelfChange={handleTargetShelfChange}
                                    />
                                </motion.div>

                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="h-full min-h-[450px] lg:min-h-0">
                                    <LiveScanCard activeScan={activeScan} />
                                </motion.div>
                            </div>

                            {/* Main Scan History */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full">
                                <ScanHistoryTable history={history} />
                            </motion.div>

                            {/* Missing Books Table */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="w-full">
                                <MissingBooksTable missingBooks={missingBooks} />
                            </motion.div>

                            {/* Bottom Stats */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="w-full">
                                <SessionSummary stats={stats} startTime={startTime} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            </div>

            <AnimatePresence>
                {showReportOverlay && (
                    <ReportOverlay
                        stats={stats}
                        missingCount={missingBooks.length}
                        onClose={() => setShowReportOverlay(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSettingsOpen && (
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        settings={settings}
                        setSettings={setSettings}
                        onApplyHardware={handleApplyHardware}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


export default Dashboard;
