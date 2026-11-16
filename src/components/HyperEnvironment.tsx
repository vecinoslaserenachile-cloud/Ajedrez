import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Sky, Stars, Clouds, Cloud, Environment, MeshReflectorMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CreatureShape = ({ type, material }: { type: string, material: THREE.Material }) => {
  if (type === 'whale') {
    return (
      <group>
        {/* Body */}
        <mesh scale={[1.5, 1.2, 4]} material={material} castShadow><sphereGeometry args={[1, 32, 32]} /></mesh>
        {/* Tail */}
        <mesh position={[0, 0, -4]} scale={[2.5, 0.2, 1.5]} material={material} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>
        {/* Side Fins */}
        <mesh position={[1.5, -0.2, 1]} rotation={[0, 0.5, 0]} scale={[2, 0.1, 0.8]} material={material} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>
        <mesh position={[-1.5, -0.2, 1]} rotation={[0, -0.5, 0]} scale={[2, 0.1, 0.8]} material={material} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>
        {/* Blowhole effect placeholder */}
        <mesh position={[0, 1.2, 1]} scale={[0.2, 0.1, 0.2]} material={material}><sphereGeometry args={[1, 8, 8]} /></mesh>
      </group>
    );
  }
  if (type === 'shark') {
    return (
      <group>
        {/* Body */}
        <mesh scale={[0.8, 0.8, 2.5]} material={material} castShadow><sphereGeometry args={[1, 16, 16]} /></mesh>
        {/* Dorsal Fin */}
        <mesh position={[0, 0.8, 0]} rotation={[-0.5, 0, 0]} scale={[0.2, 1, 0.8]} material={material} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
        {/* Tail (Vertical) */}
        <mesh position={[0, 0, -2.5]} rotation={[Math.PI/2, 0, 0]} scale={[0.2, 1.5, 1]} material={material} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
        {/* Side Fins */}
        <mesh position={[0.8, -0.2, 0.5]} rotation={[0, 0, -0.5]} scale={[1, 0.1, 0.5]} material={material} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
        <mesh position={[-0.8, -0.2, 0.5]} rotation={[0, 0, 0.5]} scale={[1, 0.1, 0.5]} material={material} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
      </group>
    );
  }
  // dolphin
  return (
    <group>
      {/* Body */}
      <mesh scale={[0.5, 0.5, 1.8]} material={material} castShadow><sphereGeometry args={[1, 16, 16]} /></mesh>
      {/* Dorsal Fin */}
      <mesh position={[0, 0.5, 0]} rotation={[-0.5, 0, 0]} scale={[0.1, 0.6, 0.5]} material={material} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
      {/* Tail (Horizontal) */}
      <mesh position={[0, 0, -1.8]} scale={[1.2, 0.1, 0.5]} material={material} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>
      {/* Side Fins */}
      <mesh position={[0.5, -0.1, 0.5]} rotation={[0, 0.2, -0.3]} scale={[0.6, 0.05, 0.3]} material={material} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
      <mesh position={[-0.5, -0.1, 0.5]} rotation={[0, -0.2, 0.3]} scale={[0.6, 0.05, 0.3]} material={material} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
    </group>
  );
};

