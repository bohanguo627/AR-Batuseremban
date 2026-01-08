import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';

interface BatuModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  texturePath?: string;
  fallbackColor?: string;
}

const BatuSerembanModel: React.FC<BatuModelProps> = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1, 
  texturePath, 
  fallbackColor = "#ea580c" 
}) => {
  
  // 1. Load Geometry
  const obj = useLoader(OBJLoader, '/models/white_mesh.obj') as THREE.Group;

  // 2. Load Texture
  // We use the safe loading hook. If no path is provided, texture is null.
  const texture = texturePath ? useTexture(texturePath) : null;

  if (texture) {
    // Configure texture wrapping and repeat
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    // Adjust repeat if the pattern looks too big or small
    texture.repeat.set(1, 1); 
    texture.center.set(0.5, 0.5);
    
    // IMPORTANT: Using SRGBColorSpace ensures the texture colors are interpreted correctly
    // and look vibrant/saturated, matching the "deep" look you liked.
    texture.colorSpace = THREE.SRGBColorSpace; 
  }

  // 3. Clone and Apply Material
  const clonedScene = useMemo(() => {
    const clone = obj.clone(true);
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Auto-generate UV coordinates (Spherical Mapping)
        // This ensures the Batik image wraps around the stone shape properly.
        if (mesh.geometry) {
             mesh.geometry.computeBoundingBox();
             const box = mesh.geometry.boundingBox!;
             const center = new THREE.Vector3();
             box.getCenter(center);
             const pos = mesh.geometry.attributes.position;
             const uvArray = new Float32Array(pos.count * 2);
             for (let i = 0; i < pos.count; i++) {
                 const x = pos.getX(i) - center.x;
                 const y = pos.getY(i) - center.y;
                 const z = pos.getZ(i) - center.z;
                 const radius = Math.sqrt(x*x + y*y + z*z);
                 const u = 0.5 + (Math.atan2(z, x) / (2 * Math.PI));
                 const v = 0.5 - (Math.asin(y / radius) / Math.PI);
                 uvArray[i * 2] = u;
                 uvArray[i * 2 + 1] = v;
             }
             mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
             mesh.geometry.attributes.uv.needsUpdate = true;
        }

        // --- THE MATERIAL STYLE FROM YOUR PREVIOUS CODE ---
        mesh.material = new THREE.MeshStandardMaterial({
          map: texture || null,
          color: texture ? '#ffffff' : fallbackColor, // White base color lets the texture show through true
          
          // High Roughness = Matte Fabric (Not shiny)
          roughness: 1.0, 
          
          // No Metalness = Fabric/Cloth look
          metalness: 0.0,

          // NO Emissive = This prevents the "pale/glowing" look. 
          // The stones will only be lit by the scene lights, keeping colors deep.
        });
      }
    });
    return clone;
  }, [obj, texture, fallbackColor]);

  const s = Array.isArray(scale) ? scale : [scale, scale, scale] as [number, number, number];

  return <primitive object={clonedScene} position={position} rotation={rotation} scale={s} />;
};

export default BatuSerembanModel;
