import React, {
        createContext,
        useContext,
        useState,
        useEffect,
        useCallback,
} from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebaseConfig";

interface Voter {
        firebaseKey: string;
        village: string;
        division: string;
        vibhag: string;
        [key: string]: any;
}

interface VoterContextType {
        voters: Voter[];
        loading: boolean;
        error: string | null;
        currentVillage: string | null;
        currentDivision: string | null;
        currentVibhag: string | null;
        refreshVoters: (
                village: string,
                division: string,
                vibhag: string
        ) => Promise<void>;
        updateVoterStatus: (
                voter: Voter,
                field: string,
                value: any
        ) => Promise<boolean>;
        clearError: () => void;
}

const VoterContext = createContext<VoterContextType>({
        voters: [],
        loading: false,
        error: null,
        currentVillage: null,
        currentDivision: null,
        currentVibhag: null,
        refreshVoters: async () => { },
        updateVoterStatus: async () => false,
        clearError: () => { },
});

export const VoterProvider: React.FC<{ children: React.ReactNode }> = ({
        children,
}) => {
        const [voters, setVoters] = useState<Voter[]>([]);
        const [currentVillage, setCurrentVillage] = useState<string | null>(null);
        const [currentDivision, setCurrentDivision] = useState<string | null>(null);
        const [currentVibhag, setCurrentVibhag] = useState<string | null>(null);
        const [loading, setLoading] = useState<boolean>(false);
        const [error, setError] = useState<string | null>(null);

        const clearError = useCallback(() => setError(null), []);

        const refreshVoters = useCallback(
                async (village: string, division: string, vibhag: string) => {
                        if (!village || !division || !vibhag) {
                                setError("Invalid village, division, or vibhag");
                                return;
                        }

                        setLoading(true);
                        clearError();
                        setCurrentVillage(village);
                        setCurrentDivision(division);
                        setCurrentVibhag(vibhag);

                        try {
                                const votersRef = ref(
                                        database,
                                        `villages/${village}/${division}/${vibhag}/मतदार_यादी`
                                );

                                return new Promise<void>((resolve, reject) => {
                                        const unsubscribe = onValue(
                                                votersRef,
                                                (snapshot) => {
                                                        try {
                                                                const data = snapshot.val();
                                                                if (data) {
                                                                        const votersData = Object.entries(data).map(
                                                                                ([key, value]) => ({
                                                                                        ...(value as any),
                                                                                        firebaseKey: key,
                                                                                        village,
                                                                                        division,
                                                                                        vibhag,
                                                                                })
                                                                        );
                                                                        setVoters(votersData);
                                                                        resolve();
                                                                } else {
                                                                        setVoters([]);
                                                                        setError("No voters found in this area");
                                                                        reject("No voters found");
                                                                }
                                                        } catch (err: any) {
                                                                setError(err.message);
                                                                reject(err);
                                                        } finally {
                                                                setLoading(false);
                                                        }
                                                },
                                                (error) => {
                                                        setError(error.message);
                                                        setLoading(false);
                                                        reject(error);
                                                }
                                        );

                                        return () => unsubscribe();
                                });
                        } catch (err: any) {
                                setError(err.message);
                                setLoading(false);
                                throw err;
                        }
                },
                [clearError]
        );

        const updateVoterStatus = useCallback(
                async (voter: Voter, field: string, value: any) => {
                        if (!voter?.firebaseKey) {
                                setError("Invalid voter data");
                                return false;
                        }

                        setLoading(true);
                        clearError();

                        try {
                                const voterRef = ref(
                                        database,
                                        `villages/${voter.village}/${voter.division}/${voter.vibhag}/मतदार_यादी/${voter.firebaseKey}`
                                );

                                await update(voterRef, { [field]: value });

                                // Optimistic update
                                setVoters((prevVoters) =>
                                        prevVoters.map((v) =>
                                                v.firebaseKey === voter.firebaseKey ? { ...v, [field]: value } : v
                                        )
                                );

                                return true;
                        } catch (err: any) {
                                setError(err.message);
                                // Revert optimistic update if needed
                                setVoters((prevVoters) => [...prevVoters]);
                                return false;
                        } finally {
                                setLoading(false);
                        }
                },
                [clearError]
        );

        const contextValue = {
                voters,
                loading,
                error,
                currentVillage,
                currentDivision,
                currentVibhag,
                refreshVoters,
                updateVoterStatus,
                clearError,
        };

        return (
                <VoterContext.Provider value={contextValue}>
                        {children}
                </VoterContext.Provider>
        );
};

export const useVoters = () => {
        const context = useContext(VoterContext);
        if (!context) {
                throw new Error("useVoters must be used within a VoterProvider");
        }
        return context;
};
