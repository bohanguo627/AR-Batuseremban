/// <reference types="@react-three/fiber" />
import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import Webcam from 'react-webcam';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Cylinder, Sphere, Float, Text, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { OBJLoader } from 'three-stdlib';
import { useLanguage } from '../context/LanguageContext';
import { DifficultyLevel, DIFFICULTY_CONFIGS, ScoreData } from '../types';
import DifficultySelector from '../components/DifficultySelector';

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

enum GameState { IDLE, HOLDING, TOSSING, FALLING, CAUGHT, DROPPED, LEVEL_COMPLETE, GAME_OVER }
interface StageConfig { action: 'PICK' | 'PLACE' | 'EXCHANGE'; count: number; messageKey: string; }

interface LevelConfig { 
    id: number; 
    name: string; 
    stages: StageConfig[]; 
    gravity: number; 
    catchRadius: number; 
    initialHandStones: number; 
    initialGroundStones: number; 
    isExchangeLevel?: boolean; 
}

const LEVELS: Record<number, LevelConfig> = {
  1: { id: 1, name: "BUAH SATU", stages: [{ action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, { action: 'PICK', count: 1, messageKey: "msg_pick_1" }], gravity: -10, catchRadius: 5.0, initialHandStones: 1, initialGroundStones: 4 },
  2: { id: 2, name: "BUAH DUA", stages: [{ action: 'PICK', count: 2, messageKey: "msg_pick_2" }, { action: 'PICK', count: 2, messageKey: "msg_pick_2" }], gravity: -12, catchRadius: 4.5, initialHandStones: 1, initialGroundStones: 4 },
  
  // Level 3: Pick 1 first, then Pick 3
  3: { 
      id: 3, 
      name: "BUAH TIGA", 
      stages: [
          { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, 
          { action: 'PICK', count: 3, messageKey: "msg_pick_3" }  
      ], 
      gravity: -14, 
      catchRadius: 4.0, 
      initialHandStones: 1, 
      initialGroundStones: 4 
  },

  4: { id: 4, name: "BUAH EMPAT", stages: [{ action: 'PICK', count: 4, messageKey: "msg_pick_4" }], gravity: -15, catchRadius: 3.8, initialHandStones: 1, initialGroundStones: 4 },
  5: { id: 5, name: "BUAH LIMA", stages: [{ action: 'PLACE', count: 4, messageKey: "msg_place_4" }, { action: 'PICK', count: 4, messageKey: "msg_pick_4" }], gravity: -15, catchRadius: 3.8, initialHandStones: 5, initialGroundStones: 0 },
  6: { id: 6, name: "TUKAR", stages: [{ action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }, { action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }, { action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }], gravity: -16, catchRadius: 3.5, initialHandStones: 2, initialGroundStones: 3, isExchangeLevel: true },
  
  // Level 7: Exchange 1 first (Starts with 2 stones), then Pick 3
  7: { 
      id: 7, 
      name: "BUAH TUJUH", 
      stages: [
          { action: 'EXCHANGE', count: 1, messageKey: "msg_exchange" }, 
          { action: 'PICK', count: 3, messageKey: "msg_pick_3" }      
      ], 
      gravity: -18, 
      catchRadius: 3.2, 
      initialHandStones: 2, 
      initialGroundStones: 3, 
      isExchangeLevel: true 
  },

  8: { 
      id: 8, 
      name: "BUAH LAPAN", 
      stages: [
          { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, 
          { action: 'PICK', count: 4, messageKey: "msg_pick_4" }
      ], 
      gravity: -20, 
      catchRadius: 3.0, 
      initialHandStones: 0, 
      initialGroundStones: 5 
  },
};

// Beginner Mode Levels (3 simplified levels)
const BEGINNER_LEVELS: Record<number, LevelConfig> = {
  1: { 
    id: 1, 
    name: "LEARN PICK 1", 
    stages: [
      { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, 
      { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, 
      { action: 'PICK', count: 1, messageKey: "msg_pick_1" }, 
      { action: 'PICK', count: 1, messageKey: "msg_pick_1" }
    ], 
    gravity: -8, 
    catchRadius: 6.0, 
    initialHandStones: 1, 
    initialGroundStones: 4 
  },
  2: { 
    id: 2, 
    name: "LEARN PICK 2", 
    stages: [
      { action: 'PICK', count: 2, messageKey: "msg_pick_2" }, 
      { action: 'PICK', count: 2, messageKey: "msg_pick_2" }
    ], 
    gravity: -9, 
    catchRadius: 5.5, 
    initialHandStones: 1, 
    initialGroundStones: 4 
  },
  3: { 
    id: 3, 
    name: "LEARN PICK 4", 
    stages: [
      { action: 'PICK', count: 4, messageKey: "msg_pick_4" }
    ], 
    gravity: -10, 
    catchRadius: 5.0, 
    initialHandStones: 1, 
    initialGroundStones: 4 
  }
};

// Normal Mode Levels (Buah 1-5 + simplified Buah 6 + Timbang)
const NORMAL_LEVELS: Record<number, LevelConfig> = {
  ...LEVELS, // Use existing levels 1-8
};

// Master Mode Levels (same as Normal but with different parameters)
const MASTER_LEVELS: Record<number, LevelConfig> = {
  ...LEVELS,
};

const getLevelsForDifficulty = (difficulty: DifficultyLevel): Record<number, LevelConfig> => {
  switch (difficulty) {
    case DifficultyLevel.BEGINNER:
      return BEGINNER_LEVELS;
    case DifficultyLevel.NORMAL:
      return NORMAL_LEVELS;
    case DifficultyLevel.MASTER:
      return MASTER_LEVELS;
  }
};

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

const MannequinHand = ({ position, stonesInHand, isGrabbing, canToss, isMobile, isExchangeLevel = false }: 
    { position: THREE.Vector3, stonesInHand: number, isGrabbing: boolean, canToss: boolean, isMobile: boolean, isExchangeLevel?: boolean }) => {
  
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

  const Finger = ({ x, length, rotZ, grabbing }: any) => (
    <group position={[x, 0.6, 0]} rotation={[0, 0, rotZ]}>
        <Sphere args={[0.13, 8, 8]} position={[0, 0, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
        <Cylinder args={[0.12, 0.13, length/2, 8]} position={[0, length/4, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
        <Sphere args={[0.11, 8, 8]} position={[0, length/2, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
        <group position={[0, length/2, 0]} rotation={[grabbing ? 1.5 : 0.1, 0, 0]}>
            <Cylinder args={[0.1, 0.11, length/2, 8]} position={[0, length/4, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
            <Sphere args={[0.1, 8, 8]} position={[0, length/2, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
        </group>
    </group>
  );

  return (
    <group ref={group}>
      <group scale={[1, 1, 0.6]}>
          <Sphere args={[0.6, 16, 16]} position={[0, 0, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
          <Cylinder args={[0.55, 0.5, 0.8, 16]} position={[0, -0.4, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
      </group>
      
      <Finger x={-0.4} length={0.7} rotZ={0.2} grabbing={isGrabbing} />
      <Finger x={-0.15} length={0.9} rotZ={0.05} grabbing={isGrabbing} />
      <Finger x={0.15} length={1.0} rotZ={-0.05} grabbing={isGrabbing} />
      <Finger x={0.4} length={0.9} rotZ={-0.2} grabbing={isGrabbing} />
      
      <group position={[0.5, -0.2, 0.2]} rotation={[0, -0.5, -0.8]}>
        <Cylinder args={[0.13, 0.15, 0.5, 8]} position={[0, 0.25, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
        <Sphere args={[0.13, 8, 8]} position={[0, 0.5, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
        <group position={[0, 0.5, 0]} rotation={[isGrabbing ? 1.0 : 0, 0, 0]}>
            <Cylinder args={[0.11, 0.13, 0.4, 8]} position={[0, 0.2, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
            <Sphere args={[0.11, 8, 8]} position={[0, 0.4, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
        </group>
      </group>

      {/* Stones in Palm - Only render if stonesInHand > 0 */}
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

const BatuSandbag = ({ position, rotation }: { position: THREE.Vector3, rotation: THREE.Euler }) => (
  <group position={position} rotation={rotation}>
    <Float speed={10} rotationIntensity={2} floatIntensity={0}>
      <BatuModel color="#ea580c" scale={0.5} />
      <group scale={[1.1, 1.1, 1.1]}>
         <BatuModel color="#fbbf24" scale={0.55} opacity={0.3} />
      </group>
    </Float>
  </group>
);

// --- Updated Ground Stones Logic ---
const GroundStones = ({ count, isExchangeLevel = false, pinkCount = 0 }: { count: number, isExchangeLevel?: boolean, pinkCount?: number }) => (
    <group position={[0, -3.5, -1]}>
      {Array.from({ length: count }).map((_, i) => {
        const isPink = isExchangeLevel && i < pinkCount;
        const color = isPink ? "#ec4899" : "#52525b";
        
        // FIX: Wider Spacing (1.3) to prevent overlap and look clearer
        const spacing = 1.3;
        const xPos = (i - (count - 1) / 2) * spacing;

        return (
            <group key={i} position={[xPos, 0, 0]} rotation={[i*2, i*3, i*0.5]}>
               <BatuModel color={color} scale={0.4} />
            </group>
        );
      })}
    </group>
);

const GameScene = ({ 
  webcamRef, 
  level, 
  difficulty = DifficultyLevel.NORMAL,
  levels,
  scoreData,
  onProgress, 
  onLevelComplete, 
  onFail, 
  isMobile, 
  manualTossRef, 
  facingMode,
  onScoreUpdate
}: any) => {
  const { handPos, isPinching } = useMediaPipeInput(webcamRef, isMobile, facingMode);
  const config = levels[level as number];
  const difficultyConfig = DIFFICULTY_CONFIGS[difficulty];
  
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
  
  // Scoring state
  const [cycleStartTime, setCycleStartTime] = useState(0);
  const [isPerfectCycle, setIsPerfectCycle] = useState(true);
  const [comboCount, setComboCount] = useState(0);
  const [showSlowMotion, setShowSlowMotion] = useState(false);

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
    onProgress({ stage: 0, totalStages: config.stages.length });
  }, [level, config, t]);

  const currentStage = config.stages[currentStageIndex];

  const triggerToss = () => {
    if ((gameState === GameState.IDLE || gameState === GameState.HOLDING || gameState === GameState.CAUGHT) && stonesInHand > 0) {
        setStonesInHand(s => s - 1);
        setGameState(GameState.TOSSING);
        
        // Adjust toss velocity based on difficulty toss height
        const tossVelocity = difficultyConfig.tossHeight === 'low' ? 8 : 
                            difficultyConfig.tossHeight === 'medium' ? 10 : 12;
        setStoneVel(new THREE.Vector3(0, tossVelocity, 0)); 
        setActionPerformed(false);
        setMessage(""); 
        setCanToss(false);
        setCycleStartTime(Date.now());
        setIsPerfectCycle(true);
    }
  };

  useEffect(() => {
    if (manualTossRef.current) manualTossRef.current.onclick = triggerToss;
  }, [gameState, stonesInHand]);

  useFrame((_, delta) => {
    if (gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER) return;

    if (!canToss && handPos.current.y < RELOAD_THRESHOLD_Y && gameState === GameState.IDLE) setCanToss(true);
    
    // --- SPECIAL LOGIC FOR BUAH LAPAN (LEVEL 8) ---
    if (level === 8 && currentStageIndex === 0 && stonesInHand === 0 && gameState === GameState.IDLE) {
        // Must pick up the mother stone first without tossing
        if (handPos.current.y < PICKUP_THRESHOLD_Y) {
            setStonesInHand(1);
            setStonesOnGround(s => s - 1);
            
            // Advance to next stage immediately
            setCurrentStageIndex(1);
            setMessage(t(config.stages[1].messageKey as any));
            setActionPerformed(false);
            
            setCanToss(false); // Prevents instant accidental toss
        }
        return; // Skip normal tossing logic for this frame
    }

    if (canToss && handPos.current.y > TOSS_THRESHOLD_Y && stonesInHand > 0 && gameState === GameState.IDLE) triggerToss();

    if ((gameState === GameState.TOSSING || gameState === GameState.FALLING) && handPos.current.y < PICKUP_THRESHOLD_Y && !actionPerformed) {
      if (currentStage.action === 'PICK' && stonesOnGround >= currentStage.count) {
        setStonesOnGround(s => s - currentStage.count);
        setStonesInHand(s => s + currentStage.count);
        setActionPerformed(true);
      } else if (currentStage.action === 'PLACE' && stonesInHand >= currentStage.count) {
        setStonesOnGround(s => s + currentStage.count);
        setStonesInHand(s => s - currentStage.count);
        setActionPerformed(true);
      } else if (currentStage.action === 'EXCHANGE') {
        setActionPerformed(true);
      }
    }

    switch (gameState) {
      case GameState.IDLE: case GameState.HOLDING: case GameState.CAUGHT:
        const holdPos = handPos.current.clone().add(new THREE.Vector3(0, 0.6, 0.2));
        setStonePos(holdPos);
        if (gameState === GameState.CAUGHT) setTimeout(() => setGameState(GameState.IDLE), 200); 
        break;

      case GameState.TOSSING: case GameState.FALLING:
        let newVel = stoneVel.clone();
        // Adjust gravity based on difficulty (slower fall for beginner)
        const gravityMultiplier = difficulty === DifficultyLevel.BEGINNER ? 0.7 : 
                                 difficulty === DifficultyLevel.NORMAL ? 1.0 : 1.3;
        newVel.y += config.gravity * delta * gravityMultiplier;
        let newPos = stonePos.clone().add(newVel.clone().multiplyScalar(delta));

        if (newPos.x > 5) { newPos.x = 5; newVel.x *= -0.6; }
        else if (newPos.x < -5) { newPos.x = -5; newVel.x *= -0.6; }
        if (newPos.y > 5) { newPos.y = 5; newVel.y *= -0.3; }
        
        setStoneVel(newVel);
        setStonePos(newPos);
        setStoneRot(new THREE.Euler(stoneRot.x + delta * 5, stoneRot.y + delta * 3, 0));

        if (newVel.y < 0) setGameState(GameState.FALLING);

        // Adjust catch radius based on difficulty
        const adjustedCatchRadius = config.catchRadius * (difficulty === DifficultyLevel.BEGINNER ? 1.2 : 
                                                          difficulty === DifficultyLevel.NORMAL ? 1.0 : 0.85);

        if (gameState === GameState.FALLING && newPos.distanceTo(handPos.current) < adjustedCatchRadius) {
           if (currentStage && !actionPerformed) {
              // Failed to perform action
              setMessage(t('game_missed'));
              setIsPerfectCycle(false);
              
              // Handle based on difficulty
              if (difficultyConfig.allowRetry) {
                // Beginner: retry with slow motion
                setShowSlowMotion(true);
                setTimeout(() => {
                  setShowSlowMotion(false);
                  // Reset cycle but don't end game
                  setStonesInHand(s => s + 1);
                  setGameState(GameState.CAUGHT);
                  setActionPerformed(false);
                  setMessage(t('game_retry'));
                }, 1000);
              } else {
                // Normal/Master: handle failure
                onFail();
                if (onScoreUpdate) {
                  onScoreUpdate({ failures: scoreData.failures + 1 });
                }
              }
           } else {
              // Successfully performed action
              setStonesInHand(s => s + 1);
              
              // Calculate score for this cycle
              const cycleTime = (Date.now() - cycleStartTime) / 1000;
              const isPerfect = isPerfectCycle && cycleTime <= difficultyConfig.airWindow * 0.8;
              
              if (difficultyConfig.enableCombo && isPerfect) {
                const newCombo = comboCount + 1;
                setComboCount(newCombo);
                if (onScoreUpdate) {
                  onScoreUpdate({ 
                    maxCombo: Math.max(newCombo, scoreData.maxCombo),
                    perfectCycles: scoreData.perfectCycles + 1
                  });
                }
              }
              
              const nextStageIndex = currentStageIndex + 1;
              if (nextStageIndex >= config.stages.length) {
                setGameState(GameState.LEVEL_COMPLETE);
                setMessage(t('game_level_complete'));
                
                // Add level completion bonus
                if (onScoreUpdate) {
                  const baseScore = 50;
                  const perfectBonus = isPerfect ? 10 : 0;
                  const comboMultiplier = Math.floor(comboCount / 5) * 0.5 + 1;
                  onScoreUpdate({
                    baseScore: scoreData.baseScore + baseScore,
                    perfectBonus: scoreData.perfectBonus + perfectBonus,
                    comboMultiplier: comboMultiplier,
                    totalScore: scoreData.totalScore + (baseScore + perfectBonus) * comboMultiplier
                  });
                }
                
                onLevelComplete();
              } else {
                setGameState(GameState.CAUGHT);
                setCurrentStageIndex(nextStageIndex);
                setMessage(t(config.stages[nextStageIndex].messageKey as any));
                setActionPerformed(false); 
                onProgress({ stage: nextStageIndex, totalStages: config.stages.length });
              }
           }
        }
        if (newPos.y < -6) {
          setGameState(GameState.DROPPED);
          setMessage(t('game_dropped'));
          
          if (difficultyConfig.allowRetry) {
            // Beginner: retry without penalty
            setTimeout(() => {
              const stage = config.stages[currentStageIndex];
              setStonesOnGround(config.initialGroundStones);
              setStonesInHand(config.initialHandStones);
              setGameState(GameState.IDLE);
              setMessage(t('game_retry'));
              setActionPerformed(false);
              setCanToss(true);
            }, 1500);
          } else {
            onFail();
            setTimeout(() => {
              const stage = config.stages[0];
              setCurrentStageIndex(0);
              setStonesOnGround(config.initialGroundStones);
              setStonesInHand(config.initialHandStones);
              setGameState(GameState.IDLE);
              setMessage(t(stage.messageKey as any));
              setActionPerformed(false);
              setCanToss(true);
              onProgress({ stage: 0, totalStages: config.stages.length });
            }, 1500);
          }
        }
        break;
    }
  });

  const textY = isMobile ? 0.0 : 3.5;

  const pinkCountDisplay = gameState === GameState.LEVEL_COMPLETE 
      ? config.stages.length 
      : currentStageIndex;
      
  return (
    <>
      <ambientLight intensity={2.0} />
      <pointLight position={[10, 10, 10]} color="#fbbf24" intensity={1.5} />
      <directionalLight position={[0, 5, 5]} intensity={1} />

      <MannequinHand 
        position={handPos.current} 
        stonesInHand={stonesInHand-1} 
        isGrabbing={isPinching.current} 
        canToss={canToss} 
        isMobile={isMobile} 
        isExchangeLevel={config.isExchangeLevel} 
      />
      
      {/* FIX: Floating stone ONLY appears if stonesInHand > 0 */}
      {gameState !== GameState.DROPPED && stonesInHand > 0 && <BatuSandbag position={stonePos} rotation={stoneRot} />}
      
      <GroundStones 
        count={stonesOnGround} 
        isExchangeLevel={config.isExchangeLevel} 
        pinkCount={currentStageIndex} 
      />

      <mesh position={[0, -3.5, 0]}>
        <planeGeometry args={[12, 3]} />
        <meshBasicMaterial color={actionPerformed ? "#22c55e" : "#ea580c"} transparent opacity={0.15} />
      </mesh>
      
      <Text position={[0, -2.5, 0]} fontSize={isMobile ? 0.35 : 0.3} color="white" fillOpacity={canToss ? 0.3 : 1}>
          {canToss ? t('game_ready') : t('game_reload')}
      </Text>
      <Text position={[0, 2.0, 0]} fontSize={isMobile ? 0.35 : 0.3} color="white" fillOpacity={canToss ? 1 : 0.3}>
          {canToss ? t('game_toss_action') : t('game_wait')}
      </Text>
      <Text position={[0, textY, 0]} fontSize={isMobile ? 0.5 : 0.5} color="white" anchorX="center" anchorY="middle">{message}</Text>
      
      {/* Combo Counter for Master Mode */}
      {difficultyConfig.enableCombo && comboCount > 0 && (
        <Text position={[3, 2.5, 0]} fontSize={0.4} color="#fbbf24" anchorX="center" anchorY="middle">
          {t('game_combo')}: x{comboCount}
        </Text>
      )}
      
      {/* Slow Motion Indicator for Beginner Mode */}
      {showSlowMotion && (
        <Text position={[0, 3.5, 0]} fontSize={0.3} color="#86efac" anchorX="center" anchorY="middle">
          {t('game_slow_motion')}
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
  
  // Difficulty selection state
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null);
  const [levels, setLevels] = useState<Record<number, LevelConfig>>(NORMAL_LEVELS);
  const [maxLevel, setMaxLevel] = useState(8);
  
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState({ stage: 0, totalStages: 1 });
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMsg, setOverlayMsg] = useState("");
  const [showChampionMenu, setShowChampionMenu] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  
  // Scoring state
  const [scoreData, setScoreData] = useState<ScoreData>({
    baseScore: 0,
    perfectBonus: 0,
    comboMultiplier: 1,
    totalScore: 0,
    failures: 0,
    perfectCycles: 0,
    maxCombo: 0
  });

  const currentConfig = levels[level];
  const progressPercent = ((progress.stage) / progress.totalStages) * 100;
  
  const { t, lang } = useLanguage();
  
  const handleDifficultySelect = (selectedDifficulty: DifficultyLevel) => {
    setDifficulty(selectedDifficulty);
    const selectedLevels = getLevelsForDifficulty(selectedDifficulty);
    setLevels(selectedLevels);
    setMaxLevel(Object.keys(selectedLevels).length);
    setLevel(1);
    setScoreData({
      baseScore: 0,
      perfectBonus: 0,
      comboMultiplier: 1,
      totalScore: 0,
      failures: 0,
      perfectCycles: 0,
      maxCombo: 0
    });
  };
  
  const handleScoreUpdate = (update: Partial<ScoreData>) => {
    setScoreData(prev => ({ ...prev, ...update }));
  };

  const handleLevelComplete = () => {
    const msg = lang === 'en' 
        ? `LEVEL ${level} PASSED!` 
        : `TAHAP ${level} LULUS!`;
    
    setOverlayMsg(msg);
    setShowOverlay(true);
    
    setTimeout(() => {
       if (level < maxLevel) {
           setLevel(l => l + 1);
           setShowOverlay(false);
       }
       else { 
           setOverlayMsg(t('game_champion')); 
           setShowChampionMenu(true); 
       }
    }, 2500);
  };

  const handlePlayAgain = () => {
      setLevel(1);
      setShowChampionMenu(false);
      setShowOverlay(false);
      setScoreData({
        baseScore: 0,
        perfectBonus: 0,
        comboMultiplier: 1,
        totalScore: 0,
        failures: 0,
        perfectCycles: 0,
        maxCombo: 0
      });
  };
  
  const handleBackToDifficulty = () => {
    setDifficulty(null);
    setLevel(1);
    setShowOverlay(false);
    setShowChampionMenu(false);
  };

  const videoConstraints = isMobile ? MOBILE_CONSTRAINTS : DESKTOP_CONSTRAINTS;
  
  // Show difficulty selector if no difficulty selected
  if (!difficulty) {
    return <DifficultySelector onSelect={handleDifficultySelect} onBack={onExit} />;
  }

  return (
    <div className="h-[100dvh] w-full bg-heritage-black relative overflow-hidden">
      <Webcam
        key={facingMode} 
        ref={webcamRef} audio={false} mirrored={facingMode === 'user'}
        playsInline={true} muted={true}
        className={`absolute inset-0 w-full h-full opacity-30 pointer-events-none ${fitMode === 'cover' ? 'object-cover' : 'object-contain bg-black'}`}
        videoConstraints={videoConstraints}
      />
      
      <div className="absolute inset-0 z-10">
        <Canvas dpr={[1, 1]} camera={{ position: [0, 0, 8], fov: isMobile ? 75 : 50 }}>
          <Suspense fallback={null}>
             <GameScene 
                webcamRef={webcamRef} 
                level={level}
                difficulty={difficulty}
                levels={levels}
                scoreData={scoreData}
                onProgress={setProgress} 
                onLevelComplete={handleLevelComplete} 
                onFail={() => {}} 
                isMobile={isMobile}
                manualTossRef={manualTossRef}
                facingMode={facingMode}
                onScoreUpdate={handleScoreUpdate}
             />
          </Suspense>
        </Canvas>
        <Loader />
      </div>

      <button 
        ref={manualTossRef}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-heritage-orange/90 active:bg-heritage-orange text-white w-20 h-20 rounded-full border-4 border-white/20 shadow-xl flex items-center justify-center font-bold tracking-widest animate-pulse text-xs"
      >
        {t('game_toss_btn')}
      </button>

      <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 w-[90%] md:top-6 md:left-6 md:transform-none md:w-64 z-20 pointer-events-none`}>
        <div className="bg-heritage-black/80 border border-heritage-orange/50 p-3 rounded-lg backdrop-blur-md shadow-lg text-center md:text-left flex flex-col items-center md:items-start">
          <h3 className="text-heritage-orange font-serif text-lg font-bold">
              {t('game_level_prefix')} {currentConfig.id}: {currentConfig.name}
          </h3>
          <p className="text-heritage-gray text-[10px] uppercase tracking-widest mb-1 h-4">
              {t(currentConfig.stages[progress.stage]?.messageKey as any)}
          </p>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-1">
              <div className="bg-heritage-orange h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <button 
        onClick={handleBackToDifficulty} 
        className="fixed top-6 right-6 z-50 bg-transparent border-2 border-white/50 text-white px-6 py-2 rounded-full hover:bg-white/10 hover:border-white transition-all text-xs font-bold tracking-widest shadow-lg flex items-center gap-2"
      >
        {t('game_exit_game')}
      </button>
      
      {/* Score Display - Master Mode */}
      {difficulty === DifficultyLevel.MASTER && (
        <div className="fixed top-24 right-6 z-50 bg-heritage-black/80 border border-heritage-orange/50 p-3 rounded-lg backdrop-blur-md shadow-lg">
          <div className="text-heritage-orange text-xs font-bold mb-1">{t('score_total')}</div>
          <div className="text-white text-2xl font-bold">{scoreData.totalScore}</div>
          {scoreData.maxCombo > 0 && (
            <div className="text-yellow-400 text-xs mt-1">
              {t('game_combo')}: x{scoreData.maxCombo}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-50">
        <button onClick={() => setFitMode(prev => prev === 'cover' ? 'contain' : 'cover')} className="bg-black/60 text-white w-12 h-12 rounded-full border border-white/20 hover:bg-heritage-orange transition-colors flex items-center justify-center">
            {fitMode === 'cover' ? <span className="text-[10px] font-bold">UNZOOM</span> : <span className="text-[10px] font-bold">FILL</span>}
        </button>
      </div>
      
      <div className="absolute bottom-6 right-6 z-50">
        <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="bg-black/60 text-white w-12 h-12 rounded-full border border-white/20 hover:bg-heritage-orange transition-colors flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {showOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-heritage-black/90 backdrop-blur-sm px-6">
          <div className="text-center animate-bounce mb-8 w-full">
            <h1 className="text-3xl md:text-5xl font-serif text-heritage-orange mb-4 drop-shadow-[0_0_15px_rgba(234,88,12,0.8)] break-words w-full">{overlayMsg}</h1>
          </div>
          
          {showChampionMenu && (
              <div className="flex flex-col gap-4 animate-fade-in-up pointer-events-auto">
                  <button 
                    onClick={handlePlayAgain}
                    className="bg-heritage-orange text-white px-8 py-4 font-bold text-xl rounded-full hover:scale-105 transition-transform"
                  >
                    {t('game_play_again')}
                  </button>
                  <button 
                    onClick={onExit} 
                    className="bg-white/10 text-white px-8 py-4 font-bold text-xl rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    {t('game_exit')}
                  </button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;