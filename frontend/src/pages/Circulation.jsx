import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckSquare, XSquare, ScanLine, Camera, X, Play, Square, Mail, User, Calendar } from 'lucide-react';
import { socket } from '../socket';
import Sidebar from '../components/Sidebar';

export default function Circulation() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.PROD ? '' : 'http://127.0.0.1:5000';
    // UI State
    const [mode, setMode] = useState('checkout'); // 'checkout' or 'return'
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
    
    // Form and Cart State
    const [cart, setCart] = useState([]);
    const [studentId, setStudentId] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [manualBarcode, setManualBarcode] = useState('');
    const [dueDateOffset, setDueDateOffset] = useState('30');
    
    const [isLoading, setIsLoading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [lastActionDetails, setLastActionDetails] = useState(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const showStatus = (text, type) => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 4000);
    };

    // Socket listener for new scans
    useEffect(() => {
        const handleNewScan = (data) => {
            if (!cameraActive) return;
            const barcode = data.barcode;
            setCart(prev => {
                if (prev.includes(barcode)) return prev;
                return [...prev, barcode];
            });
        };
        socket.on('new_scan', handleNewScan);
        return () => socket.off('new_scan', handleNewScan);
    }, [cameraActive]);

    const toggleCamera = async () => {
        try {
            const newStatus = !cameraActive;
            await axios.post(`${API_BASE}/camera_control`, { action: newStatus ? 'START' : 'STOP' });
            setCameraActive(newStatus);
            if (newStatus && !socket.connected) { socket.connect(); }
        } catch (err) {
            showStatus('Failed to access camera', 'error');
        }
    };

    useEffect(() => {
        return () => {
            if (cameraActive) {
                axios.post(`${API_BASE}/camera_control`, { action: 'STOP' }).catch(() => {});
            }
        }
    }, [cameraActive]);

    const handleManualAdd = (e) => {
        e.preventDefault();
        const b = manualBarcode.trim();
        if (b && !cart.includes(b)) {
            setCart([...cart, b]);
            setManualBarcode('');
        }
    };
    
    const removeBarcode = (b) => {
        setCart(cart.filter(item => item !== b));
    };

    const handleAction = async () => {
        if (cart.length === 0) {
            showStatus("Please scan at least one book.", "error"); return;
        }
        if (mode === 'checkout') {
            if (!studentId) {
                showStatus("Student ID / Name is required", "error"); return;
            }
            if (!studentEmail || !studentEmail.endsWith('@srec.ac.in')) {
                showStatus("Email must end with @srec.ac.in", "error"); return;
            }
        }
        
        setIsLoading(true);
        setLastActionDetails(null);
        
        try {
            if (mode === 'checkout') {
                const res = await axios.post(`${API_BASE}/api/books/checkout`, { 
                    barcodes: cart, 
                    student_id: studentId, 
                    student_email: studentEmail,
                    due_date_offset: parseInt(dueDateOffset)
                });
                showStatus(`Successfully issued ${cart.length} book(s)`, 'success');
                setLastActionDetails({ type: 'checkout', book: res.data });
            } else {
                const returnPromises = cart.map(b => axios.post(`${API_BASE}/api/books/return`, { barcode: b }));
                const results = await Promise.allSettled(returnPromises);
                const successCount = results.filter(r => r.status === 'fulfilled').length;
                showStatus(`Successfully returned ${successCount} book(s)`, 'success');
                setLastActionDetails({ type: 'return', book: { name: `${successCount} items returned`, barcode: cart.join(', ') } });
            }
            // Clear inputs
            setCart([]);
            if (mode === 'checkout') {
                setStudentId('');
                setStudentEmail('');
            }
        } catch (err) {
            showStatus(err.response?.data?.error || `Failed to process request`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-textMain flex overflow-hidden font-sans">
            {/* Ambient glows */}
            <div className="fixed top-0 left-0 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            
            <Sidebar subtitle="Circulation Desk" />

            {/* ── Main ───────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen relative z-10 overflow-y-auto px-8 pt-8 pb-12">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-textMain">Circulation Desk</h2>
                        <p className="text-xs text-textDim mt-1 uppercase tracking-wider">Issue and Return Library Materials (Camera Enabled)</p>
                    </div>
                </header>

                <AnimatePresence>
                    {statusMessage.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                            className={`absolute top-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md border text-sm font-semibold ${statusMessage.type === 'error' ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'}`}
                        >
                            {statusMessage.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="flex flex-col lg:flex-row gap-8 max-w-6xl">
                    
                    {/* Left Column: Scanning & Camera */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Tabs */}
                        <div className="glass-panel p-6 bg-surface/30 border-border/50 rounded-2xl">
                            <div className="flex border-b border-border/50 pb-2 gap-6">
                                <button 
                                    onClick={() => { setMode('checkout'); setCart([]); }}
                                    className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${mode === 'checkout' ? 'border-primary text-primary' : 'border-transparent text-textDim hover:text-textMain'}`}
                                >
                                    Issue Books
                                </button>
                                <button 
                                    onClick={() => { setMode('return'); setCart([]); }}
                                    className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${mode === 'return' ? 'border-primary text-primary' : 'border-transparent text-textDim hover:text-textMain'}`}
                                >
                                    Return Books
                                </button>
                            </div>

                            {/* Camera Area */}
                            <div className="mt-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-textDim uppercase tracking-widest"><Camera className="inline mr-1" size={14} /> Barcode Scanner</h3>
                                    <button 
                                        onClick={toggleCamera}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors ${cameraActive ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}
                                    >
                                        {cameraActive ? <><Square size={12}/> Stop Camera</> : <><Play size={12} /> Start Camera</>}
                                    </button>
                                </div>
                                
                                <div className={`w-full aspect-video bg-black/40 rounded-xl overflow-hidden border ${cameraActive ? 'border-primary/50' : 'border-border/30'} flex items-center justify-center relative shadow-inner`}>
                                    {cameraActive ? (
                                        <>
                                            <img
                                                src={`${API_BASE}/video_feed`}
                                                alt="Circulation Camera Stream"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 border-[3px] border-primary/40 rounded-xl pointer-events-none" />
                                            {/* Aim Assist */}
                                            <div className="absolute w-48 h-24 border-2 border-dashed border-primary/60 rounded-lg pointer-events-none" />
                                            <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] uppercase font-bold text-white tracking-widest">Live Scanning</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-textDim">
                                            <Camera size={36} className="opacity-30" />
                                            <p className="text-sm font-medium">Camera is offline</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Manual Entry */}
                                <form onSubmit={handleManualAdd} className="flex gap-2 mt-2">
                                    <div className="relative flex-1">
                                        <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-textDim" size={14} />
                                        <input
                                            type="text"
                                            value={manualBarcode}
                                            onChange={e => setManualBarcode(e.target.value)}
                                            placeholder="Or enter barcode manually..."
                                            className="w-full bg-background border border-border/60 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-textMain focus:outline-none focus:border-primary/60"
                                        />
                                    </div>
                                    <button type="submit" disabled={!manualBarcode.trim()} className="px-4 bg-surface hover:bg-surface/80 border border-border/50 text-textMain text-xs font-bold uppercase rounded-lg disabled:opacity-50 tracking-wider">
                                        Add
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Cart & Details */}
                    <div className="w-[420px] flex flex-col gap-6">
                        <div className="glass-panel p-6 bg-surface/30 border-border/50 rounded-2xl flex flex-col flex-1">
                            
                            {/* Student Info (Checkout Only) */}
                            <AnimatePresence>
                                {mode === 'checkout' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                                        <h3 className="text-xs font-bold text-textDim uppercase tracking-widest mb-3 border-b border-border/50 pb-2">Borrower Details</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] text-textDim font-bold uppercase tracking-widest mb-1.5">Register Number / ID</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                                                    <input
                                                        type="text"
                                                        required={mode === 'checkout'}
                                                        value={studentId}
                                                        onChange={(e) => setStudentId(e.target.value)}
                                                        placeholder="e.g. 2406037"
                                                        className="w-full bg-background border border-border/60 rounded-lg pl-9 pr-3 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary/60"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-textDim font-bold uppercase tracking-widest mb-1.5 flex justify-between">
                                                    <span>Registered Email</span>
                                                    <span className="text-primary/60">@srec.ac.in only</span>
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                                                    <input
                                                        type="email"
                                                        required={mode === 'checkout'}
                                                        value={studentEmail}
                                                        onChange={(e) => setStudentEmail(e.target.value)}
                                                        placeholder="name.id@srec.ac.in"
                                                        className="w-full bg-background border border-border/60 rounded-lg pl-9 pr-3 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary/60"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-textDim font-bold uppercase tracking-widest mb-1.5">Expected Due Path</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                                                    <select
                                                        value={dueDateOffset}
                                                        onChange={(e) => setDueDateOffset(e.target.value)}
                                                        className="w-full bg-background border border-border/60 rounded-lg pl-9 pr-3 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary/60 appearance-none"
                                                    >
                                                        <option value="7">1 Week</option>
                                                        <option value="30">1 Month (Default)</option>
                                                        <option value="60">2 Months</option>
                                                        <option value="90">3 Months</option>
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l border-b border-textDim w-2 h-2 rotate-[-45deg] mr-1 mb-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Cart List */}
                            <div className="flex-1 min-h-[150px] flex flex-col">
                                <h3 className="text-xs font-bold text-textDim uppercase tracking-widest mb-3 border-b border-border/50 pb-2 flex justify-between">
                                    <span>Scanned Items</span>
                                    <span className="bg-primary/20 text-primary px-1.5 rounded">{cart.length}</span>
                                </h3>
                                
                                {cart.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-textDim/50 mt-4 mb-8">
                                        <ScanLine size={32} className="mb-2 opacity-50" />
                                        <p className="text-xs font-medium uppercase tracking-wider">Queue is Empty</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-6 max-h-[300px]">
                                        <AnimatePresence>
                                            {cart.map((b, idx) => (
                                                <motion.div 
                                                    key={`${b}-${idx}`} 
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="flex items-center justify-between bg-background border border-border/60 p-2.5 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{idx + 1}</div>
                                                        <span className="text-sm font-mono font-medium text-textMain">{b}</span>
                                                    </div>
                                                    <button onClick={() => removeBarcode(b)} className="text-textDim hover:text-rose-400 p-1 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleAction}
                                disabled={isLoading || cart.length === 0 || (mode === 'checkout' && (!studentId || !studentEmail))}
                                className={`w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${mode === 'checkout' ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'} disabled:opacity-50 disabled:cursor-not-allowed mt-auto`}
                            >
                                {isLoading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : mode === 'checkout' ? (
                                    <><CheckSquare size={18} /> Issue {cart.length > 0 ? cart.length : ''} Items</>
                                ) : (
                                    <><RotateCcw size={18} /> Process Return ({cart.length})</>
                                )}
                            </button>
                        </div>
                        
                        {/* Status Overlay Info */}
                        {lastActionDetails && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-border/50 bg-surface/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${lastActionDetails.type === 'checkout' ? 'bg-primary' : 'bg-emerald-500'}`} />
                                    <span className="text-xs font-bold uppercase tracking-widest text-textDim">Last Transaction: {lastActionDetails.type}</span>
                                </div>
                                <p className="text-sm text-textMain mb-1">Status: <span className="font-bold text-success">Success</span></p>
                                {lastActionDetails.type === 'checkout' && <p className="text-xs text-textDim">Due Date: <span className="text-warning font-semibold">{lastActionDetails.book?.due_date}</span></p>}
                            </motion.div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