const SeaCreatures = () => {
  const creaturesRef = useRef<THREE.Group[]>([]);
  
  const materials = useMemo(() => Array.from({ length: 15 }).map(() => 
    new THREE.MeshStandardMaterial({ 
      color: '#010614', 
      transparent: true, 
      opacity: 0.85,
      roughness: 0.35,
      metalness: 0.2
    })
  ), []);

  const data = useMemo(() => Array.from({ length: 15 }).map(() => ({
    type: Math.random() > 0.8 ? 'whale' : Math.random() > 0.4 ? 'shark' : 'dolphin',
    x: (Math.random() - 0.5) * 150,
    z: (Math.random() - 0.5) * 150,
    baseY: -3 - Math.random() * 10,
    speed: 0,
    angle: Math.random() * Math.PI * 2,
    turnSpeed: (Math.random() - 0.5) * 0.01,
    scale: 1,
    jumpTimer: 0,
    isJumping: false
  })), []);

  useMemo(() => {
    data.forEach(d => {
      if (d.type === 'whale') { d.speed = 0.015 + Math.random() * 0.01; d.scale = 2.5 + Math.random(); }
      if (d.type === 'shark') { d.speed = 0.04 + Math.random() * 0.02; d.scale = 1.5 + Math.random() * 0.5; }
      if (d.type === 'dolphin') { d.speed = 0.07 + Math.random() * 0.03; d.scale = 1 + Math.random() * 0.5; }
    });
  }, [data]);

  useFrame((state) => {
    creaturesRef.current.forEach((group, i) => {
      if (!group) return;
      const d = data[i];
      
      d.angle += d.turnSpeed;
      if (Math.random() < 0.01) d.turnSpeed = (Math.random() - 0.5) * 0.02;

      const vx = Math.sin(d.angle) * d.speed;
      const vz = Math.cos(d.angle) * d.speed;
      
      // Jump logic for whales and dolphins
      if (!d.isJumping && (d.type === 'whale' || d.type === 'dolphin') && Math.random() < 0.001) {
        d.isJumping = true;
        d.jumpTimer = 0;
      }

      let yOffset = 0;
      if (d.isJumping) {
        d.jumpTimer += 0.02;
        // Parabolic jump: y = -a(x-h)^2 + k
        // We want it to peak at y=2, duration ~3s
        const jumpDuration = d.type === 'whale' ? 4 : 2;
        const progress = d.jumpTimer / jumpDuration;
        yOffset = Math.sin(progress * Math.PI) * (d.type === 'whale' ? 5 : 3);
        
        if (progress >= 1) {
          d.isJumping = false;
          d.jumpTimer = 0;
        }
      }

      const targetY = d.isJumping 
        ? d.baseY + yOffset 
        : d.baseY + Math.sin(state.clock.elapsedTime * 0.5 * (d.speed * 10) + i) * 2;
      
      // Clamp to surface unless jumping
      const finalTargetY = d.isJumping ? targetY : Math.min(-1, targetY);
      const vy = (finalTargetY - group.position.y) * 0.05;
      
      group.position.x += vx;
      group.position.y += vy;
      group.position.z += vz;
      
      if (group.position.x > 150) group.position.x = -150;
      if (group.position.x < -150) group.position.x = 150;
      if (group.position.z > 150) group.position.z = -150;
      if (group.position.z < -150) group.position.z = 150;
      
      group.rotation.y = d.angle;
      const forwardSpeed = Math.sqrt(vx*vx + vz*vz);
      const pitch = Math.atan2(vy, forwardSpeed);
      group.rotation.x = -pitch;
      
      const swimCycle = Math.sin(state.clock.elapsedTime * (d.speed * 50) + i) * 0.15;
      const bank = d.turnSpeed * 20;
      group.rotation.z = swimCycle - bank;

      const depth = Math.abs(group.position.y);
      const opacity = group.position.y > 0 ? 1 : Math.max(0.1, Math.min(0.9, 1 - (depth - 1) / 15));
      materials[i].opacity = opacity;
    });
  });

  return (
    <group>
      {data.map((d, i) => (
        <group 
          key={i} 
          ref={el => creaturesRef.current[i] = el!} 
          position={[d.x, d.baseY, d.z]}
          scale={[d.scale, d.scale, d.scale]}
        >
          <CreatureShape type={d.type} material={materials[i]} />
        </group>
      ))}
    </group>
  );
};

