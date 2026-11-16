import React, { Suspense } from 'react';
import { Mesh } from 'three';
import { Text } from '@react-three/drei';

interface PieceProps {
  color: 'w' | 'b';
  position: [number, number, number];
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
  onPointerDown?: (e: any) => void;
  onPointerUp?: (e: any) => void;
  isSelected?: boolean;
}

const getMaterial = (color: 'w' | 'b', isSelected: boolean, isAccent = false) => {
  if (isAccent) {
    return (
      <meshPhysicalMaterial 
        color={color === 'w' ? '#d4af37' : '#e0e0e0'} // Gold for white, Silver for black
        metalness={1} 
        roughness={0.2} 
        clearcoat={1} 
        emissive={isSelected ? '#ffff00' : '#000000'} 
        emissiveIntensity={0.4} 
      />
    );
  }
  const baseColor = color === 'w' ? '#fdfbf7' : '#1a1a1a'; // Marble white / Obsidian black
  return (
    <meshPhysicalMaterial 
      color={baseColor} 
      metalness={0.1} 
      roughness={0.1} 
      clearcoat={1} 
      clearcoatRoughness={0.1}
      emissive={isSelected ? '#444400' : '#000000'} 
      emissiveIntensity={0.5} 
    />
  );
};

const Hitbox = () => (
  <mesh position={[0, 1.25, 0]}>
    <cylinderGeometry args={[0.4, 0.4, 2.5, 16]} />
    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
  </mesh>
);

const PremiumBase = ({ color, isSelected }: { color: 'w'|'b', isSelected: boolean }) => (
  <group>
    <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.45, 0.5, 0.2, 32]} />
      {getMaterial(color, isSelected, true)}
    </mesh>
    <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.4, 0.45, 0.1, 32]} />
      {getMaterial(color, isSelected)}
    </mesh>
    {/* Branding Stamp */}
    <Suspense fallback={null}>
      <Text
        position={[0, 0.21, 0.35]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color={color === 'w' ? '#888' : '#444'}
        anchorX="center"
        anchorY="middle"
      >
        VLS
      </Text>
      <Text
        position={[0, 0.21, -0.35]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        fontSize={0.05}
        color={color === 'w' ? '#aaa' : '#333'}
        anchorX="center"
        anchorY="middle"
      >
        vecinoslaserena.cl
      </Text>
    </Suspense>
  </group>
);

export const Rey = ({ color, position, onClick, onPointerOver, onPointerOut, onPointerDown, onPointerUp, isSelected }: PieceProps) => (
  <group 
    position={position} 
    onClick={onClick}
    onPointerOver={onPointerOver}
    onPointerOut={onPointerOut}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <Hitbox />
    <PremiumBase color={color} isSelected={isSelected || false} />
    
    {/* Main Tower Body - Tapered Marble */}
    <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.28, 0.38, 1.1, 32]} />
      {getMaterial(color, isSelected || false)}
    </mesh>

    {/* Arched Windows (3 levels) */}
    {[0.6, 0.9, 1.2].map((y, i) => (
      <group key={i} position={[0, y, 0.3]} rotation={[0, 0, 0]}>
        {/* Window Frame */}
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.22, 0.06]} />
          {getMaterial(color, isSelected || false, true)}
        </mesh>
        {/* Window Interior */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.1, 0.18, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    ))}

    {/* Base Corner Towers (4) - Tapered with golden tops */}
    {[0, 1, 2, 3].map(i => {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const r = 0.42;
      return (
        <group key={i} position={[Math.cos(angle) * r, 0.35, Math.sin(angle) * r]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.12, 0.18, 0.5, 16]} />
            {getMaterial(color, isSelected || false)}
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <coneGeometry args={[0.15, 0.25, 16]} />
            {getMaterial(color, isSelected || false, true)}
          </mesh>
        </group>
      );
    })}

    {/* Top Crenellated Gallery - Golden */}
    <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.4, 0.35, 0.2, 8]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>

    {/* Lantern Part - Glass with Golden Frame */}
    <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.18, 0.18, 0.3, 16]} />
      <meshPhysicalMaterial 
        color={color === 'w' ? '#ffffff' : '#444444'} 
        transparent 
        opacity={0.3} 
        transmission={0.9} 
        thickness={0.5}
        roughness={0}
      />
    </mesh>
    <mesh position={[0, 1.65, 0]} castShadow>
      <cylinderGeometry args={[0.19, 0.19, 0.3, 16, 1, true]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>

    {/* Dome and Cross */}
    <mesh position={[0, 1.85, 0]} castShadow>
      <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    
    {/* Maltese Cross - Detailed */}
    <group position={[0, 2.2, 0]}>
      {/* Vertical Bar */}
      <mesh castShadow>
        <boxGeometry args={[0.06, 0.45, 0.06]} />
        {getMaterial(color, isSelected || false, true)}
      </mesh>
      {/* Horizontal Bar */}
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.06, 0.06]} />
        {getMaterial(color, isSelected || false, true)}
      </mesh>
      {/* Flared Ends */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.07]} />
        {getMaterial(color, isSelected || false, true)}
      </mesh>
      <mesh position={[0, -0.22, 0]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.07]} />
        {getMaterial(color, isSelected || false, true)}
      </mesh>
      <mesh position={[0.17, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.18, 0.07]} />
        {getMaterial(color, isSelected || false, true)}
      </mesh>
      <mesh position={[-0.17, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.18, 0.07]} />
        {getMaterial(color, isSelected || false, true)}
      </mesh>
    </group>
  </group>
);

