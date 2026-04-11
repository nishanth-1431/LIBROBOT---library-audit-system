import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        setCurrentUser(null);
        return signOut(auth);
    }

    function mockLogin(email) {
        // Create a fake user object that looks like a Firebase user
        const fakeUser = {
            email: email,
            uid: 'demo_admin_uid',
            displayName: 'Demo Administrator',
            isAnonymous: false
        };
        setCurrentUser(fakeUser);
        localStorage.setItem('librobot_mock_user', JSON.stringify(fakeUser));
        return Promise.resolve(fakeUser);
    }

    useEffect(() => {
        // Check for mock user in storage on boot
        const savedMock = localStorage.getItem('librobot_mock_user');
        if (savedMock) {
            setCurrentUser(JSON.parse(savedMock));
            setLoading(false);
        }

        const unsubscribe = onAuthStateChanged(auth, user => {
            if (!localStorage.getItem('librobot_mock_user')) {
                setCurrentUser(user);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        logout,
        mockLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
