export enum GameState {
  MENU = 'MENU',
  SETUP = 'SETUP',
  IDLE = 'IDLE',
  TOSSING = 'TOSSING',
  ACTION_WINDOW = 'ACTION_WINDOW', // 空中操作时间窗
  CAUGHT = 'CAUGHT',
  DROPPED = 'DROPPED',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
  TIMBANG = 'TIMBANG', // 称重环节
  SUMMARY = 'SUMMARY'
}

export enum Difficulty {
  NOVICE = 'NOVICE',
  NORMAL = 'NORMAL',
  MASTER = 'MASTER'
}

export interface DifficultyConfig {
  airWindow: number; // 秒 (2.5, 1.6, 1.1)
  gravity: number;   // 视觉重力加速度 (-10, -15, -20)
  autoScatter: boolean; // 是否自动分散摆放
  failConsequence: 'RETRY_CYCLE' | 'RESTART_LEVEL' | 'GAME_OVER';
  showGuideLines: boolean; // 是否显示引导线
  comboMultiplier: boolean; // 是否开启连击倍率
  allowCorrection: boolean; // 是否允许误触纠正
}

export interface StageConfig {
  action: 'PICK' | 'PLACE' | 'EXCHANGE';
  count: number; // 本次动作需要操作的数量
  messageKey: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  stages: StageConfig[]; // 一个关卡内的多个 Cycle
  initialHandStones: number;
  initialGroundStones: number;
  isExchangeLevel?: boolean; // 用于 Buah 6 / Tukar
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

// 队伍成员数据
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
