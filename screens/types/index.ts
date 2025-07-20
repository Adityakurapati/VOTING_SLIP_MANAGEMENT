// types.ts
export type Session = {
  id: string;
  loginTime: string;
  logoutTime: string | null;
};

export type User = {
  id: string;
  phone: string;
  currentSession: string | null;
  sessions: Record<string, Session>;
};

export type UsersData = Record<string, User>;
