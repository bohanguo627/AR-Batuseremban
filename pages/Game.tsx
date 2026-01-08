/// <reference types="@react-three/fiber" />
import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import Webcam from 'react-webcam';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Cylinder, Sphere, Float, Text, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { OBJLoader } from 'three-stdlib';
import { useLanguage } from '../context/LanguageContext';
import { GameState, Difficulty } from '../types'; // 确保引入了 Difficulty

// --- Configuration ---
const MOBILE_CONSTRAINTS = {
  facingMode: "environment",
  width: { ideal: 1280 },
  height: { ideal: 720 } 
};

const DESKTOP_CONSTRAINTS = {
  width: 1280,
  height: 720,
  facingMode: "user"
};

const PICKUP_THRESHOLD_Y = -2.0; 
const RELOAD_THRESHOLD_Y = -1.0; 
const TOSS_THRESHOLD_Y = 0.5; 

// 难度参数表
const DIFFICULTY_CONFIG = {
  [Difficulty.NOVICE]: {
    airWindow: 2.5,
    gravity: -8, // 较轻的重力，滞空长
    scoreMultiplier: 0,
    failPenalty: 'RETRY_CYCLE', // 新手失败只重试当前Cycle
    canSortStones: true
  },
  [Difficulty.NORMAL]: {
    airWindow: 1.6,
    gravity: -15, // 标准重力
    scoreMultiplier: 1,
    failPenalty: 'RESTART_LEVEL', // 普通失败重开关卡
    canSortStones: false
  },
  [Difficulty.MASTER]: {
    airWindow: 1.1,
    gravity: -25, // 极强重力，极快下落
    scoreMultiplier: 2,
    failPenalty: 'GAME_OVER', // 大师失败直接结束
    canSortStones: false
  }
};

interface StageConfig { action: 'PICK' | 'PLACE' | 'EXCHANGE'; count: number; messageKey: string; }

interface LevelConfig { 
    id: number; 
    name: string; 
    stages: StageConfig[]; 
    catchRadius: number; 
    initialHandStones: number; 
    initialGroundStones: number; 
    isExchangeLevel?: boolean; 
}

// 关卡配置 (逻辑结构)
const LEVELS: Record<number, LevelConfig> = {
  1: { id: 1, name: "BUAH SATU", stages: [{ action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 1, messageKey: "msg_pick_1" }], catchRadius: 5.0, initialHandStones: 1, initialGroundStones: 4 },
  2: { id: 2, name: "BUAH DUA", stages: [{ action: 'PICK', count: 2, messageKey: "msg_pick_2" }, { action: 'PICK', count: 2, messageKey: "msg_pick_2" }], catchRadius: 4.5, initialHandStones: 1, initialGroundStones: 4 },
  3: { id: 3, name: "BUAH TIGA", stages: [{ action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 3, messageKey: "msg_pick_3" }], catchRadius: 4.0, initialHandStones: 1, initialGroundStones: 4 },
  4: { id: 4, name: "BUAH EMPAT", stages: [{ action: 'PICK', count: 4, messageKey: "msg_pick_4" }], catchRadius: 3.8, initialHandStones: 1, initialGroundStones: 4 },
  5: { id: 5, name: "BUAH LIMA", stages: [{ action: 'PLACE', count: 4, messageKey: "msg_place_4" }, { action: 'PICK', count: 4, messageKey: "msg_pick_4" }], catchRadius: 3.8, initialHandStones: 5, initialGroundStones: 0 },
  6: { id: 6, name: "TUKAR", stages: [{ action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }, { action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }, { action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }], catchRadius: 3.5, initialHandStones: 2, initialGroundStones: 3, isExchangeLevel: true },
  7: { id: 7, name: "BUAH TUJUH", stages: [{ action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }, { action: 'PICK', count: 3, messageKey: "msg_pick_3" }], catchRadius: 3.2, initialHandStones: 2, initialGroundStones: 3, isExchangeLevel: true },
  8: { id: 8, name: "BUAH LAPAN", stages: [{ action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 4, messageKey: "msg_pick_4" }], catchRadius: 3.0, initialHandStones: 0, initialGroundStones: 5 },
};

