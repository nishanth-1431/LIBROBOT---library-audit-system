import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Camera, Database, Shield, ScanLine,
    BarChart3, ChevronRight, Zap, Server,
    CheckCircle2, BookMarked, Users, FileText, ArrowRight
} from 'lucide-react';
import { socket } from '../socket';

// ─── Scroll Animation Wrapper ─────────────────────────────────────────────────
const ScrollReveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
            x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <motion.div
            ref={ref}
            variants={variants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grid */}
        <div
            className="absolute inset-0"
            style={{
                backgroundImage: `linear-gradient(to right, rgba(0,240,255,0.03) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(0,240,255,0.03) 1px, transparent 1px)`,
                backgroundSize: '5rem 5rem',
            }}
        />
        {/* Radial glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px]" />

        {/* Scan line */}
        <motion.div
            animate={{ y: ['-10vh', '110vh'] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-px bg-primary/20 shadow-[0_0_20px_2px_rgba(0,240,255,0.3)]"
        />
    </div>
);

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ online }) => (
    <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? 'bg-emerald-500' : 'bg-amber-400'}`} />
    </span>
);

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, accent, index }) => (
    <ScrollReveal delay={index * 0.08} direction="up">
        <div
            className="group relative bg-surface/50 backdrop-blur-sm border border-border/60 rounded-2xl p-6 hover:border-primary/40 transition-all duration-500 overflow-hidden h-full shadow-lg"
            style={{ '--accent-color': accent }}
        >
            {/* Hover glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{ background: `radial-gradient(circle at 30% 30%, ${accent}08, transparent 60%)` }}
            />
            {/* Corner lines */}
            <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none">
                <div className="absolute top-px left-0 w-6 h-px" style={{ background: accent, opacity: 0.4 }} />
                <div className="absolute top-0 left-px w-px h-6" style={{ background: accent, opacity: 0.4 }} />
            </div>

            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
            >
                <Icon size={20} style={{ color: accent }} />
            </div>

            <h3 className="text-lg font-black text-textMain mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-textDim leading-relaxed font-medium">{desc}</p>
        </div>
    </ScrollReveal>
);

// ─── Use Case Card ────────────────────────────────────────────────────────────
const UseCaseCard = ({ icon: Icon, title, desc, index }) => (
    <ScrollReveal delay={index * 0.12} direction="up">
        <div className="flex gap-4 p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl hover:border-slate-700/70 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={18} className="text-primary" />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1.5">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    </ScrollReveal>
);

// ─── Tech Badge ───────────────────────────────────────────────────────────────
const TechBadge = ({ name, color, index }) => (
    <ScrollReveal delay={index * 0.06} direction="up">
        <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold tracking-wide transition-all hover:scale-105 cursor-default"
            style={{ borderColor: `${color}40`, color, background: `${color}10` }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {name}
        </div>
    </ScrollReveal>
);

// ─── Step ─────────────────────────────────────────────────────────────────────
const Step = ({ num, title, desc, index }) => (
    <ScrollReveal delay={index * 0.15} direction="up">
        <div className="relative flex flex-col items-center text-center group">
            <div className="w-14 h-14 rounded-full border-2 border-slate-700 group-hover:border-primary/50 bg-slate-900 flex items-center justify-center mb-4 transition-colors duration-300">
                <span className="text-xl font-black text-slate-500 group-hover:text-primary/70 transition-colors">{num}</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2">{title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">{desc}</p>
        </div>
    </ScrollReveal>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Home = () => {
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        setIsConnected(socket.connected);
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    const handleEnter = () => navigate('/dashboard');

    const features = [
        { icon: ScanLine, title: 'Real-Time Barcode Detection', desc: 'OpenCV + pyzbar decode barcodes frame-by-frame, emitting live WebSocket events to the frontend.', accent: '#00d5ff', index: 0 },
        { icon: Database, title: 'Excel-Backed Book Database', desc: 'Add, edit, delete, and import entire book inventories via a clean admin UI — persisted to Excel.', accent: '#a855f7', index: 1 },
        { icon: BarChart3, title: 'Live Session Analytics', desc: 'Track total scans, unique items, duplicates, and misplaced books across the entire audit session.', accent: '#22c55e', index: 2 },
        { icon: Shield, title: 'Misplaced Book Alerts', desc: 'Items not found in the database are automatically flagged and reported as security concerns.', accent: '#f43f5e', index: 3 },
        { icon: FileText, title: 'One-Click Word Report', desc: 'Export a detailed .docx audit report with scan history, missing books, and misplaced flags.', accent: '#f59e0b', index: 4 },
        { icon: Camera, title: 'Camera State Control', desc: 'Start, pause, and stop the camera from the dashboard. Session data resets cleanly between uses.', accent: '#3b82f6', index: 5 },
    ];

    const useCases = [
        { icon: BookMarked, title: 'Library Audits', desc: 'Run full shelf audits in minutes. Instantly know which books are missing before closing.' },
        { icon: Users, title: 'Hackathon Demos', desc: 'Perfect for live demos — the real-time scanning response is visually impressive and immediately understandable.' },
        { icon: BarChart3, title: 'Inventory Management', desc: 'Track any Excel-based inventory with barcodes — not just books. Adaptable to schools, stores, and archives.' },
    ];

    const techStack = [
        { name: 'Python 3.11', color: '#3b82f6' },
        { name: 'Flask', color: '#6ee7b7' },
        { name: 'OpenCV', color: '#f59e0b' },
        { name: 'pyzbar', color: '#a78bfa' },
        { name: 'Socket.IO', color: '#00d5ff' },
        { name: 'React', color: '#61dafb' },
        { name: 'Vite', color: '#f36aff' },
        { name: 'Framer Motion', color: '#ff6090' },
        { name: 'OpenPyXL', color: '#22c55e' },
        { name: 'python-docx', color: '#f97316' },
    ];

    return (
        <div className="relative min-h-screen flex flex-col text-slate-200 font-sans bg-background overflow-x-hidden">
            <Background />

            {/* ── Nav ──────────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-30 w-full px-6 md:px-10 py-4 border-b border-slate-800/70 bg-slate-950/60 backdrop-blur-xl flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <BookOpen size={14} className="text-primary" />
                    </div>
                    <span className="font-bold tracking-widest text-xs uppercase text-slate-100">LIBRO-BOT</span>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                        <StatusDot online={isConnected} />
                        <span>{isConnected ? 'Backend Online' : 'Connecting...'}</span>
                    </div>
                    <a href="#features" className="hidden md:block text-xs text-slate-400 hover:text-slate-200 transition-colors">Features</a>
                    <a href="#how" className="hidden md:block text-xs text-slate-400 hover:text-slate-200 transition-colors">How It Works</a>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-xs border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded-lg transition-all"
                    >
                        Admin
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleEnter}
                        className="text-xs bg-primary/90 hover:bg-primary text-slate-900 font-bold px-4 py-1.5 rounded-lg transition-all shadow-[0_2px_14px_rgba(0,240,255,0.25)]"
                    >
                        Dashboard →
                    </motion.button>
                </div>
            </nav>

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-24 max-w-4xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 rounded-full border border-primary/30 bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-[0.2em]"
                >
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    Autonomous Library Audit System
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="mb-6 space-y-1"
                >
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none">
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500">LIBRO</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-cyan-300 to-blue-500">-BOT</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-400 text-base md:text-lg max-w-xl mb-10 leading-relaxed"
                >
                    Computer-vision powered library auditing. Scan barcodes live, track every book in real-time, detect misplaced items, and generate professional audit reports — all in one system.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex flex-col sm:flex-row gap-3 mb-20"
                >
                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleEnter}
                        className="relative group overflow-hidden flex items-center justify-center gap-2.5 px-8 py-3.5 bg-primary text-slate-900 font-bold text-sm uppercase tracking-wider rounded-xl shadow-[0_4px_30px_rgba(0,240,255,0.2)]"
                    >
                        <ScanLine size={16} />
                        Open Live Dashboard
                        <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full duration-700 transition-transform" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/login')}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-textMain font-semibold text-sm uppercase tracking-wider rounded-xl transition-all"
                    >
                        <Shield size={15} />
                        Admin Panel
                    </motion.button>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800/50 border border-slate-800/50 rounded-2xl overflow-hidden w-full max-w-2xl"
                >
                    {[
                        { val: '~60fps', lbl: 'Camera Stream' },
                        { val: 'Live', lbl: 'WebSocket Events' },
                        { val: '.docx', lbl: 'Audit Report' },
                        { val: 'OpenCV', lbl: 'Vision Engine' },
                    ].map(({ val, lbl }) => (
                        <div key={lbl} className="bg-slate-900/70 py-4 px-2 text-center">
                            <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 leading-tight">{val}</div>
                            <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">{lbl}</div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ── Features ──────────────────────────────────────────────────── */}
            <section id="features" className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-28">
                <ScrollReveal>
                    <div className="text-center mb-14">
                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-bold mb-3">Core Features</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">Everything a librarian needs</h2>
                        <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">Built from scratch with real-world library audit workflows in mind.</p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((f) => <FeatureCard key={f.title} {...f} />)}
                </div>
            </section>

            {/* ── How It Works ───────────────────────────────────────────────── */}
            <section id="how" className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-28">
                <ScrollReveal>
                    <div className="text-center mb-14">
                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-bold mb-3">Workflow</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">How It Works</h2>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
                    {/* Connector lines (desktop only) */}
                    <div className="hidden sm:block absolute top-7 left-[calc(16.6%+28px)] right-[calc(16.6%+28px)] h-px bg-gradient-to-r from-slate-700 via-primary/30 to-slate-700" />

                    {[
                        { num: '1', title: 'Start the Camera', desc: 'Press Play on the Dashboard to activate OpenCV and begin live scanning.' },
                        { num: '2', title: 'Scan Each Book', desc: 'Hold barcodes in front of the camera. The system auto-detects and logs instantly.' },
                        { num: '3', title: 'Export the Report', desc: 'Press Stop. Review results and download a formatted Word audit report.' },
                    ].map((s, i) => <Step key={s.num} {...s} index={i} />)}
                </div>
            </section>

            {/* ── Use Cases ──────────────────────────────────────────────────── */}
            <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-28">
                <ScrollReveal>
                    <div className="text-center mb-14">
                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-bold mb-3">Use Cases</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">Built for real scenarios</h2>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {useCases.map((u, i) => <UseCaseCard key={u.title} {...u} index={i} />)}
                </div>
            </section>

            {/* ── Tech Stack ─────────────────────────────────────────────────── */}
            <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-28">
                <ScrollReveal>
                    <div className="text-center mb-10">
                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-bold mb-3">Tech Stack</p>
                        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Built with modern technologies</h2>
                    </div>
                </ScrollReveal>
                <div className="flex flex-wrap justify-center gap-3">
                    {techStack.map((t, i) => <TechBadge key={t.name} {...t} index={i} />)}
                </div>
            </section>

            {/* ── CTA Banner ─────────────────────────────────────────────────── */}
            <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-28">
                <ScrollReveal>
                    <div className="relative overflow-hidden border border-primary/20 rounded-3xl bg-gradient-to-br from-primary/10 via-slate-900/80 to-slate-900/80 p-10 md:p-16 text-center">
                        {/* Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-primary/10 blur-[80px] pointer-events-none" />

                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-bold mb-4">Ready to Audit?</p>
                        <h2 className="text-3xl md:text-4xl font-black text-textMain mb-4 tracking-tight">Start your first scan session</h2>
                        <p className="text-slate-400 text-sm mb-10 max-w-sm mx-auto">Open the live dashboard, start the camera, and begin auditing your library inventory in real-time.</p>
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleEnter}
                            className="relative group overflow-hidden inline-flex items-center gap-2.5 px-10 py-4 bg-primary text-slate-900 font-bold text-sm uppercase tracking-wider rounded-xl"
                        >
                            <ScanLine size={16} />
                            Launch Dashboard
                            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full duration-700 transition-transform" />
                        </motion.button>
                    </div>
                </ScrollReveal>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="relative z-10 w-full border-t border-slate-800/50 px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-slate-700" />
                    <span>LIBRO-BOT · Smart Library Intelligence System</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Server size={11} />
                    <span>OpenCV + Flask + React + Socket.IO</span>
                </div>
            </footer>


        </div>
    );
};

export default Home;
