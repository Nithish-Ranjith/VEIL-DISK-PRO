import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Enforce demo user for Web Web
        const demoUser = {
            username: 'demo_user',
            role: 'admin',
            canOptimize: true,
            canEditSettings: true,
            label: 'Administrator (Demo)'
        };
        setUser(demoUser);
        setIsLoading(false);
    }, []);

    const login = (userData) => {
        // Determine detailed role capabilities
        const enhancedUser = {
            ...userData,
            canOptimize: userData.role === 'admin',
            canEditSettings: userData.role === 'admin',
            label: userData.role === 'admin' ? 'Administrator' : 'Standard User'
        };

        setUser(enhancedUser);
        localStorage.setItem('sentinel_user', JSON.stringify(enhancedUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sentinel_user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