export const Faro = ({ color, position, onClick, onPointerOver, onPointerOut, onPointerDown, onPointerUp, isSelected }: PieceProps) => (
  <group 
    position={position} 
    onClick={onClick}
    onPointerOver={onPointerOver}
    onPointerOut={onPointerOut}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <Hitbox />
    <PremiumBase color={color} isSelected={isSelected || false} />
    <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.3, 0.35, 1, 32]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.2, 0.3, 0.4, 16]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.25, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.05, 0.3, 0.05]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.2, 0.05, 0.05]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
  </group>
);

export const Catedral = ({ color, position, onClick, onPointerOver, onPointerOut, onPointerDown, onPointerUp, isSelected }: PieceProps) => (
  <group 
    position={position} 
    onClick={onClick}
    onPointerOver={onPointerOver}
    onPointerOut={onPointerOut}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <Hitbox />
    <PremiumBase color={color} isSelected={isSelected || false} />
    <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.35, 0.4, 1, 32]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.4, 0.35, 0.2, 32]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.25, 0.35, 0.4, 16]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.15, 16, 16]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
  </group>
);

export const Moai = ({ color, position, onClick, onPointerOver, onPointerOut, onPointerDown, onPointerUp, isSelected }: PieceProps) => (
  <group 
    position={position} 
    onClick={onClick}
    onPointerOver={onPointerOver}
    onPointerOut={onPointerOut}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <Hitbox />
    <PremiumBase color={color} isSelected={isSelected || false} />
    <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.4, 1, 0.4]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.4, 0.1]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.4, 0.6, 0.45]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.4, 0.35]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.15, 0.4, 0.2]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.7, 0.1]} castShadow receiveShadow>
      <boxGeometry args={[0.4, 0.1, 0.45]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
  </group>
);

export const Campanario = ({ color, position, onClick, onPointerOver, onPointerOut, onPointerDown, onPointerUp, isSelected }: PieceProps) => (
  <group 
    position={position} 
    onClick={onClick}
    onPointerOver={onPointerOver}
    onPointerOut={onPointerOut}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <Hitbox />
    <PremiumBase color={color} isSelected={isSelected || false} />
    <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.25, 0.35, 1, 32]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.3, 0.25, 0.2, 32]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.15, 0.25, 0.4, 16]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
      <coneGeometry args={[0.2, 0.4, 16]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
  </group>
);

export const Fuerte = ({ color, position, onClick, onPointerOver, onPointerOut, onPointerDown, onPointerUp, isSelected }: PieceProps) => (
  <group 
    position={position} 
    onClick={onClick}
    onPointerOver={onPointerOver}
    onPointerOut={onPointerOut}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <Hitbox />
    <PremiumBase color={color} isSelected={isSelected || false} />
    <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.4, 0.45, 0.8, 32]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.45, 0.4, 0.1, 32]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.45, 0.45, 0.2, 16]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    {/* Crenellations */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
      <mesh key={i} position={[Math.cos(i * Math.PI / 4) * 0.35, 1.45, Math.sin(i * Math.PI / 4) * 0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        {getMaterial(color, isSelected || false)}
      </mesh>
    ))}
  </group>
);

export const JarroPato = ({ color, position, onClick, onPointerOver, onPointerOut, onPointerDown, onPointerUp, isSelected }: PieceProps) => (
  <group 
    position={position} 
    onClick={onClick}
    onPointerOver={onPointerOver}
    onPointerOut={onPointerOut}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
  >
    <Hitbox />
    <PremiumBase color={color} isSelected={isSelected || false} />
    <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.35, 32, 32]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0.15, 0.9, 0]} rotation={[0, 0, -0.3]} castShadow receiveShadow>
      <cylinderGeometry args={[0.1, 0.15, 0.3, 16]} />
      {getMaterial(color, isSelected || false)}
    </mesh>
    <mesh position={[0.3, 1.05, 0]} rotation={[0, 0, -1.5]} castShadow receiveShadow>
      <coneGeometry args={[0.08, 0.2, 16]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
    <mesh position={[-0.25, 0.8, 0]} rotation={[0, 0, 0.5]} castShadow receiveShadow>
      <torusGeometry args={[0.15, 0.04, 16, 32, Math.PI]} />
      {getMaterial(color, isSelected || false, true)}
    </mesh>
  </group>
);
