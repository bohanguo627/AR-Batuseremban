export enum GameState {
  IDLE = 'IDLE',
  TOSSING = 'TOSSING',
  FALLING = 'FALLING',
  CAUGHT = 'CAUGHT',
  DROPPED = 'DROPPED'
}

export enum Level {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5
}

// New difficulty system types
export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  NORMAL = 'NORMAL',
  MASTER = 'MASTER'
}

export interface DifficultyConfig {
  id: DifficultyLevel;
  airWindow: number; // Time window in seconds
  tossHeight: 'low' | 'medium' | 'high';
  allowRetry: boolean;
  failureEndsGame: boolean;
  showSlowMotion: boolean;
  showGuideLine: boolean;
  enableCombo: boolean;
  culturalEasterEggs: 'none' | 'minimal' | 'full';
}

export interface ScoreData {
  baseScore: number;
  perfectBonus: number;
  comboMultiplier: number;
  totalScore: number;
  failures: number;
  perfectCycles: number;
  maxCombo: number;
}

export interface ChallengeModifier {
  id: string;
  nameKey: string;
  descKey: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.BEGINNER]: {
    id: DifficultyLevel.BEGINNER,
    airWindow: 2.5,
    tossHeight: 'low',
    allowRetry: true,
    failureEndsGame: false,
    showSlowMotion: true,
    showGuideLine: true,
    enableCombo: false,
    culturalEasterEggs: 'minimal'
  },
  [DifficultyLevel.NORMAL]: {
    id: DifficultyLevel.NORMAL,
    airWindow: 1.6,
    tossHeight: 'medium',
    allowRetry: false,
    failureEndsGame: true, // ends level
    showSlowMotion: false,
    showGuideLine: false,
    enableCombo: false,
    culturalEasterEggs: 'full'
  },
  [DifficultyLevel.MASTER]: {
    id: DifficultyLevel.MASTER,
    airWindow: 1.1,
    tossHeight: 'high',
    allowRetry: false,
    failureEndsGame: true, // ends entire game
    showSlowMotion: false,
    showGuideLine: false,
    enableCombo: true,
    culturalEasterEggs: 'none'
  }
}

export interface TeamMember {
  name: string;
  role: string;
  matric: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
  sources?: { title: string; uri: string }[];
  followUpQuestions?: string[];
}

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Gan Shu Xian", role: "Project Director", matric: "24004577" },
  { name: "Natasya Beatrisya", role: "AR Development Lead", matric: "23002630" },
  { name: "Celine Leong", role: "AR Developer", matric: "24067206" },
  { name: "Wong Yee Ming", role: "AI Engineer", matric: "24004477" },
  { name: "Guo Bohan", role: "System Integrator", matric: "23114009" },
  { name: "Tan Yen Yee", role: "Cultural Research Lead", matric: "24004596" },
  { name: "Nicole Teh May Xin", role: "Content Lead", matric: "24004507" },
  { name: "Ng Jen Wen", role: "3D Designer", matric: "24004597" },
  { name: "Yeoh Yee Syuen", role: "UI/UX Designer", matric: "24004541" },
  { name: "Chia Jing Yuen", role: "Interaction Designer", matric: "24004611" },
];