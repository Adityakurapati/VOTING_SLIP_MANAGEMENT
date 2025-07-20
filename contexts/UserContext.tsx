import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

type UserType = 'फील्ड एजंट' | 'प्रशासन';

interface UserContextType {
        userType: UserType;
        setUserType: (type: UserType) => void;
        userId: string | null;
        phoneNumber: string | null;
        loading: boolean;
}

const UserContext = createContext<UserContextType>({
        userType: 'फील्ड एजंट',
        setUserType: () => { },
        userId: null,
        phoneNumber: null,
        loading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [userType, setUserType] = useState<UserType>('फील्ड एजंट');
        const [userId, setUserId] = useState<string | null>(null);
        const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
                const auth = getAuth();
                const database = getDatabase();

                const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
                        if (user) {
                                setUserId(user.uid);

                                // Fetch user data from Realtime Database
                                const userRef = ref(database, `users/${user.uid}`);
                                const unsubscribeDB = onValue(userRef, (snapshot) => {
                                        const userData = snapshot.val();
                                        if (userData) {
                                                setPhoneNumber(userData.phone || null);
                                                // If user type is stored in database, use that
                                                if (userData.userType) {
                                                        setUserType(userData.userType);
                                                }
                                        }
                                        setLoading(false);
                                });

                                return () => unsubscribeDB();
                        } else {
                                setUserId(null);
                                setPhoneNumber(null);
                                setLoading(false);
                        }
                });

                return () => unsubscribeAuth();
        }, []);

        const value = {
                userType,
                setUserType,
                userId,
                phoneNumber,
                loading,
        };

        return (
                <UserContext.Provider value={value}>
                        {children}
                </UserContext.Provider>
        );
};

export const useUser = () => {
        const context = useContext(UserContext);
        if (!context) {
                throw new Error('useUser must be used within a UserProvider');
        }
        return context;
};