const Airplane = ({ high }: { high?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  const contrailRef = useRef<THREE.Mesh>(null);
  
  const data = useMemo(() => ({
    speed: high ? 0.8 : 0.4,
    x: -300,
    y: high ? 120 : 60,
    z: (Math.random() - 0.5) * 200,
    angle: Math.random() * 0.2 - 0.1
  }), [high]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.x += data.speed;
    ref.current.position.z += Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    
    if (ref.current.position.x > 400) {
      ref.current.position.x = -400;
      ref.current.position.z = (Math.random() - 0.5) * 200;
    }

    if (contrailRef.current) {
      contrailRef.current.scale.x = 1 + Math.abs(ref.current.position.x + 400) * 0.5;
    }
  });

  return (
    <group ref={ref} position={[data.x, data.y, data.z]}>
      {/* Plane Body */}
      <mesh rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[high ? 0.3 : 0.6, high ? 0.3 : 0.6, high ? 4 : 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, 0]} scale={[high ? 4 : 8, 0.1, high ? 1 : 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Contrail */}
      <mesh ref={contrailRef} position={[-(high ? 50 : 25), 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[high ? 0.1 : 0.2, high ? 0.05 : 0.1, 100, 8]} />
        <meshBasicMaterial color="white" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const SkyEvents = ({ isNight }: { isNight: boolean }) => {
  const starsRef = useRef<THREE.Mesh[]>([]);
  const satellitesRef = useRef<THREE.Mesh[]>([]);
  const cometRef = useRef<THREE.Group>(null);

  const starData = useMemo(() => Array.from({ length: 4 }).map(() => ({
    active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0
  })), []);

  const satData = useMemo(() => Array.from({ length: 6 }).map(() => ({
    angle: Math.random() * Math.PI * 2,
    inclination: (Math.random() - 0.5) * Math.PI,
    speed: 0.0002 + Math.random() * 0.0004,
    radius: 150 + Math.random() * 50
  })), []);

  const cometData = useMemo(() => ({
    x: -150,
    y: 60,
    z: -60, // Much closer to the camera so it's clearly visible
    speed: 0.3
  }), []);

  useFrame((state, delta) => {
    if (!isNight) return;

    // Shooting stars
    starData.forEach((sd, i) => {
      const mesh = starsRef.current[i];
      if (!mesh) return;
      
      if (!sd.active) {
        if (Math.random() < 0.005) { // Spawn chance
          sd.active = true;
          sd.life = 1.0;
          sd.x = (Math.random() - 0.5) * 200;
          sd.y = 80 + Math.random() * 40;
          sd.z = (Math.random() - 0.5) * 200;
          sd.vx = (Math.random() - 0.5) * 6;
          sd.vy = -1 - Math.random() * 3;
          sd.vz = (Math.random() - 0.5) * 6;
          
          mesh.position.set(sd.x, sd.y, sd.z);
          mesh.lookAt(sd.x + sd.vx, sd.y + sd.vy, sd.z + sd.vz);
          mesh.rotateX(Math.PI / 2);
        }
        mesh.visible = false;
      } else {
        sd.x += sd.vx;
        sd.y += sd.vy;
        sd.z += sd.vz;
        sd.life -= delta * 1.5;
        mesh.position.set(sd.x, sd.y, sd.z);
        mesh.visible = true;
        (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, sd.life);
        if (sd.life <= 0) sd.active = false;
      }
    });

    // Satellites
    satData.forEach((sat, i) => {
      const mesh = satellitesRef.current[i];
      if (!mesh) return;
      sat.angle += sat.speed;
      mesh.position.x = Math.cos(sat.angle) * Math.cos(sat.inclination) * sat.radius;
      mesh.position.y = Math.sin(sat.inclination) * sat.radius + 100;
      mesh.position.z = Math.sin(sat.angle) * Math.cos(sat.inclination) * sat.radius;
    });

    // Comet
    if (cometRef.current) {
      cometData.x += cometData.speed;
      cometData.y -= cometData.speed * 0.15; // Slight downward trajectory
      
      if (cometData.x > 150) {
        cometData.x = -150;
        cometData.y = 60 + Math.random() * 20;
      }
      
      cometRef.current.position.set(cometData.x, cometData.y, cometData.z);
      cometRef.current.lookAt(cometData.x + 1, cometData.y - 0.15, cometData.z);
    }
  });

  if (!isNight) return null;

  return (
    <group>
      {starData.map((_, i) => (
        <mesh key={`star-${i}`} ref={el => starsRef.current[i] = el!}>
          <cylinderGeometry args={[0.05, 0.2, 8, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} />
        </mesh>
      ))}
      {satData.map((_, i) => (
        <mesh key={`sat-${i}`} ref={el => satellitesRef.current[i] = el!}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      <group ref={cometRef}>
        {/* Núcleo brillante */}
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Halo interior (Glow) */}
        <mesh>
          <sphereGeometry args={[2.5, 16, 16]} />
          <meshBasicMaterial color="#88ccff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Cola principal */}
        <mesh position={[0, 0, -15]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0, 2.5, 30, 16]} />
          <meshBasicMaterial color="#4488ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Cola exterior más larga y difusa */}
        <mesh position={[0, 0, -25]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0, 4, 50, 16]} />
          <meshBasicMaterial color="#224488" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};

export const HyperEnvironment = ({ isFoggy, isNightOverride }: { isFoggy: boolean, isNightOverride?: boolean }) => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    // Update the time every 10 seconds to slowly move the sun/moon
    const timer = setInterval(() => setDate(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const hours = date.getHours() + date.getMinutes() / 60;
  // 0h = -PI/2 (nadir), 6h = 0 (sunrise), 12h = PI/2 (zenith), 18h = PI (sunset)
  const angle = (hours / 24) * Math.PI * 2 - Math.PI / 2;
  
  const sunX = Math.cos(angle) * 100;
  const sunY = Math.sin(angle) * 100;
  const isNight = isNightOverride !== undefined ? isNightOverride : sunY < 0;
  const lightIntensity = Math.max(0, Math.sin(angle)) * 1.5;

  // Generate procedural mountains
  const peaks = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const a = (i / 40) * Math.PI * 2;
      const radius = 100 + Math.random() * 40; // Pushed further back
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const height = 6 + Math.random() * 10; // Made much shorter
      return { x, z, height, scale: 30 + Math.random() * 20 }; // Made wider
    });
  }, []);

  return (
    <group>
      {/* Sky & Sun */}
      <Sky 
        distance={450000} 
        sunPosition={[sunX, sunY, 0]} 
        inclination={0} 
        azimuth={0.25} 
        turbidity={isFoggy ? 20 : (isNight ? 2 : 10)}
        rayleigh={isFoggy ? 4 : (isNight ? 0.1 : 2)}
      />
      
      {/* Stars for Night Time */}
      {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

      {/* Volumetric Clouds - Restored simplified version */}
      {!isFoggy && (
        <Suspense fallback={null}>
          <Clouds material={THREE.MeshBasicMaterial}>
            <Cloud segments={10} bounds={[100, 10, 100]} volume={10} color={isNight ? "#222" : "white"} position={[0, 40, 0]} speed={0.5} opacity={0.4} />
          </Clouds>
        </Suspense>
      )}

      {/* Ambient Lighting - Moved to App.tsx */}
      
      {/* Board Light - Moved to App.tsx */}
      {!isNight && (
        <directionalLight
          castShadow
          position={[sunX, sunY, 0]}
          intensity={isFoggy ? 0.5 : lightIntensity}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0005}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      )}

      {/* Moon Light */}
      {isNight && (
        <directionalLight
          castShadow
          position={[-sunX, Math.abs(sunY), 0]}
          intensity={0.4}
          color="#aaccff"
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0005}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      )}

      {/* Environment Reflections - Restored simplified version */}
      <Suspense fallback={null}>
        <Environment preset={isNight ? "night" : "sunset"} />
      </Suspense>

      {/* Dynamic Sky Events */}
      <SkyEvents isNight={isNight} />
      
      {/* Airplanes */}
      {!isNight && (
        <>
          <Airplane />
          <Airplane high />
        </>
      )}

      {/* Underwater Shadows */}
      <SeaCreatures />

      {/* Sun Mesh for more defined look */}
      {!isNight && (
        <mesh position={[sunX, sunY, -100]}>
          <sphereGeometry args={[4, 32, 32]} />
          <meshBasicMaterial color="#fff9e6" />
          <pointLight intensity={2} distance={500} />
        </mesh>
      )}

      {/* Lush Green Valley Terrain - Simplified to prevent rendering issues */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial 
          color={isNight ? "#050a0f" : "#1a2e15"}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Surrounding Mountains */}
      <group>
        {peaks.map((p, i) => (
          <mesh key={i} position={[p.x, p.height/2 - 1, p.z]} receiveShadow castShadow>
            <coneGeometry args={[p.scale, p.height, 4]} />
            <meshStandardMaterial color={isNight ? "#050a03" : "#1e3612"} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