// ... (UseMediaPipeInput hook 保持不变，可以直接复制原来的) ...
const useMediaPipeInput = (webcamRef: React.RefObject<Webcam>, isMobile: boolean, facingMode: string) => {
  const handPos = useRef(new THREE.Vector3(0, -3, 0)); 
  const isPinching = useRef(false);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTime = useRef(-1);
  const { viewport } = useThree(); 

  useEffect(() => {
    const setupModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.3, 
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3
        });
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
      }
    };
    setupModel();
  }, []);

  useFrame(() => {
    if (!landmarkerRef.current || !webcamRef.current?.video || webcamRef.current.video.readyState !== 4) return;
    const video = webcamRef.current.video;
    if (video.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = video.currentTime;
      const result = landmarkerRef.current.detectForVideo(video, performance.now());
      if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];
        const sensitivity = 2.5; 
        let xMultiplier = viewport.width * sensitivity; 
        let yMultiplier = viewport.height * sensitivity; 
        let x;
        if (facingMode === 'user') {
             x = -(landmarks[8].x - 0.5) * xMultiplier;
        } else {
             x = (landmarks[8].x - 0.5) * xMultiplier; 
        }
        let y = -(landmarks[8].y - 0.55) * yMultiplier; 
        x = Math.max(-viewport.width/2 + 0.5, Math.min(viewport.width/2 - 0.5, x));
        y = Math.max(-viewport.height/2 + 0.5, Math.min(viewport.height/2 - 0.5, y));
        handPos.current.lerp(new THREE.Vector3(x, y, 0), 0.8); 
        const dx = landmarks[4].x - landmarks[8].x;
        const dy = landmarks[4].y - landmarks[8].y;
        isPinching.current = Math.sqrt(dx*dx + dy*dy) < 0.08;
      }
    }
  });
  return { handPos, isPinching };
};

// ... (BatuModel, MannequinHand, BatuSandbag, GroundStones 保持不变) ...
const BatuModel = ({ color, scale = 1, opacity = 1 }: { color: string, scale?: number, opacity?: number }) => {
  const obj = useLoader(OBJLoader, '/models/white_mesh.obj') as THREE.Group;
  const clone = useMemo(() => {
    const c = obj.clone();
    c.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: color, roughness: 0.5, metalness: 0.1, transparent: opacity < 1, opacity: opacity, emissive: color, emissiveIntensity: 0.4
        });
      }
    });
    return c;
  }, [obj, color, opacity]);
  return <primitive object={clone} scale={[scale, scale, scale]} />;
};

// (此处为了节省篇幅，省略 MannequinHand, BatuSandbag, GroundStones 的具体代码，请保留原文件中的实现)
// 假设 MannequinHand, BatuSandbag, GroundStones 组件已经在此处定义...
const MannequinHand = ({ position, stonesInHand, isGrabbing, canToss, isMobile, isExchangeLevel = false }: any) => {
    // ... 复制原来的 MannequinHand 代码 ...
    return <group position={position}><Sphere args={[0.5]}><meshStandardMaterial color="orange"/></Sphere></group>; // Placeholder if needed
};
const BatuSandbag = ({ position, rotation }: any) => <group position={position} rotation={rotation}><Sphere args={[0.2]}><meshStandardMaterial color="red"/></Sphere></group>;
const GroundStones = ({ count, isExchangeLevel, pinkCount }: any) => <group position={[0,-3.5,-1]}></group>;


