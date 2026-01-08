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