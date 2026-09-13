export type CourtSurface = 'clay' | 'hard' | 'grass' | 'carpet';

export type PlayerStatus = 'active' | 'injured' | 'away';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  email?: string;
  avatarColor: string;
  playStyle?: string;
  preferredSurfaces: string[];
  preferredTimes?: string;
  preferredCourts?: string;
  status: PlayerStatus;
  notes?: string;
}

export interface TennisSet {
  games1: number;
  games2: number;
  tiebreak1?: number; // tiebreak points scored by player 1 (if 7:6 or 6:7)
  tiebreak2?: number; // tiebreak points scored by player 2
  isSuperTiebreak?: boolean; // if true, played to 10 points (3rd set decider)
}

export type MatchStatus = 'completed' | 'scheduled';
export type MatchType = 'league' | 'friendly';

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  courtName?: string;
  surface?: CourtSurface;
  sets: TennisSet[];
  winnerId?: string;
  status: MatchStatus;
  notes?: string;
  createdAt: number;
  matchType?: MatchType;
  isFriendly?: boolean;
  friendlyReason?: string;
}

export interface StandingRow {
  rank: number;
  player: Player;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  points: number;
  form: ('W' | 'L')[];
}

export interface LeagueSettings {
  leagueName: string;
  season: string;
  points2_0: number; // default 3
  points2_1: number; // default 2
  points1_2: number; // default 1
  points0_2: number; // default 0
  superTiebreakDecider: boolean; // default true (champion's tiebreak for 3rd set)
}

export interface H2HRecord {
  opponent: Player;
  played: number;
  wins: number;
  losses: number;
  matches: Match[];
}

export type ActiveTab = 'standings' | 'matches' | 'h2h' | 'players' | 'rules' | 'settings';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export interface User {
  id: string;
  email: string;
  name: string;
  playerId?: string;
  role: 'admin' | 'player';
  status?: UserStatus;
  phone?: string;
  nickname?: string;
  playStyle?: string;
  preferredCourts?: string;
  preferredTimes?: string;
  createdAt: number;
}

export interface StoredUser extends User {
  passwordHash: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export type LogAction =
  | 'REGISTRATION_ATTEMPT'
  | 'REGISTRATION_SUCCESS'
  | 'REGISTRATION_FAILED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'USER_APPROVED'
  | 'USER_REJECTED'
  | 'USER_BLOCKED'
  | 'USER_PROFILE_UPDATED'
  | 'MATCH_SAVED'
  | 'MATCH_DELETED'
  | 'SYSTEM_ERROR';

export interface SystemLog {
  id: string;
  action: LogAction;
  level: LogLevel;
  timestamp: number;
  userName?: string;
  userEmail?: string;
  details: string;
  metadata?: Record<string, any>;
}
