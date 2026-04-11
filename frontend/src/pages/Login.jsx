import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, mockLogin } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);

            // DEMO BYPASS: Allow login with specific credentials for testing/demo
            if (email === 'admin@librobot.com' && password === 'admin123') {
                await mockLogin(email);
                navigate('/admin');
                setLoading(false);
                return;
            }

            await login(email, password);
            navigate('/admin');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />

            {/* Grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(var(--primary-rgb),0.025) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(var(--primary-rgb),0.025) 1px, transparent 1px)`,
                    backgroundSize: '5rem 5rem'
                }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo */}
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex items-center justify-center gap-2.5 mb-8 w-full group focus:outline-none"
                    title="Return Home"
                >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg group-hover:bg-primary/30 transition-colors">
                        <BookOpen size={20} className="text-primary" />
                    </div>
                    <span className="text-sm font-black tracking-[0.2em] uppercase text-textMain group-hover:text-primary transition-colors">LIBRO-BOT</span>
                </button>

                {/* Form Box */}
                <div className="relative bg-surface/70 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.3)] transition-colors duration-300">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none opacity-50">
                        <div className="absolute top-px left-4 right-0 h-px bg-primary/30" />
                        <div className="absolute top-4 left-px bottom-0 w-px bg-primary/30" />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-5">
                            <ShieldCheck size={11} />
                            Restricted Access
                        </div>
                        <h1 className="text-2xl font-black text-textMain tracking-tight mb-1.5 uppercase">Admin Sign In</h1>
                        <p className="text-textDim text-sm font-medium">Enter your credentials to access the control panel</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-sm mb-6 text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <div className="space-y-4">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-textDim ml-1 transition-colors group-focus-within:text-primary">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        autoComplete="off"
                                        className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-textDim ml-1 transition-colors group-focus-within:text-primary">Security Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-textDim hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_5px_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.5)] transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    Enter Console
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Link */}
                    <div className="text-center mt-10">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 text-textDim hover:text-primary transition-all group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Return Home</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
