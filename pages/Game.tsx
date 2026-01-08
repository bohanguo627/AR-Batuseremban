/// <reference types="@react-three/fiber" />
import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import Webcam from 'react-webcam';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Cylinder, Sphere, Float, Text, Loader, Line } from '@react-three/drei';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { OBJLoader } from 'three-stdlib';
import { useLanguage } from '../context/LanguageContext';
import { GameState, Difficulty, DifficultyConfig, LevelConfig } from '../types';

// --- Configuration Constants ---
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

// 难度参数表
const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  [Difficulty.NOVICE]: {
    airWindow: 2.5,
    gravity: -8,     // 抛得低且慢
    autoScatter: true,
    failConsequence: 'RETRY_CYCLE',
    showGuideLines: true,
    comboMultiplier: false,
    allowCorrection: true
  },
  [Difficulty.NORMAL]: {
    airWindow: 1.6,
    gravity: -15,    // 正常重力
    autoScatter: false, // 半开（逻辑待定，这里简化为false）
    failConsequence: 'RESTART_LEVEL', // 失败重来本关
    showGuideLines: false,
    comboMultiplier: true,
    allowCorrection: false
  },
  [Difficulty.MASTER]: {
    airWindow: 1.1,
    gravity: -22,    // 抛得高且快（重力大意味着回落快）
    autoScatter: false,
    failConsequence: 'GAME_OVER', // 失败直接结算
    showGuideLines: false,
    comboMultiplier: true,
    allowCorrection: false
  }
};

// 关卡设计表
const GAME_LEVELS: Record<Difficulty, LevelConfig[]> = {
  [Difficulty.NOVICE]: [
    { id: 1, name: "Novice 1: Pick 1", stages: Array(4).fill({ action: 'PICK', count: 1, messageKey: "msg_pick_1" }), initialHandStones: 1, initialGroundStones: 4 },
    { id: 2, name: "Novice 2: Pick 2", stages: Array(2).fill({ action: 'PICK', count: 2, messageKey: "msg_pick_2" }), initialHandStones: 1, initialGroundStones: 4 },
    { id: 3, name: "Novice 3: Pick 4", stages: [{ action: 'PICK', count: 4, messageKey: "msg_pick_4" }], initialHandStones: 1, initialGroundStones: 4 }
  ],
  [Difficulty.NORMAL]: [
    { id: 1, name: "Buah Satu", stages: Array(4).fill({ action: 'PICK', count: 1, messageKey: "msg_pick_1" }), initialHandStones: 1, initialGroundStones: 4 },
    { id: 2, name: "Buah Dua", stages: Array(2).fill({ action: 'PICK', count: 2, messageKey: "msg_pick_2" }), initialHandStones: 1, initialGroundStones: 4 },
    { id: 3, name: "Buah Tiga", stages: [{ action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 3, messageKey: "msg_pick_3" }], initialHandStones: 1, initialGroundStones: 4 },
    { id: 4, name: "Buah Empat", stages: [{ action: 'PICK', count: 4, messageKey: "msg_pick_4" }], initialHandStones: 1, initialGroundStones: 4 },
    { id: 5, name: "Buah Lima", stages: [{ action: 'PLACE', count: 4, messageKey: "msg_place_4" }, { action: 'PICK', count: 4, messageKey: "msg_pick_4" }], initialHandStones: 5, initialGroundStones: 0 },
    { id: 6, name: "Tukar (Simplified)", stages: Array(3).fill({ action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }), initialHandStones: 2, initialGroundStones: 3, isExchangeLevel: true }
  ],
  [Difficulty.MASTER]: [
    // 大师模式复用普通模式关卡，但使用大师级物理参数
    { id: 1, name: "Master Buah Satu", stages: Array(4).fill({ action: 'PICK', count: 1, messageKey: "msg_pick_1" }), initialHandStones: 1, initialGroundStones: 4 },
    { id: 2, name: "Master Buah Dua", stages: Array(2).fill({ action: 'PICK', count: 2, messageKey: "msg_pick_2" }), initialHandStones: 1, initialGroundStones: 4 },
    { id: 3, name: "Master Buah Tiga", stages: [{ action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 3, messageKey: "msg_pick_3" }], initialHandStones: 1, initialGroundStones: 4 },
    { id: 4, name: "Master Buah Empat", stages: [{ action: 'PICK', count: 4, messageKey: "msg_pick_4" }], initialHandStones: 1, initialGroundStones: 4 },
    { id: 5, name: "Master Buah Lima", stages: [{ action: 'PLACE', count: 4, messageKey: "msg_place_4" }, { action: 'PICK', count: 4, messageKey: "msg_pick_4" }], initialHandStones: 5, initialGroundStones: 0 },
    // 大师挑战增加 Tukar
    { id: 6, name: "Master Tukar", stages: Array(3).fill({ action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }), initialHandStones: 2, initialGroundStones: 3, isExchangeLevel: true }
  ]
};