const GameScene = ({ webcamRef, level, difficulty, onProgress, onLevelComplete, onFail, onScoreUpdate, isMobile, manualTossRef, facingMode }: any) => {
  const { handPos, isPinching } = useMediaPipeInput(webcamRef, isMobile, facingMode);
  const config = LEVELS[level as number];
  const diffConfig = DIFFICULTY_CONFIG[difficulty as Difficulty];
  
  const { t } = useLanguage();
  
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [stonePos, setStonePos] = useState(new THREE.Vector3());
  const [stoneVel, setStoneVel] = useState(new THREE.Vector3());
  const [stoneRot, setStoneRot] = useState(new THREE.Euler());
  const [message, setMessage] = useState("Scan Hand...");
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stonesOnGround, setStonesOnGround] = useState(0);
  const [stonesInHand, setStonesInHand] = useState(0);
  const [actionPerformed, setActionPerformed] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [canToss, setCanToss] = useState(true);
  
  // 计分相关
  const [combo, setCombo] = useState(0);
  const [cycleStartTime, setCycleStartTime] = useState(0);

  useEffect(() => {
    if (!hasStarted && handPos.current.y > -2.9) {
        setHasStarted(true);
        setMessage(t(config.stages[0].messageKey as any));
    } else if (!hasStarted) {
        setMessage(t('game_scan'));
    }
  }, [handPos.current.y, t, config, hasStarted]);

  useEffect(() => {
    const stage = config.stages[0];
    setCurrentStageIndex(0);
    setStonesOnGround(config.initialGroundStones);
    setStonesInHand(config.initialHandStones);
    setGameState(GameState.IDLE);
    setMessage(t(stage.messageKey as any));
    setActionPerformed(false);
    setCanToss(true);
    setCombo(0); // 新关卡重置Combo
    onProgress({ stage: 0, totalStages: config.stages.length });
  }, [level, config, t]);

  const currentStage = config.stages[currentStageIndex];

  const triggerToss = () => {
    if ((gameState === GameState.IDLE || gameState === GameState.HOLDING || gameState === GameState.CAUGHT) && stonesInHand > 0) {
        setStonesInHand(s => s - 1);
        setGameState(GameState.TOSSING);
        
        // 计算初始速度：v0 = (gravity * time) / 2 的反向
        // 确保滞空时间 total time = airWindow
        const totalAirTime = diffConfig.airWindow;
        const g = Math.abs(diffConfig.gravity);
        const vy = (g * totalAirTime) / 2;
        
        setStoneVel(new THREE.Vector3(0, vy, 0)); 
        setActionPerformed(false);
        setMessage(""); 
        setCanToss(false);
        setCycleStartTime(performance.now());
    }
  };

  useEffect(() => {
    if (manualTossRef.current) manualTossRef.current.onclick = triggerToss;
  }, [gameState, stonesInHand]);

  useFrame((_, delta) => {
    if (gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER) return;

    // Reload Logic
    if (!canToss && handPos.current.y < RELOAD_THRESHOLD_Y && gameState === GameState.IDLE) setCanToss(true);
    
    // Auto Toss (Optional, mostly manual now)
    if (canToss && handPos.current.y > TOSS_THRESHOLD_Y && stonesInHand > 0 && gameState === GameState.IDLE) triggerToss();

    // Interaction Window Logic
    if ((gameState === GameState.TOSSING || gameState === GameState.FALLING) && handPos.current.y < PICKUP_THRESHOLD_Y && !actionPerformed) {
      // 判定逻辑
      let success = false;
      if (currentStage.action === 'PICK' && stonesOnGround >= currentStage.count) {
        setStonesOnGround(s => s - currentStage.count);
        setStonesInHand(s => s + currentStage.count);
        success = true;
      } else if (currentStage.action === 'PLACE' && stonesInHand >= currentStage.count) {
        setStonesOnGround(s => s + currentStage.count);
        setStonesInHand(s => s - currentStage.count);
        success = true;
      } else if (currentStage.action === 'EXCHANGE') {
        success = true; // 简化：只要下去就算交换成功（Demo）
      }
      
      if(success) setActionPerformed(true);
    }

    switch (gameState) {
      case GameState.IDLE: case GameState.HOLDING: case GameState.CAUGHT:
        const holdPos = handPos.current.clone().add(new THREE.Vector3(0, 0.6, 0.2));
        setStonePos(holdPos);
        if (gameState === GameState.CAUGHT) setTimeout(() => setGameState(GameState.IDLE), 200); 
        break;

      case GameState.TOSSING: case GameState.FALLING:
        let newVel = stoneVel.clone();
        newVel.y += diffConfig.gravity * delta; // 使用难度配置的重力
        let newPos = stonePos.clone().add(newVel.clone().multiplyScalar(delta));

        // 简单的墙壁反弹
        if (newPos.x > 5) { newPos.x = 5; newVel.x *= -0.6; }
        else if (newPos.x < -5) { newPos.x = -5; newVel.x *= -0.6; }
        
        setStoneVel(newVel);
        setStonePos(newPos);
        setStoneRot(new THREE.Euler(stoneRot.x + delta * 5, stoneRot.y + delta * 3, 0));

        if (newVel.y < 0) setGameState(GameState.FALLING);

        // 接住判定
        if (gameState === GameState.FALLING && newPos.distanceTo(handPos.current) < config.catchRadius) {
           if (!actionPerformed) {
              // 没完成动作就接住 -> 失败
              handleFail(t('game_missed_action'));
           } else {
              // 成功接住 -> 计算分数
              handleSuccess();
           }
        }
        
        // 掉落判定
        if (newPos.y < -6) {
          handleFail(t('game_dropped'));
        }
        break;
    }
  });

  const handleSuccess = () => {
      // 计分逻辑
      let points = 10;
      
      // Perfect 判定 (剩余时间 > 20%? 这里简化为看是否还有多余的高度)
      const isPerfect = stonePos.y > 0; // 如果接住时位置还比较高，算Perfect（简化）
      if (isPerfect) points += 10;
      
      // Combo 计算
      let newCombo = combo + 1;
      let multiplier = 1;
      if (newCombo >= 20) multiplier = 3;
      else if (newCombo >= 10) multiplier = 2;
      else if (newCombo >= 5) multiplier = 1.5;
      
      if (difficulty === Difficulty.MASTER && !isPerfect) {
          newCombo = 0; // 大师模式必须Perfect才涨Combo
      }
      setCombo(newCombo);
      onScoreUpdate(points * multiplier);

      setStonesInHand(s => s + 1); 
      const nextStageIndex = currentStageIndex + 1;
      if (nextStageIndex >= config.stages.length) {
        setGameState(GameState.LEVEL_COMPLETE);
        setMessage(t('game_level_complete'));
        onLevelComplete();
      } else {
        setGameState(GameState.CAUGHT);
        setCurrentStageIndex(nextStageIndex);
        setMessage(t(config.stages[nextStageIndex].messageKey as any));
        setActionPerformed(false); 
        onProgress({ stage: nextStageIndex, totalStages: config.stages.length });
      }
  };

  const handleFail = (failMsg: string) => {
      setMessage(failMsg);
      
      if (diffConfig.failPenalty === 'GAME_OVER') {
          setGameState(GameState.GAME_OVER);
          onFail(true); // IsFatal
      } else if (diffConfig.failPenalty === 'RESTART_LEVEL') {
          setGameState(GameState.DROPPED);
          onFail(false);
          // 重置本关
          setTimeout(() => {
            resetLevel();
          }, 1500);
      } else {
          // NOVICE: RETRY CYCLE
          setGameState(GameState.DROPPED);
          setTimeout(() => {
              // 重试当前Cycle，不重置整个关卡
              setGameState(GameState.IDLE);
              setStonesInHand(s => s + 1); // 假装捡回来了
              setActionPerformed(false);
              setCanToss(true);
              setMessage(t('game_retry'));
          }, 1500);
      }
  };

  const resetLevel = () => {
    const stage = config.stages[0];
    setCurrentStageIndex(0);
    setStonesOnGround(config.initialGroundStones);
    setStonesInHand(config.initialHandStones);
    setGameState(GameState.IDLE);
    setMessage(t(stage.messageKey as any));
    setActionPerformed(false);
    setCanToss(true);
    setCombo(0);
    onProgress({ stage: 0, totalStages: config.stages.length });
  };

  // ... (渲染部分，加入 Combo 显示等)
  return (
    <>
      <ambientLight intensity={2.0} />
      <pointLight position={[10, 10, 10]} color="#fbbf24" intensity={1.5} />
      <directionalLight position={[0, 5, 5]} intensity={1} />

      <MannequinHand position={handPos.current} stonesInHand={stonesInHand-1} isGrabbing={isPinching.current} canToss={canToss} isMobile={isMobile} />
      
      {gameState !== GameState.DROPPED && stonesInHand > 0 && <BatuSandbag position={stonePos} rotation={stoneRot} />}
      
      <GroundStones count={stonesOnGround} isExchangeLevel={config.isExchangeLevel} pinkCount={currentStageIndex} />

      {/* UI Texts */}
      <Text position={[0, isMobile?0:3.5, 0]} fontSize={0.5} color="white">{message}</Text>
      {/* Combo Display */}
      {combo > 1 && (
          <Text position={[2, 3, 0]} fontSize={0.4} color="#facc15">
              {combo} COMBO!
          </Text>
      )}
    </>
  );
};

