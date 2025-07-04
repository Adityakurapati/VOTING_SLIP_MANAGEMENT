import React, { createContext, useContext, useState, useEffect } from "react";
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
  refreshVoters: (village: string, division: string, vibhag: string) => void;
  updateVoterStatus: (
    voter: Voter,
    field: string,
    value: any
  ) => Promise<boolean>;
}

const VoterContext = createContext<VoterContextType>({
  voters: [],
  loading: false,
  error: null,
  currentVillage: null,
  currentDivision: null,
  currentVibhag: null,
  refreshVoters: () => {},
  updateVoterStatus: async () => false,
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

  const refreshVoters = (village: string, division: string, vibhag: string) => {
    if (!village || !division || !vibhag) return;

    setLoading(true);
    setCurrentVillage(village);
    setCurrentDivision(division);
    setCurrentVibhag(vibhag);

    const votersRef = ref(
      database,
      `villages/${village}/${division}/${vibhag}/मतदार_यादी`
    );

    const unsubscribe = onValue(votersRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const votersData = Object.entries(data).map(([key, value]) => ({
            ...(value as any),
            firebaseKey: key,
            village,
            division,
            vibhag,
          }));
          setVoters(votersData);
        } else {
          setVoters([]);
          setError("No voters found");
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    });

    return unsubscribe;
  };

  const updateVoterStatus = async (voter: Voter, field: string, value: any) => {
    try {
      const voterRef = ref(
        database,
        `villages/${voter.village}/${voter.division}/${voter.vibhag}/मतदार_यादी/${voter.firebaseKey}`
      );

      await update(voterRef, {
        [field]: value,
      });

      // Update local state immediately
      setVoters((prevVoters) =>
        prevVoters.map((v) =>
          v.firebaseKey === voter.firebaseKey ? { ...v, [field]: value } : v
        )
      );

      return true;
    } catch (error) {
      console.error("Update failed:", error);
      return false;
    }
  };

  const contextValue = {
    voters,
    loading,
    error,
    currentVillage,
    currentDivision,
    currentVibhag,
    refreshVoters,
    updateVoterStatus,
  };

  return React.createElement(
    VoterContext.Provider,
    { value: contextValue },
    children
  );
};

export const useVoters = () => useContext(VoterContext);