// --- Models & Hooks ---

const useMediaPipeInput = (webcamRef: React.RefObject<Webcam>, isMobile: boolean, facingMode: string) => {
  const handPos = useRef(new THREE.Vector3(0, -3, 0)); 
  const isPinching = useRef(false);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTime = useRef(-1);
  const { viewport } = useThree(); 

  useEffect(() => {
    const setupModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
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

const BatuModel = ({ color, scale = 1, opacity = 1 }: { color: string, scale?: number, opacity?: number }) => {
  const obj = useLoader(OBJLoader, '/models/white_mesh.obj') as THREE.Group;
  const clone = useMemo(() => {
    const c = obj.clone();
    c.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.5, 
          metalness: 0.1,
          transparent: opacity < 1,
          opacity: opacity,
          emissive: color,
          emissiveIntensity: 0.4
        });
      }
    });
    return c;
  }, [obj, color, opacity]);
  return <primitive object={clone} scale={[scale, scale, scale]} />;
};

const MannequinHand = ({ position, stonesInHand, isGrabbing, canToss, isMobile, isExchangeLevel = false }: any) => {
  const group = useRef<THREE.Group>(null);
  const skinColor = isGrabbing ? "#86efac" : (canToss ? "#ffffff" : "#eecfad");

  useFrame(() => {
    if(group.current) {
      group.current.position.copy(position);
      group.current.rotation.z = -position.x * 0.1;
      const targetRot = isGrabbing ? -0.8 : 0;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRot, 0.4);
      const scale = isMobile ? 1.2 : 1.4;
      group.current.scale.set(scale, scale, scale);
    }
  });

  // 简化的手指渲染，实际项目中可复用之前的完整代码
  return (
    <group ref={group}>
        <Sphere args={[0.6, 16, 16]} position={[0, 0, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
        {stonesInHand > 0 && Array.from({ length: stonesInHand }).map((_, i) => {
             const stoneColor = (isExchangeLevel && i === 0) ? "#ec4899" : "#fbbf24";
             return (
                <group key={i} position={[-0.2 + i * 0.15, 0.4, 0.3]} rotation={[0, 0, Math.random()]}>
                    <BatuModel color={stoneColor} scale={0.2} />
                </group>
             );
        })}
    </group>
  );
};

// 引导线组件（新手模式）
const GuideLine = ({ start, end }: { start: THREE.Vector3, end: THREE.Vector3 }) => {
  return <Line points={[start, end]} color="#3b82f6" lineWidth={3} dashed={true} opacity={0.7} transparent />;
};

const GroundStones = ({ count, isExchangeLevel = false }: { count: number, isExchangeLevel?: boolean }) => (
    <group position={[0, -3.5, -1]}>
      {Array.from({ length: count }).map((_, i) => (
         <group key={i} position={[(i - (count - 1) / 2) * 1.3, 0, 0]}>
             <BatuModel color={isExchangeLevel && i===0 ? "#ec4899" : "#52525b"} scale={0.4} />
         </group>
      ))}
    </group>
);

// --- Game Logic ---

const GameScene = ({ 
    webcamRef, 
    difficulty, 
    levelIndex, 
    onScoreUpdate, 
    onFail, 
    onLevelComplete,
    isMobile, 
    manualTossRef, 
    facingMode,
    score
}: any) => {
  const { handPos, isPinching } = useMediaPipeInput(webcamRef, isMobile, facingMode);
  
  const diffConfig = DIFFICULTY_SETTINGS[difficulty as Difficulty];
  const levelList = GAME_LEVELS[difficulty as Difficulty];
  const levelConfig = levelList[levelIndex];

  const { t } = useLanguage();
  
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [stonePos, setStonePos] = useState(new THREE.Vector3());
  const [stoneVel, setStoneVel] = useState(new THREE.Vector3());
  const [message, setMessage] = useState("");
  
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stonesOnGround, setStonesOnGround] = useState(0);
  const [stonesInHand, setStonesInHand] = useState(0);
  
  // Timer & Mechanics
  const [airTimer, setAirTimer] = useState(0);
  const [actionPerformed, setActionPerformed] = useState(false);
  const [combo, setCombo] = useState(0);

  // Setup Level
  useEffect(() => {
    if (gameState === GameState.SETUP || gameState === GameState.LEVEL_COMPLETE) {
      // Initialize Level
      setStonesOnGround(levelConfig.initialGroundStones);
      setStonesInHand(levelConfig.initialHandStones);
      setCurrentStageIndex(0);
      setCombo(0);
      setActionPerformed(false);
      setMessage(t(levelConfig.stages[0].messageKey as any));
      
      // Auto transition to IDLE
      setTimeout(() => setGameState(GameState.IDLE), 1000);
    }
  }, [levelConfig, gameState]);

  const triggerToss = () => {
    if (gameState === GameState.IDLE && stonesInHand > 0) {
        setGameState(GameState.TOSSING);
        // Ibu (母石) 抛起
        setStonesInHand(s => s - 1);
        setStoneVel(new THREE.Vector3(0, -diffConfig.gravity * 0.8, 0)); // 向上抛的初速度 (简单物理模拟)
        setAirTimer(diffConfig.airWindow);
        setActionPerformed(false);
        setMessage("");
    }
  };

  useEffect(() => {
    if (manualTossRef.current) manualTossRef.current.onclick = triggerToss;
  }, [gameState, stonesInHand]);

  useFrame((state, delta) => {
      if (gameState === GameState.GAME_OVER || gameState === GameState.LEVEL_COMPLETE) return;

      // 1. Update Ibu Stone Physics
      if (gameState === GameState.TOSSING || gameState === GameState.ACTION_WINDOW) {
          const newVel = stoneVel.clone();
          newVel.y += diffConfig.gravity * delta; // 施加重力
          const newPos = stonePos.clone().add(newVel.clone().multiplyScalar(delta));
          
          setStoneVel(newVel);
          setStonePos(newPos);

          // 转为 ACTION_WINDOW (当开始下落时)
          if (gameState === GameState.TOSSING && newVel.y < 0) {
              setGameState(GameState.ACTION_WINDOW);
          }
      } else if (gameState === GameState.IDLE) {
          // 手持母石跟随手部
          const holdPos = handPos.current.clone().add(new THREE.Vector3(0, 0.5, 0.2));
          setStonePos(holdPos);
      }

      // 2. Action Window Logic (Pick / Place / Exchange)
      if (gameState === GameState.ACTION_WINDOW) {
          setAirTimer(prev => prev - delta);

          // 超时判定
          if (airTimer <= 0) {
              handleFail("TIMEOUT");
              return;
          }

          const stage = levelConfig.stages[currentStageIndex];
          
          // MVP 拾取逻辑：当手部足够低 (-2.0) 且捏合时触发
          // 实际逻辑应检查碰撞具体的地面石子，这里简化
          if (!actionPerformed && handPos.current.y < -2.0 && isPinching.current) {
              if (stage.action === 'PICK' && stonesOnGround >= stage.count) {
                  setStonesOnGround(s => s - stage.count);
                  setStonesInHand(s => s + stage.count);
                  setActionPerformed(true);
                  // 视觉反馈...
              } else if (stage.action === 'PLACE') {
                  setStonesOnGround(s => s + stage.count);
                  setStonesInHand(s => s - stage.count);
                  setActionPerformed(true);
              } else if (stage.action === 'EXCHANGE') {
                   // 交换逻辑
                   setActionPerformed(true);
              }
          }

          // 接住判定 (Catch)
          // 只有在 Action 完成后，且 母石落回手附近
          if (stonePos.distanceTo(handPos.current) < 1.2 && stoneVel.y < 0) {
              if (actionPerformed) {
                  handleSuccess();
              } else {
                  // 接住了但没做动作 -> 失败
                  handleFail("MISSED_ACTION");
              }
          }
      }

      // 3. 掉落判定
      if (stonePos.y < -6 && gameState !== GameState.DROPPED) {
          handleFail("DROPPED");
      }
  });

  const handleSuccess = () => {
      setGameState(GameState.CAUGHT);
      setStonesInHand(s => s + 1); // 加回母石
      
      // 计分
      let points = 10;
      // 大师模式连击逻辑
      if (diffConfig.comboMultiplier) {
          const multiplier = combo >= 20 ? 3 : (combo >= 10 ? 2 : (combo >= 5 ? 1.5 : 1));
          points = points * multiplier;
          setCombo(c => c + 1);
      }
      onScoreUpdate(points);

      // Check Stage / Level
      if (currentStageIndex + 1 >= levelConfig.stages.length) {
          // 关卡完成
          onScoreUpdate(50); // 关卡通关分
          setTimeout(() => onLevelComplete(), 500);
      } else {
          // 下一个 Cycle
          setCurrentStageIndex(prev => prev + 1);
          setMessage(t('game_good'));
          setTimeout(() => setGameState(GameState.IDLE), 500);
      }
  };

  const handleFail = (reason: string) => {
      setGameState(GameState.DROPPED);
      setMessage(reason === "TIMEOUT" ? "Time Out!" : "Missed!");
      
      onFail(); // 父组件处理

      if (diffConfig.failConsequence === 'RETRY_CYCLE') {
          // 新手：重试当前 Cycle
          // 恢复地面石子状态（简单粗暴处理：恢复到本Stage开始前状态）
          // 这里简化为：直接重置回IDLE，状态回滚需要更多变量记录，这里略过复杂回滚
          setTimeout(() => {
              setGameState(GameState.IDLE);
              setStonesInHand(s => s + 1); // 假装捡回母石
              setActionPerformed(false);
              setMessage("Try Again");
          }, 1500);
      } else if (diffConfig.failConsequence === 'RESTART_LEVEL') {
          // 普通：重来本关
          setTimeout(() => {
              setGameState(GameState.SETUP);
          }, 1500);
      } else {
          // 大师：结束游戏
          setGameState(GameState.GAME_OVER);
      }
  };

  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} />

      <MannequinHand 
        position={handPos.current} 
        stonesInHand={stonesInHand} 
        isGrabbing={isPinching.current} 
        canToss={gameState === GameState.IDLE} 
        isMobile={isMobile} 
        isExchangeLevel={levelConfig.isExchangeLevel}
      />
      
      {(gameState !== GameState.DROPPED) && stonesInHand > 0 && gameState !== GameState.SETUP && (
         <group position={stonePos}>
            <BatuModel color="#ffffff" scale={1.2} />
         </group>
      )}

      <GroundStones count={stonesOnGround} isExchangeLevel={levelConfig.isExchangeLevel} />

      {/* 新手引导线: 只有在动作窗口期，且未完成动作时显示 */}
      {diffConfig.showGuideLines && gameState === GameState.ACTION_WINDOW && !actionPerformed && (
          <GuideLine start={stonePos} end={new THREE.Vector3(0, -2, 0)} />
      )}

      {/* UI Overlay in 3D */}
      <Text position={[0, 3.5, 0]} fontSize={0.4} color="white" outlineWidth={0.02}>{message}</Text>
      
      {gameState === GameState.ACTION_WINDOW && (
          <Text position={[0, 2.5, 0]} fontSize={0.3} color={airTimer < 0.5 ? "red" : "#fbbf24"}>
              {airTimer.toFixed(1)}s
          </Text>
      )}
    </>
  );
};

