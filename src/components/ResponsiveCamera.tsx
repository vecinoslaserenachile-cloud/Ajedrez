import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

function getIdealFraming(aspect: number, preset: '3d' | 'top') {
  const isPortrait = aspect < 1;

  if (isPortrait) {
    const safeAspect = Math.max(aspect, 0.38);
    const fov = 52;
    const halfVFovRad = THREE.MathUtils.degToRad(fov / 2);
    // Board base is 8.4 units wide; 4.65 half-width adds comfortable side margin for thumb taps
    const dist = THREE.MathUtils.clamp(
      4.65 / (Math.tan(halfVFovRad) * safeAspect),
      12.5,
      23.5
    );

    if (preset === 'top') {
      return {
        fov,
        position: [0, dist * 0.95, dist * 0.28] as [number, number, number],
        target: [0, 0, 0.25] as [number, number, number],
        minDistance: 8,
        maxDistance: 28,
      };
    }

    return {
      fov,
      position: [0, dist * 0.78, dist * 0.62] as [number, number, number],
      target: [0, 0, 0.25] as [number, number, number],
      minDistance: 8,
      maxDistance: 28,
    };
  }

  // Landscape / Desktop
  const fov = 48;
  if (preset === 'top') {
    return {
      fov,
      position: [0, 12.2, 3.6] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      minDistance: 4.5,
      maxDistance: 24,
    };
  }

  return {
    fov,
    position: [0, 6.8, 8.8] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    minDistance: 4.5,
    maxDistance: 24,
  };
}

export const ResponsiveCamera = () => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isTransitioning = useRef(true);
  const lastOrientation = useRef<boolean | null>(null);

  const cameraPreset = useGameStore((s) => s.cameraPreset);
  const isCameraLocked = useGameStore((s) => s.isCameraLocked);
  const cameraResetTick = useGameStore((s) => s.cameraResetTick);

  const aspect = size.width / Math.max(size.height, 1);
  const isPortrait = aspect < 1;
  const framing = getIdealFraming(aspect, cameraPreset);

  // Trigger smooth transition on initial mount, preset change, reset button, or portrait/landscape flip
  useEffect(() => {
    const orientationChanged =
      lastOrientation.current !== null && lastOrientation.current !== isPortrait;
    if (lastOrientation.current === null) {
      // Snap immediately on very first mount so user doesn't see a jarring fly-in from [0,6,8]
      camera.position.set(...framing.position);
      if (controlsRef.current) {
        controlsRef.current.target.set(...framing.target);
        controlsRef.current.update();
      }
      isTransitioning.current = false;
    } else if (orientationChanged || cameraResetTick > 0) {
      isTransitioning.current = true;
    }
    lastOrientation.current = isPortrait;
  }, [cameraPreset, cameraResetTick, isPortrait]);

  // Also trigger transition when cameraPreset changes
  useEffect(() => {
    if (lastOrientation.current !== null) {
      isTransitioning.current = true;
    }
  }, [cameraPreset]);

  // Keep camera FOV synced with portrait/landscape without needing remount
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      if (Math.abs(camera.fov - framing.fov) > 0.1) {
        camera.fov = framing.fov;
        camera.updateProjectionMatrix();
      }
    }
  }, [camera, framing.fov]);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;

    const dt = Math.min(delta, 0.1);
    _targetCamPos.set(...framing.position);
    _targetLookAt.set(...framing.target);

    camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 7, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 7, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 7, dt);

    if (controlsRef.current) {
      controlsRef.current.target.x = THREE.MathUtils.damp(
        controlsRef.current.target.x,
        _targetLookAt.x,
        7,
        dt
      );
      controlsRef.current.target.y = THREE.MathUtils.damp(
        controlsRef.current.target.y,
        _targetLookAt.y,
        7,
        dt
      );
      controlsRef.current.target.z = THREE.MathUtils.damp(
        controlsRef.current.target.z,
        _targetLookAt.z,
        7,
        dt
      );
      controlsRef.current.update();
    }

    if (camera.position.distanceTo(_targetCamPos) < 0.04) {
      camera.position.copy(_targetCamPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(_targetLookAt);
        controlsRef.current.update();
      }
      isTransitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!isCameraLocked}
      enablePan={!isPortrait}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={isPortrait ? 0.75 : 0.9}
      zoomSpeed={0.85}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minDistance={framing.minDistance}
      maxDistance={framing.maxDistance}
      onStart={() => {
        isTransitioning.current = false;
      }}
    />
  );
};
