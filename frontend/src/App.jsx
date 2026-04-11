import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import MisplacedDashboard from './pages/MisplacedDashboard';
import Overview from './pages/Overview';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { socket } from './socket';

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute>
                            <PageWrapper><AdminPanel /></PageWrapper>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/overview"
                    element={
                        <PrivateRoute>
                            <PageWrapper><Overview /></PageWrapper>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/misplaced"
                    element={
                        <PrivateRoute>
                            <PageWrapper><MisplacedDashboard /></PageWrapper>
                        </PrivateRoute>
                    }
                />
            </Routes>
        </AnimatePresence>
    );
};

const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full h-full"
    >
        {children}
    </motion.div>
);

function App() {
    useEffect(() => {
        socket.connect();

        const savedSettings = localStorage.getItem('librobot_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
            } catch (e) {
                console.error("Theme boot failed", e);
            }
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        return () => { socket.disconnect(); };
    }, []);

    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen relative font-mono text-gray-100 bg-background overflow-hidden selection:bg-primary/30">
                    <AnimatedRoutes />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