const Game: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const webcamRef = useRef<Webcam>(null);
  const manualTossRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMemo(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), []);
  
  // Menu State
  const [inMenu, setInMenu] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const { t } = useLanguage();

  const startGame = (diff: Difficulty) => {
      setDifficulty(diff);
      setInMenu(false);
      setLevelIndex(0);
      setScore(0);
      setGameOver(false);
  };

  const handleLevelComplete = () => {
      // Check if next level exists
      const maxLevels = GAME_LEVELS[difficulty].length;
      if (levelIndex + 1 < maxLevels) {
          setLevelIndex(prev => prev + 1);
      } else {
          setGameOver(true); // ��关
      }
  };

  return (
    <div className="h-[100dvh] w-full bg-heritage-black relative overflow-hidden">
      <Webcam
        ref={webcamRef} audio={false} mirrored={true}
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        videoConstraints={isMobile ? MOBILE_CONSTRAINTS : DESKTOP_CONSTRAINTS}
      />
      
      {inMenu ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-heritage-black/90 p-6 space-y-6">
              <h1 className="text-4xl text-heritage-orange font-serif font-bold">SELECT MODE</h1>
              
              <button onClick={() => startGame(Difficulty.NOVICE)} className="w-64 p-4 bg-green-600 rounded-xl text-white font-bold text-xl hover:scale-105 transition">
                  NOVICE (新手)
                  <span className="block text-xs font-normal opacity-80 mt-1">Slow • Retry • Guides</span>
              </button>
              
              <button onClick={() => startGame(Difficulty.NORMAL)} className="w-64 p-4 bg-blue-600 rounded-xl text-white font-bold text-xl hover:scale-105 transition">
                  NORMAL (普通)
                  <span className="block text-xs font-normal opacity-80 mt-1">Standard Rules</span>
              </button>
              
              <button onClick={() => startGame(Difficulty.MASTER)} className="w-64 p-4 bg-red-600 rounded-xl text-white font-bold text-xl hover:scale-105 transition border-2 border-yellow-400">
                  MASTER (大师)
                  <span className="block text-xs font-normal opacity-80 mt-1">Fast • One Life • Ranking</span>
              </button>

              <button onClick={onExit} className="mt-8 text-white underline">Back to Home</button>
          </div>
      ) : (
        <>
            {/* HUD */}
            <div className="absolute top-4 left-4 z-20 text-white">
                <div className="font-bold text-heritage-orange">{difficulty} MODE</div>
                <div className="text-xl">Level: {levelIndex + 1}</div>
                <div className="text-2xl font-mono">Score: {score}</div>
            </div>

            {gameOver && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
                    <h1 className="text-5xl text-heritage-orange mb-4">GAME OVER</h1>
                    <p className="text-2xl text-white mb-8">Final Score: {score}</p>
                    <button onClick={() => setInMenu(true)} className="px-8 py-3 bg-white text-black font-bold rounded-full">Menu</button>
                </div>
            )}

            <Canvas dpr={[1, 1]} camera={{ position: [0, 0, 8], fov: isMobile ? 75 : 50 }}>
                <Suspense fallback={null}>
                    <GameScene 
                        webcamRef={webcamRef} 
                        difficulty={difficulty} 
                        levelIndex={levelIndex}
                        onScoreUpdate={(pts: number) => setScore(s => s + pts)}
                        onFail={() => {}}
                        onLevelComplete={handleLevelComplete}
                        isMobile={isMobile}
                        manualTossRef={manualTossRef}
                        facingMode="user"
                        score={score}
                    />
                </Suspense>
                <Loader />
            </Canvas>

            {/* Controls */}
            <button 
                ref={manualTossRef}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 bg-heritage-orange w-24 h-24 rounded-full border-4 border-white shadow-xl flex items-center justify-center active:scale-95"
            >
                <span className="font-bold text-white text-xl">TOSS</span>
            </button>
            
            <button onClick={() => setInMenu(true)} className="absolute top-4 right-4 z-50 text-white border border-white/50 px-4 py-1 rounded-full text-sm">
                Exit
            </button>
        </>
      )}
    </div>
  );
};

export default Game;
