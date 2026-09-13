import { Player, Match, LeagueSettings } from '../types';

export const INITIAL_SETTINGS: LeagueSettings = {
  leagueName: 'Liga Gentlemanów Tenisa',
  season: 'Sezon 2026 • Oficjalne Rozgrywki',
  points2_0: 3,
  points2_1: 2,
  points1_2: 1,
  points0_2: 0,
  superTiebreakDecider: true,
};

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Przemysław Chłuś',
    nickname: 'Komisarz',
    phone: '+48 600 000 000',
    email: 'przemyslaw.chlus@gmail.com',
    avatarColor: 'bg-emerald-800',
    playStyle: 'Zawsze petarda',
    preferredSurfaces: ['Mączka', 'Twardy'],
    preferredTimes: 'Wieczory',
    preferredCourts: 'Silva Sport',
    status: 'active',
    notes: 'Komisarz Ligi Gentlemanów Tenisa'
  }
];

export const INITIAL_MATCHES: Match[] = [];
