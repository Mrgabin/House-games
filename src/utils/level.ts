/**
 * ONL Level & XP Calculation Utility
 *
 * Rules:
 * - 30 minutes (00h30 = 1800 seconds) = 1 XP point.
 * - 10 XP points = 1 Level (Niveau).
 * - Total hours across all games accumulate for the Global ONL Level.
 * - Specific hours per game determine the specific Game Level.
 */

export interface LevelInfo {
  level: number;
  totalXp: number;
  xpInLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  totalSeconds: number;
  totalHours: number;
  totalMinutes: number;
  formattedPlaytime: string;
  rankTitle: string;
  badgeColor: {
    bg: string;
    border: string;
    text: string;
    glow: string;
  };
}

export function formatPlaytime(seconds: number): string {
  if (seconds <= 0) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.max(1, m)} min`;
}

export function calculateLevelFromSeconds(seconds: number): LevelInfo {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));

  // 30 min (1800 sec) = 1 XP
  const totalXp = Math.floor(safeSeconds / 1800);

  // 10 XP = 1 Niveau
  const level = Math.floor(totalXp / 10);
  const xpInLevel = totalXp % 10;
  const xpToNextLevel = 10 - xpInLevel;
  const progressPercent = Math.min(100, Math.round((xpInLevel / 10) * 100));

  const totalHours = Math.round((safeSeconds / 3600) * 10) / 10;
  const totalMinutes = Math.floor(safeSeconds / 60);

  // Rank / Title based on level
  let rankTitle = 'Recrue ONL';
  let badgeColor = {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-400/30',
    text: 'text-cyan-300',
    glow: 'rgba(76,230,255,0.4)'
  };

  if (level >= 50) {
    rankTitle = 'Légende ONL';
    badgeColor = {
      bg: 'bg-gradient-to-r from-amber-500/25 to-rose-500/25',
      border: 'border-amber-400/60',
      text: 'text-amber-300',
      glow: 'rgba(251,191,36,0.5)'
    };
  } else if (level >= 25) {
    rankTitle = 'Grand Maître ONL';
    badgeColor = {
      bg: 'bg-gradient-to-r from-rose-500/20 to-purple-500/25',
      border: 'border-rose-400/50',
      text: 'text-rose-300',
      glow: 'rgba(244,63,94,0.45)'
    };
  } else if (level >= 10) {
    rankTitle = 'Maître ONL';
    badgeColor = {
      bg: 'bg-purple-500/20',
      border: 'border-purple-400/40',
      text: 'text-purple-300',
      glow: 'rgba(168,85,247,0.4)'
    };
  } else if (level >= 5) {
    rankTitle = 'Vétéran ONL';
    badgeColor = {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-400/40',
      text: 'text-emerald-300',
      glow: 'rgba(52,211,153,0.4)'
    };
  } else if (level >= 1) {
    rankTitle = 'Joueur Confirmé';
    badgeColor = {
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-400/40',
      text: 'text-cyan-300',
      glow: 'rgba(56,189,248,0.4)'
    };
  }

  return {
    level,
    totalXp,
    xpInLevel,
    xpToNextLevel,
    progressPercent,
    totalSeconds: safeSeconds,
    totalHours,
    totalMinutes,
    formattedPlaytime: formatPlaytime(safeSeconds),
    rankTitle,
    badgeColor
  };
}

/**
 * Calculates Global ONL Level from a playtime map (record of gameId -> seconds)
 */
export function calculateGlobalLevel(playtimeSecondsMap: Record<string, number>): LevelInfo {
  const totalSeconds = Object.values(playtimeSecondsMap || {}).reduce(
    (sum, val) => sum + (typeof val === 'number' ? val : 0),
    0
  );
  return calculateLevelFromSeconds(totalSeconds);
}