// --- Main Game Component ---
const Game: React.FC<{ onGameOver: () => void; onExit: () => void }> = ({ onGameOver, onExit }) => {
  const webcamRef = useRef<Webcam>(null);
  const manualTossRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMemo(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), []);
  
  // Game State
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NOVICE);
  const [score, setScore] = useState(0);
  
  const [progress, setProgress] = useState({ stage: 0, totalStages: 1 });
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMsg, setOverlayMsg] = useState("");
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);

  const { t } = useLanguage();

  const handleScoreUpdate = (points: number) => {
      setScore(s => s + points);
  };

  const startGame = (diff: Difficulty) => {
      setDifficulty(diff);
      setShowDifficultySelect(false);
      setScore(0);
      setLevel(1);
  };

  const handleLevelComplete = () => {
    setScore(s => s + 50); // Level Bonus
    setOverlayMsg(`LEVEL ${level} CLEARED!`);
    setShowOverlay(true);
    setTimeout(() => {
       if (level < 8) {
           setLevel(l => l + 1);
           setShowOverlay(false);
       } else { 
           setOverlayMsg("CHAMPION!"); 
           // Timbang logic would go here
       }
    }, 2500);
  };

  const handleFail = (isFatal: boolean) => {
      if (isFatal) {
          setOverlayMsg("GAME OVER");
          setShowOverlay(true);
      }
  };

  if (showDifficultySelect) {
      return (
          <div className="h-screen w-full bg-heritage-black flex flex-col items-center justify-center gap-6 p-6">
              <h1 className="text-4xl text-heritage-orange font-bold">SELECT DIFFICULTY</h1>
              <div className="flex flex-col gap-4 w-full max-w-md">
                  <button onClick={() => startGame(Difficulty.NOVICE)} className="p-4 bg-green-600 rounded text-white font-bold">NOVICE (Easy, Retry)</button>
                  <button onClick={() => startGame(Difficulty.NORMAL)} className="p-4 bg-yellow-600 rounded text-white font-bold">NORMAL (Classic)</button>
                  <button onClick={() => startGame(Difficulty.MASTER)} className="p-4 bg-red-600 rounded text-white font-bold">MASTER (Hardcore)</button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-[100dvh] w-full bg-heritage-black relative overflow-hidden">
      <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full opacity-30 object-cover" />
      
      {/* Score HUD */}
      <div className="absolute top-4 left-4 z-50 text-white font-bold text-xl">
          SCORE: {score}
      </div>

      <div className="absolute inset-0 z-10">
        <Canvas>
          <Suspense fallback={null}>
             <GameScene 
                webcamRef={webcamRef} 
                level={level} 
                difficulty={difficulty}
                onProgress={setProgress} 
                onLevelComplete={handleLevelComplete} 
                onFail={handleFail} 
                onScoreUpdate={handleScoreUpdate}
                isMobile={isMobile}
                manualTossRef={manualTossRef}
                facingMode="user"
             />
          </Suspense>
        </Canvas>
      </div>

      <button ref={manualTossRef} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-heritage-orange text-white w-24 h-24 rounded-full border-4 border-white/20 shadow-xl font-bold">
        TOSS
      </button>

      {showOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <h1 className="text-5xl text-heritage-orange font-bold">{overlayMsg}</h1>
        </div>
      )}
    </div>
  );
};

export default Game;
