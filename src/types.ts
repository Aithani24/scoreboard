export type Sport = 'Football' | 'Basketball' | 'Cricket' | 'Volleyball' | 'Badminton' | 'Table Tennis';

export interface Match {
  id: number;
  sport: Sport;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'Live' | 'Finished';
  period: string;
  startTime: string;
  finishTime?: string;
}

export interface ServerToClientEvents {
  'matches:init': (matches: Match[]) => void;
  'match:created': (match: Match) => void;
  'match:updated': (match: Match) => void;
  'match:deleted': (id: number) => void;
}

export interface ClientToServerEvents {
  'match:create': (data: { sport: Sport; teamA: string; teamB: string }) => void;
  'match:updateScore': (data: { id: number; team: 'A' | 'B'; delta: number }) => void;
  'match:updatePeriod': (data: { id: number; period: string }) => void;
  'match:finish': (id: number) => void;
  'match:delete': (id: number) => void;
}
