/// <reference types="@react-three/fiber" />
import React, { useState, useRef, useMemo, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { useLanguage } from '../context/LanguageContext';

// --- Configuration ---
// Removed Pink/Magenta shades to avoid confusion with the Exchange Stone (#ec4899)
const GROUND_STONE_COLORS = [
    "#ea580c", // Orange (Default)
    "#06b6d4", // Cyan
    "#facc15", // Yellow
    "#ef4444", // Red
    "#22c55e", // Green
    "#3b82f6"  // Blue
];

const MOTHER_STONE_COLOR = "#ffffff"; // White (Mom)
const NEUTRAL_STONE_COLOR = "#52525b"; // Dark Grey (Inactive)
const PASSENGER_STONE_COLOR = "#ec4899"; // Pink (Swapped/Passenger)

const VIDEO_CONSTRAINTS = {
  facingMode: "environment",
  width: { ideal: 720 },
  height: { ideal: 1280 }
};

// --- Assets ---
const BatuShape = ({ color, scale = 1, rotation = [0,0,0] }: any) => {
  const obj = useLoader(OBJLoader, '/models/white_mesh.obj') as THREE.Group;
  const clone = useMemo(() => {
    const c = obj.clone();
    c.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: color, roughness: 0.5, metalness: 0.1, emissive: color, emissiveIntensity: 0.2 
        });
      }
    });
    return c;
  }, [obj, color]);
  return <primitive object={clone} scale={[scale, scale, scale]} rotation={rotation} />;
};

const CameraRig = ({ zoomLevel }: { zoomLevel: number }) => {
    const { camera } = useThree();
    useFrame(() => {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, zoomLevel, 0.1);
    });
    return null;
};

// --- HAND COMPONENT ---
const RealisticHand = ({ handRef, isGrabbing, heldCount = 0, heldColor = NEUTRAL_STONE_COLOR, isHoldingMom = true }: any) => {
    const skinColor = isGrabbing ? "#86efac" : "#eecfad"; 

    const HeldStones = () => {
        if (heldCount <= 0) return null;
        
        // Determine the color of the "Base" stone (the one usually at the bottom/center)
        const baseStoneColor = isHoldingMom ? MOTHER_STONE_COLOR : heldColor;

        return (
            <group>
                {/* 1. Base Stone (Slot 1) */}
                <group position={[0.1, 0.3, 0.25]} scale={0.8}>
                    <BatuShape color={baseStoneColor} scale={0.2} />
                </group>

                {/* 2. Additional Stones (Stacked) */}
                {heldCount >= 2 && (
                     <group position={[-0.2, 0.4, 0.3]} scale={0.6}>
                        <BatuShape color={isHoldingMom && heldCount === 2 && heldColor !== NEUTRAL_STONE_COLOR ? heldColor : NEUTRAL_STONE_COLOR} scale={0.2} />
                    </group>
                )}
                {heldCount >= 3 && (
                     <group position={[0, 0.4, 0.3]} scale={0.6}>
                        <BatuShape color={NEUTRAL_STONE_COLOR} scale={0.2} />
                    </group>
                )}
                {heldCount >= 4 && (
                     <group position={[0.2, 0.4, 0.3]} scale={0.6}>
                        <BatuShape color={NEUTRAL_STONE_COLOR} scale={0.2} />
                    </group>
                )}
                {heldCount >= 5 && (
                     <group position={[0, 0.5, 0.4]} scale={0.6}>
                          <BatuShape color={NEUTRAL_STONE_COLOR} scale={0.2} />
                    </group>
                )}
            </group>
        );
    }

    const Finger = ({ x, length, rotZ, grabbing }: any) => (
        <group position={[x, 0.6, 0]} rotation={[0, 0, rotZ]}>
            <Sphere args={[0.13]} position={[0, 0, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
            <Cylinder args={[0.12, 0.13, length/2]} position={[0, length/4, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
            <Sphere args={[0.11]} position={[0, length/2, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
            <group position={[0, length/2, 0]} rotation={[grabbing ? 1.5 : 0.1, 0, 0]}>
                <Cylinder args={[0.1, 0.11, length/2]} position={[0, length/4, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
                <Sphere args={[0.1]} position={[0, length/2, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
            </group>
        </group>
    );

    return (
        <group ref={handRef} scale={[1.3, 1.3, 1.3]}>
            <group scale={[1, 1, 0.6]}>
                <Sphere args={[0.6]} position={[0, 0, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
                <Cylinder args={[0.55, 0.5, 0.8]} position={[0, -0.4, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
            </group>
            <Finger x={-0.4} length={0.7} rotZ={0.2} grabbing={isGrabbing} />
            <Finger x={-0.15} length={0.9} rotZ={0.05} grabbing={isGrabbing} />
            <Finger x={0.15} length={1.0} rotZ={-0.05} grabbing={isGrabbing} />
            <Finger x={0.4} length={0.9} rotZ={-0.2} grabbing={isGrabbing} />
            <HeldStones />
            <group position={[0.5, -0.2, 0.2]} rotation={[0, -0.5, -0.8]}>
                <Cylinder args={[0.13, 0.15, 0.5]} position={[0, 0.25, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
                <Sphere args={[0.13]} position={[0, 0.5, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
                <group position={[0, 0.5, 0]} rotation={[isGrabbing ? 1.0 : 0, 0, 0]}>
                    <Cylinder args={[0.11, 0.13, 0.4]} position={[0, 0.2, 0]}><meshStandardMaterial color={skinColor} /></Cylinder>
                    <Sphere args={[0.11, 8, 8]} position={[0, 0.4, 0]}><meshStandardMaterial color={skinColor} /></Sphere>
                </group>
            </group>
        </group>
    );
};

const GroundStone = ({ position, visible, color }: { position: [number, number, number], visible: boolean, color: string }) => {
    return (
        <group position={position} scale={visible ? 1 : 0}>
            <BatuShape color={color} scale={0.25} rotation={[Math.random(), Math.random(), 0]} />
        </group>
    );
};

// --- MAIN SCENE ---
// UPDATED: Accepts targetColor prop
const DemoScene = ({ levelId, targetColor, LevelInfo, t }: { levelId: number, targetColor: string, LevelInfo: any[], t: any }) => {
  const handGroup = useRef<THREE.Group>(null);
  const stoneRef = useRef<THREE.Group>(null);
  const [phaseText, setPhaseText] = useState("");
  
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [handHeldCount, setHandHeldCount] = useState(0);
  const [handHeldColor, setHandHeldColor] = useState(NEUTRAL_STONE_COLOR);
  const [handHoldingMom, setHandHoldingMom] = useState(true); 
  
  const [hiddenGroundIndices, setHiddenGroundIndices] = useState<number[]>([]);
  const [swappedGroundIndices, setSwappedGroundIndices] = useState<number[]>([]);
  const [activeTargetIndices, setActiveTargetIndices] = useState<number[]>([]); 

  const currentLevel = LevelInfo.find((l: any) => l.id === levelId) || LevelInfo[0];
  
  // Reset Timer logic
  const [startTime, setStartTime] = useState(0);
  const { clock } = useThree();
  useEffect(() => {
      setStartTime(clock.getElapsedTime());
  }, [levelId, clock]);

  // Generate Positions (5 Positions Available: Indices 0,1,2,3,4)
  const groundStonePositions = useMemo(() => {
      const pos: [number, number, number][] = [];
      for(let i=0; i < 5; i++) {
          pos.push([(i - 2) * 0.5, -1.5, 0.5]); 
      }
      return pos;
  }, []);

  // --- COLOR LOGIC ---
  const getStoneColor = (index: number) => {
      if (swappedGroundIndices.includes(index)) return PASSENGER_STONE_COLOR; // Pink (Fixed)
      if (activeTargetIndices.includes(index)) return targetColor; // User selected color
      return NEUTRAL_STONE_COLOR; // Grey
  };

  useFrame(() => {
    const now = clock.getElapsedTime();
    const levelTime = now - startTime;

    // --- TIMING CONFIG ---
    let loopDuration = 4.0;
    if (levelId === 1) loopDuration = 16.0; 
    if (levelId === 2) loopDuration = 8.0; 
    if (levelId === 3) loopDuration = 8.0; 
    if (levelId === 5) loopDuration = 8.0; 
    if (levelId === 6) loopDuration = 12.0; 
    if (levelId === 7) loopDuration = 8.0; 
    if (levelId === 8) loopDuration = 5.0;

    const tVal = levelTime % loopDuration; 
    const currentCycleIndex = Math.floor(tVal / 4.0);
    const localTime = tVal % 4.0;

    if (handGroup.current && stoneRef.current) {
      let handY = 0;
      let handRot = -0.5; // Default Up
      let stoneY = 0;
      let stoneZ = 0.2;
      let motherVisible = true;
      let sparkles = false;
      let isMomInHand = true; 
      
      let curHandCount = handHeldCount;
      let curHandColor = handHeldColor;
      
      let calculatedHidden = [...hiddenGroundIndices]; 
      let calculatedSwapped = [...swappedGroundIndices];
      let calculatedTargets: number[] = [];

      // ================= LEVEL 1 (BUAH SATU) =================
      if (levelId === 1) {
          const targetIndex = currentCycleIndex; 
          calculatedTargets = [targetIndex]; 
          let previouslyHidden: number[] = [];
          for(let i=0; i < currentCycleIndex; i++) previouslyHidden.push(i);

          if (localTime < 1.0) { 
              setPhaseText(t('act_ready')); setIsGrabbing(true); handY = -0.2; stoneY = 0.8;
              curHandCount = 1; isMomInHand = true; motherVisible = false; 
              calculatedHidden = [...previouslyHidden, 4]; 
          } else if (localTime < 1.4) { 
              setPhaseText(t('act_toss')); setIsGrabbing(false);
              handY = ((localTime - 1.0) / 0.4) * 1.5; stoneY = handY + 0.8;
              curHandCount = 0; isMomInHand = false; motherVisible = true; calculatedHidden = [...previouslyHidden, 4];
          } else if (localTime < 2.8) { 
              const airTime = localTime - 1.4;
              stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8;
              motherVisible = true; calculatedHidden = [...previouslyHidden, 4];
              isMomInHand = false;

              if (airTime < 0.5) { 
                  setPhaseText(t('act_pick'));
                  handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); setIsGrabbing(false);
              } else if (airTime < 0.9) { 
                  handY = -1.5; handRot = 1.0; setIsGrabbing(true);
                  calculatedHidden = [...previouslyHidden, targetIndex, 4]; 
                  curHandCount = 1; curHandColor = targetColor;
              } else { 
                  setPhaseText(t('act_catch'));
                  const returnTime = airTime - 0.9;
                  handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3);
                  setIsGrabbing(false); calculatedHidden = [...previouslyHidden, targetIndex, 4]; 
                  curHandCount = 1; curHandColor = targetColor;
              }
          } else { 
              setPhaseText(t('act_got_it')); setIsGrabbing(true); handY = 0; handRot = -0.5; stoneY = 0.8;
              calculatedHidden = [...previouslyHidden, targetIndex, 4]; 
              curHandCount = 2; // Mom + Target
              isMomInHand = true; motherVisible = false;
          }
      }

      // ================= LEVEL 2 (BUAH DUA) =================
      else if (levelId === 2) {
          let targetIndices: number[] = [];
          let previouslyHidden: number[] = [];
          if (currentCycleIndex === 0) { targetIndices = [0, 1]; }
          else { targetIndices = [2, 3]; previouslyHidden = [0, 1]; }
          calculatedTargets = targetIndices;

          if (localTime < 1.0) { 
              setPhaseText(t('act_ready')); setIsGrabbing(true); handY = -0.2; stoneY = 0.8;
              curHandCount = 1; isMomInHand = true; motherVisible = false; calculatedHidden = [...previouslyHidden, 4];
          } else if (localTime < 1.4) { 
              setPhaseText(t('act_toss')); setIsGrabbing(false);
              handY = ((localTime - 1.0) / 0.4) * 1.5; stoneY = handY + 0.8;
              curHandCount = 0; isMomInHand = false; motherVisible = true; calculatedHidden = [...previouslyHidden, 4];
          } else if (localTime < 2.8) {
              const airTime = localTime - 1.4; stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8;
              motherVisible = true; calculatedHidden = [...previouslyHidden, 4]; isMomInHand = false;
              if (airTime < 0.5) { 
                  setPhaseText(t('act_pick')); handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); setIsGrabbing(false);
              } else if (airTime < 0.9) { 
                  handY = -1.5; handRot = 1.0; setIsGrabbing(true);
                  calculatedHidden = [...previouslyHidden, ...targetIndices, 4];
                  curHandCount = targetIndices.length; curHandColor = targetColor;
              } else { 
                  setPhaseText(t('act_catch')); const returnTime = airTime - 0.9;
                  handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3);
                  setIsGrabbing(false); calculatedHidden = [...previouslyHidden, ...targetIndices, 4];
                  curHandCount = targetIndices.length; curHandColor = targetColor;
              }
          } else {
              setPhaseText(t('act_got_it')); setIsGrabbing(true); handY = 0; handRot = -0.5; stoneY = 0.8;
              calculatedHidden = [...previouslyHidden, ...targetIndices, 4];
              curHandCount = 1 + targetIndices.length; isMomInHand = true; motherVisible = false;
          }
      }

      // ================= LEVEL 3 (BUAH TIGA) =================
      else if (levelId === 3) {
          if (tVal < 4.0) { // Cycle 1: Pick 1
              calculatedTargets = [0];
              const st = tVal;
              if (st < 1.0) { 
                  setPhaseText(t('act_ready')); setIsGrabbing(true); handY = -0.2; stoneY = 0.8;
                  curHandCount = 1; isMomInHand = true; motherVisible = false; calculatedHidden = [4]; 
              } else if (st < 1.4) { 
                  setPhaseText(t('act_toss')); setIsGrabbing(false);
                  handY = ((st - 1.0) / 0.4) * 1.5; stoneY = handY + 0.8;
                  curHandCount = 0; isMomInHand = false; motherVisible = true;
              } else if (st < 2.8) { 
                  const airTime = st - 1.4; stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8; motherVisible = true; isMomInHand = false;
                  if (airTime < 0.9) {
                        if (airTime > 0.5) { // Pick
                           handY = -1.5; handRot = 1.0; setIsGrabbing(true);
                           calculatedHidden = [0, 4]; curHandCount = 1; curHandColor = targetColor;
                        } else { // Dive
                           handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); setIsGrabbing(false); calculatedHidden = [4];
                        }
                  } else { // Rise
                        setPhaseText(t('act_catch'));
                        const returnTime = airTime - 0.9; handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3);
                        setIsGrabbing(false); calculatedHidden = [0, 4]; curHandCount = 1; curHandColor = targetColor;
                  }
              } else { 
                  setPhaseText(t('act_got_it')); setIsGrabbing(true); handY = 0; handRot = -0.5; stoneY = 0.8;
                  calculatedHidden = [0, 4]; curHandCount = 2; isMomInHand = true; motherVisible = false;
              }
          } else { // Cycle 2: Pick 3
              calculatedTargets = [1, 2, 3];
              const st = tVal - 4.0;
              if (st < 1.0) { 
                  setPhaseText(t('act_ready')); setIsGrabbing(true); handY = -0.2; stoneY = 0.8;
                  curHandCount = 2; isMomInHand = true; motherVisible = false; calculatedHidden = [0, 4];
              } else if (st < 1.4) {
                  setPhaseText(t('act_toss')); setIsGrabbing(false);
                  handY = ((st - 1.0) / 0.4) * 1.5; stoneY = handY + 0.8;
                  curHandCount = 1; isMomInHand = false; motherVisible = true; calculatedHidden = [0, 4];
              } else if (st < 2.8) {
                  const airTime = st - 1.4; stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8; motherVisible = true; calculatedHidden = [0, 4]; isMomInHand = false;
                  if (airTime < 0.9) {
                        if (airTime > 0.5) { // Pick 3
                           handY = -1.5; handRot = 1.0; setIsGrabbing(true);
                           calculatedHidden = [0, 1, 2, 3, 4]; curHandCount = 4; // 1 already in hand + 3
                           curHandColor = targetColor; 
                        } else {
                           handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); setIsGrabbing(false);
                        }
                  } else {
                        setPhaseText(t('act_catch'));
                        const returnTime = airTime - 0.9;
                        handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3);
                        setIsGrabbing(false); calculatedHidden = [0, 1, 2, 3, 4]; curHandCount = 4; curHandColor = targetColor;
                  }
              } else {
                  setPhaseText(t('act_got_it')); setIsGrabbing(true); sparkles = true; handY = 0; handRot = -0.5; stoneY = 0.8;
                  calculatedHidden = [0, 1, 2, 3, 4]; curHandCount = 5; isMomInHand = true; motherVisible = false;
              }
          }
      }

      // ================= LEVEL 4 (BUAH EMPAT) =================
      else if (levelId === 4) {
          calculatedTargets = [0, 1, 2, 3];
          if (localTime < 1.0) { 
              setPhaseText(t('act_ready')); setIsGrabbing(true); handY = -0.2; stoneY = 0.8;
              curHandCount = 1; isMomInHand = true; motherVisible = false; calculatedHidden = [4];
          } else if (localTime < 1.4) { 
              setPhaseText(t('act_toss')); setIsGrabbing(false);
              handY = ((localTime - 1.0) / 0.4) * 1.5; stoneY = handY + 0.8;
              curHandCount = 0; isMomInHand = false; motherVisible = true; calculatedHidden = [4];
          } else if (localTime < 2.8) {
              const airTime = localTime - 1.4;
              stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8;
              motherVisible = true; calculatedHidden = [4]; isMomInHand = false;
              if (airTime < 0.5) { 
                  setPhaseText(t('act_pick') + " 4");
                  handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); setIsGrabbing(false);
              } else if (airTime < 0.9) { 
                  handY = -1.5; handRot = 1.0; setIsGrabbing(true);
                  calculatedHidden = [0, 1, 2, 3, 4]; curHandCount = 4; curHandColor = targetColor;
              } else { 
                  setPhaseText(t('act_catch'));
                  const returnTime = airTime - 0.9;
                  handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3);
                  setIsGrabbing(false); calculatedHidden = [0, 1, 2, 3, 4]; curHandCount = 4; curHandColor = targetColor;
              }
          } else {
              setPhaseText(t('act_got_it')); setIsGrabbing(true); handY = 0; handRot = -0.5; stoneY = 0.8;
              calculatedHidden = [0, 1, 2, 3, 4]; curHandCount = 5; isMomInHand = true; motherVisible = false;
          }
      }

      // ================= LEVEL 5 (BUAH LIMA) =================
      else if (levelId === 5) {
          calculatedTargets = [0, 1, 2, 3];
          if (tVal < 4.0) { // Step 1: Toss 5
              const st = tVal;
              if (st < 1.0) {
                  setPhaseText(t('act_ready')); curHandCount = 5; calculatedHidden = [0,1,2,3,4]; 
                  isMomInHand = true; motherVisible = false; 
                  handY = -0.2 + (Math.sin(st * 4) * 0.05);
              } else if (st < 2.5) {
                  setPhaseText(st < 1.5 ? t('act_toss') : "DROP 4!");
                  if (st < 1.6) { // Toss
                    const p = (st - 1.0) / 0.6; handY = Math.sin(p * Math.PI) * 1.5; curHandCount = 5; 
                    isMomInHand = true; motherVisible = false;
                  } else { // Drop
                    const p = (st - 1.6) / 0.9; handY = 0.5 - (p * 0.5); curHandCount = 0; 
                    calculatedHidden = [4]; // Show 0,1,2,3. Hide 4 (spare)
                    isMomInHand = false; motherVisible = true;
                  }
                  const p_stone = (st - 1.0) / 1.5;
                  stoneY = (Math.sin(p_stone * Math.PI) * 2.8) - 0.5; if (stoneY < 0.8) stoneY = 0.8; 
              } else {
                  setPhaseText(t('act_catch')); calculatedHidden = [4]; curHandCount = 1; handY = 0; stoneY = 0.8; setIsGrabbing(true); 
                  isMomInHand = true; motherVisible = false;
              }
          } 
          else { // Step 2: Sweep 4
              const st = tVal - 4.0;
              if (st < 0.5) { setPhaseText(t('act_ready')); curHandCount = 1; calculatedHidden = [4]; handY = -0.2; isMomInHand = true; motherVisible = false; } 
              else if (st < 1.0) { 
                  setPhaseText(t('act_toss')); const p = (st - 0.5) / 0.5; handY = Math.sin(p * Math.PI / 2) * 1.5; curHandCount = 0; 
                  isMomInHand = false; motherVisible = true; calculatedHidden = [4];
              } else if (st < 2.5) { 
                  const airTime = st - 1.0;
                  stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8; motherVisible = true; calculatedHidden = [4]; isMomInHand = false;
                  if (airTime < 0.5) {
                      setPhaseText(t('act_sweep')); const diveP = airTime / 0.5; handY = 1.5 - (Math.sin(diveP * Math.PI / 2) * 3.0); handRot = -0.5 + (diveP * 1.5); setIsGrabbing(false);
                  } else if (airTime < 0.9) {
                      handY = -1.5; handRot = 1.0; setIsGrabbing(true); calculatedHidden = [0,1,2,3,4]; curHandCount = 4; curHandColor = targetColor;
                  } else {
                      setPhaseText(t('act_catch')); const returnTime = (airTime - 0.9) / 0.6; handY = -1.5 + (Math.sin(returnTime * Math.PI / 2) * 1.5); handRot = 1.0 - (returnTime * 1.5); setIsGrabbing(false); curHandCount = 4; curHandColor = targetColor; calculatedHidden = [0,1,2,3,4];
                  }
              } else {
                  setPhaseText(t('act_got_it')); curHandCount = 5; sparkles = true; stoneY = 0.8; calculatedHidden = [0,1,2,3,4]; isMomInHand = true; motherVisible = false;
              }
          }
      }

      // ================= LEVEL 6 (BUAH TUKAR) - SMOOTHED =================
      else if (levelId === 6) {
          const targetIndex = currentCycleIndex; 
          calculatedTargets = [targetIndex];
          let previouslySwapped: number[] = [];
          for(let i=0; i<currentCycleIndex; i++) previouslySwapped.push(i);
          calculatedSwapped = previouslySwapped;

          const baseHidden = [3, 4]; 

          if (localTime < 1.0) {
              setPhaseText(t('act_ready')); setIsGrabbing(true); handY = -0.2; stoneY = 0.8;
              curHandCount = 2; curHandColor = PASSENGER_STONE_COLOR; 
              isMomInHand = true; motherVisible = false; calculatedHidden = baseHidden;
          } else if (localTime < 1.4) {
              setPhaseText(t('act_toss')); setIsGrabbing(false);
              const p = (localTime - 1.0) / 0.4; handY = p * 1.5; stoneY = handY + 0.8;
              curHandCount = 1; curHandColor = PASSENGER_STONE_COLOR; 
              isMomInHand = false; motherVisible = true; calculatedHidden = baseHidden;
          } else if (localTime < 2.8) {
              const airTime = localTime - 1.4;
              stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8;
              motherVisible = true; calculatedHidden = baseHidden; isMomInHand = false;
              if (airTime < 0.5) {
                  setPhaseText(t('act_swap')); handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); curHandCount = 1; 
              } else if (airTime < 0.9) {
                  handY = -1.5; handRot = 1.0; setIsGrabbing(true);
                  calculatedSwapped = [...previouslySwapped, targetIndex]; 
                  curHandColor = NEUTRAL_STONE_COLOR; 
                  curHandCount = 1; 
              } else {
                  setPhaseText(t('act_catch'));
                  const returnTime = airTime - 0.9;
                  handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3);
                  setIsGrabbing(false); calculatedSwapped = [...previouslySwapped, targetIndex]; 
                  curHandColor = NEUTRAL_STONE_COLOR; curHandCount = 1;
              }
          } else {
              setPhaseText(t('act_got_it')); setIsGrabbing(true); handY = 0; handRot = -0.5; stoneY = 0.8;
              calculatedSwapped = [...previouslySwapped, targetIndex]; curHandColor = NEUTRAL_STONE_COLOR; 
              curHandCount = 2; isMomInHand = true; motherVisible = false; calculatedHidden = baseHidden;
          }
      }

      // ================= LEVEL 7 (BUAH TUJUH) =================
      else if (levelId === 7) {
          if (tVal < 4.0) { // Exchange 2
              calculatedTargets = [0]; 
              const st = tVal;
              if (st < 1.0) {
                  setPhaseText(t('act_ready')); 
                  calculatedHidden = [3, 4]; // Hide indices 3 & 4. Leave 0,1,2 (3 stones)
                  setSwappedGroundIndices([]);
                  curHandCount = 2; curHandColor = PASSENGER_STONE_COLOR; handY = -0.2; isMomInHand = true; motherVisible = false;
              } else if (st < 1.5) {
                  setPhaseText(t('act_toss')); handY = ((st - 1.0) / 0.5) * 1.5; curHandCount = 1; curHandColor = PASSENGER_STONE_COLOR; 
                  isMomInHand = false; motherVisible = true; calculatedHidden = [3, 4];
              } else if (st < 3.0) {
                    const airTime = st - 1.5; stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8; motherVisible = true; calculatedHidden = [3, 4]; isMomInHand = false;
                    if (airTime < 0.5) { handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); curHandCount = 1; curHandColor = PASSENGER_STONE_COLOR; } 
                    else if (airTime < 0.9) { 
                        handY = -1.5; handRot = 1.0; setIsGrabbing(true); 
                        calculatedSwapped = [0]; curHandColor = NEUTRAL_STONE_COLOR; curHandCount = 1; 
                    } 
                    else { setPhaseText(t('act_catch')); const returnTime = airTime - 0.9; handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3); setIsGrabbing(false); calculatedSwapped = [0]; curHandColor = NEUTRAL_STONE_COLOR; curHandCount = 1;}
              } else {
                  setPhaseText(t('act_got_it')); curHandCount = 2; curHandColor = NEUTRAL_STONE_COLOR; calculatedSwapped = [0]; stoneY = 0.8; isMomInHand = true; motherVisible = false; calculatedHidden = [3, 4];
              }
          } else { // Sweep 2
              calculatedTargets = [0, 1, 2]; // All remaining
              const st = tVal - 4.0;
              if (st < 0.5) { setPhaseText(t('act_ready')); handY = -0.2; curHandCount = 2; curHandColor = NEUTRAL_STONE_COLOR; calculatedSwapped = [0]; calculatedHidden = [3, 4]; isMomInHand = true; motherVisible = false; } 
              else if (st < 1.0) { setPhaseText(t('act_toss')); handY = (st - 0.5)/0.5 * 1.5; curHandCount = 1; isMomInHand = false; motherVisible = true; calculatedHidden = [3, 4];} 
              else if (st < 2.5) {
                    const airTime = st - 1.0; stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8; motherVisible = true; calculatedHidden = [3, 4]; isMomInHand = false;
                    if (airTime < 0.5) { setPhaseText(t('act_sweep')); handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); setIsGrabbing(false); } 
                    else if (airTime < 0.9) { handY = -1.5; handRot = 1.0; setIsGrabbing(true); calculatedHidden = [0,1,2,3,4]; curHandCount = 4; curHandColor = targetColor; } 
                    else { setPhaseText(t('act_catch')); const returnTime = airTime - 0.9; handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3); setIsGrabbing(false); calculatedHidden = [0,1,2,3,4]; curHandCount = 4; curHandColor = targetColor; }
              } else {
                  setPhaseText(t('act_got_it')); curHandCount = 5; sparkles = true; stoneY = 0.8; isMomInHand = true; motherVisible = false; calculatedHidden = [0,1,2,3,4];
              }
          }
      }

      // ================= LEVEL 8 (BUAH LAPAN) - CORRECTED =================
      else if (levelId === 8) {
          calculatedTargets = [0, 1, 2, 3, 4]; // ALL Orange initially
          if (tVal < 1.0) {
              setPhaseText(t('act_pick_mom'));
              // Show ALL 5 (0,1,2,3,4) on ground initially. Hand empty.
              calculatedHidden = [];
              if (tVal < 0.5) { 
                  handY = -1.5 * (tVal/0.5); handRot = -0.5 + ((tVal/0.5)*1.5); setIsGrabbing(false); 
                  curHandCount = 0; isMomInHand = false; motherVisible = false; 
              } 
              else { 
                  // Pick index 2 (center) as Mom
                  handY = -1.5 + ((tVal-0.5)/0.5*1.5); handRot = 1.0 - ((tVal-0.5)/0.5*1.5); 
                  setIsGrabbing(true); curHandCount = 1; calculatedHidden = [2]; 
                  isMomInHand = true; motherVisible = false; // Now holding Mom
              }
          } else if (tVal < 1.4) {
              setPhaseText(t('act_toss')); handY = ((tVal - 1.0) / 0.4) * 1.5; 
              curHandCount = 0; isMomInHand = false; motherVisible = true; calculatedHidden = [2];
          } else if (tVal < 2.8) {
              const airTime = tVal - 1.4; stoneY = 1.5 + (6 * airTime) - (0.5 * 9.8 * airTime * airTime) + 0.8; calculatedHidden = [2]; motherVisible = true; isMomInHand = false;
              if (airTime < 0.9) {
                    if (airTime > 0.5) { 
                        setPhaseText(t('act_sweep')); handY = -1.5; handRot = 1.0; setIsGrabbing(true); 
                        calculatedHidden = [0,1,2,3,4]; curHandCount = 4; curHandColor = targetColor;
                    } 
                    else { handY = 1.5 - (airTime * 8); handRot = -0.5 + (airTime * 3); setIsGrabbing(false); }
              } else {
                  setPhaseText(t('act_catch')); 
                  const returnTime = airTime - 0.9;
                  handY = -1.5 + (returnTime * 5); handRot = 1.0 - (returnTime * 3); setIsGrabbing(false); curHandCount = 4; calculatedHidden = [0,1,2,3,4]; curHandColor = targetColor;
              }
          } else {
              setPhaseText(t('act_got_it')); curHandCount = 5; sparkles = true; stoneY = 0.8; calculatedHidden = [0,1,2,3,4]; isMomInHand = true; motherVisible = false;
          }
      }

      handGroup.current.position.y = THREE.MathUtils.lerp(handGroup.current.position.y, handY, 0.2);
      handGroup.current.rotation.x = THREE.MathUtils.lerp(handGroup.current.rotation.x, handRot, 0.2);
      stoneRef.current.position.y = stoneY;
      stoneRef.current.position.z = stoneZ;
      stoneRef.current.visible = motherVisible;
      
      setHandHeldCount(curHandCount);
      setHandHeldColor(curHandColor);
      setHandHoldingMom(isMomInHand);
      setHiddenGroundIndices(calculatedHidden);
      setSwappedGroundIndices(calculatedSwapped);
      setActiveTargetIndices(calculatedTargets);
    }
  });

  return (
    // Key ensures total reset when level changes
    // ADDED position={[0, 1.2, 0]} to move the hand higher up the screen
    <group key={levelId} position={[0, 1.2, 0]}>
        <Text position={[0, 3.2, 0]} fontSize={0.4} color={MOTHER_STONE_COLOR} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
            {phaseText}
        </Text>

        <group ref={stoneRef} position={[0, 0.8, 0.2]}>
            <BatuShape color={MOTHER_STONE_COLOR} scale={0.3} />
        </group>

        {groundStonePositions.map((pos, i) => (
            <GroundStone 
                key={i} 
                position={pos} 
                visible={!hiddenGroundIndices.includes(i)} 
                color={getStoneColor(i)} 
            />
        ))}

        <RealisticHand 
            handRef={handGroup} 
            isGrabbing={isGrabbing} 
            heldCount={handHeldCount} 
            heldColor={handHeldColor} 
            isHoldingMom={handHoldingMom}
        />
        
        {showSparkles && (
            <Sparkles count={20} scale={2} size={4} speed={0.4} opacity={1} color={MOTHER_STONE_COLOR} position={[0, 0.8, 0]} />
        )}

        <gridHelper position={[0, -2.0, 0]} args={[5, 5, 0xffffff, 0xffffff]} />
        <mesh position={[0, -2.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[10, 10]} />
             <meshBasicMaterial color="#000" transparent opacity={0.3} />
        </mesh>
    </group>
  );
};

const Tutorial: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [colorIndex, setColorIndex] = useState(0);
  
  // Current user selected color
  const groundStoneColor = GROUND_STONE_COLORS[colorIndex];
  
  const { t } = useLanguage();
  
  // UseMemo to fetch keys dynamically from language context
  const LevelInfo = useMemo(() => [
    { id: 1, title: t('lvl_1_title'), desc: t('lvl_1_desc') },
    { id: 2, title: t('lvl_2_title'), desc: t('lvl_2_desc') },
    { id: 3, title: t('lvl_3_title'), desc: t('lvl_3_desc') },
    { id: 4, title: t('lvl_4_title'), desc: t('lvl_4_desc') },
    { id: 5, title: t('lvl_5_title'), desc: t('lvl_5_desc') },
    { id: 6, title: t('lvl_6_title'), desc: t('lvl_6_desc') },
    { id: 7, title: t('lvl_7_title'), desc: t('lvl_7_desc') },
    { id: 8, title: t('lvl_8_title'), desc: t('lvl_8_desc') },
  ], [t]);

  const handleZoomIn = () => setZoomLevel(prev => Math.max(5, prev - 1)); 
  const handleZoomOut = () => setZoomLevel(prev => Math.min(20, prev + 1));
  const cycleColor = () => setColorIndex((prev) => (prev + 1) % GROUND_STONE_COLORS.length);

  return (
    <div className="h-[100dvh] bg-heritage-black relative overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <Webcam
            audio={false}
            playsInline
            videoConstraints={VIDEO_CONSTRAINTS}
            className="w-full h-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </div>

      <div className="absolute inset-0 z-10">
        <Canvas gl={{ alpha: true }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
          
          <React.Suspense fallback={null}>
              {/* Key prop ensures the demo completely resets time/state on level switch */}
              {/* Added targetColor prop to control stone color */}
              <DemoScene key={level} levelId={level} targetColor={groundStoneColor} LevelInfo={LevelInfo} t={t} />
          </React.Suspense>
          
          <CameraRig zoomLevel={zoomLevel} />
          <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} />
        </Canvas>
      </div>

      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-50">
        <button 
            onClick={cycleColor}
            className="w-12 h-12 rounded-full border-2 border-white/50 hover:border-white transition-all flex items-center justify-center shadow-lg active:scale-95"
            style={{ backgroundColor: groundStoneColor }}
        >
            <div className="w-full h-full rounded-full animate-pulse opacity-50 bg-white"></div>
        </button>

        <div className="h-px bg-white/20 w-8 mx-auto my-2"></div>

        <button onClick={handleZoomIn} className="bg-black/60 text-white w-12 h-12 rounded-full border border-white/20 hover:bg-heritage-orange transition-colors flex items-center justify-center shadow-lg active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
        <button onClick={handleZoomOut} className="bg-black/60 text-white w-12 h-12 rounded-full border border-white/20 hover:bg-heritage-orange transition-colors flex items-center justify-center shadow-lg active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full z-20 flex flex-col justify-end">
        {/* COMPACTED CONTAINER: Reduced padding (p-3, pb-4) to make it shorter */}
        <div className="bg-heritage-black/90 backdrop-blur-md border-t border-heritage-orange/30 p-3 rounded-t-2xl pb-4">
            <h3 className="text-heritage-orange font-serif text-base mb-2 pl-2">{t('tut_select_level')}</h3>
            
            <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x">
                {LevelInfo.map((info) => (
                    <button
                        key={info.id}
                        onClick={() => setLevel(info.id)}
                        className={`flex-shrink-0 w-40 p-2 rounded-xl border snap-start transition-all ${
                            level === info.id 
                            ? 'bg-heritage-orange text-black border-heritage-orange' 
                            : 'bg-zinc-800/50 text-white border-white/10'
                        }`}
                    >
                        <div className="font-bold text-xs mb-0.5">{t('tut_level_prefix')} {info.id}</div>
                        <div className="text-[10px] opacity-80 whitespace-nowrap overflow-hidden text-ellipsis">{info.title}</div>
                    </button>
                ))}
            </div>
            
            {/* COMPACTED DESCRIPTION: Reduced max-height (max-h-24) */}
            <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 max-h-24 overflow-y-auto">
                <p className="text-heritage-cream text-xs leading-relaxed whitespace-pre-line">
                    <span className="text-heritage-orange font-bold mr-2 block mb-1 uppercase tracking-wider">{t('tut_goal')}</span>
                    {LevelInfo.find(l => l.id === level)?.desc}
                </p>
            </div>
        </div>
      </div>

      <div className="absolute top-20 left-0 w-full z-20 p-6 pointer-events-none">
         <h1 className="text-4xl font-serif text-heritage-cream drop-shadow-lg">{t('tut_title')}</h1>
         <p className="text-white/80 text-sm drop-shadow-md">{t('tut_desc')}</p>
      </div>

    </div>
  );
};

export default Tutorial;