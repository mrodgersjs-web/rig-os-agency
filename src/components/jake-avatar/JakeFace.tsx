"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────────
   Jake's 3D face — a stylised geometric head built from primitives.
   Dark RIG aesthetic: near-black chrome, emerald/teal glowing eyes,
   subtle metallic sheen. Mouth and eyes animate driven by lip-sync.
   ───────────────────────────────────────────────────────────────────── */

interface JakeFaceProps {
  mouthOpen: number;
  eyeGlow: number;
  isSpeaking: boolean;
}

// -- materials (created once) ------------------------------------------
const matHead = new THREE.MeshStandardMaterial({
  color: "#1a1a2e",
  metalness: 0.7,
  roughness: 0.3,
});
const matChin = new THREE.MeshStandardMaterial({
  color: "#16162a",
  metalness: 0.8,
  roughness: 0.25,
});
const matVisor = new THREE.MeshStandardMaterial({
  color: "#0d0d1a",
  metalness: 0.95,
  roughness: 0.1,
  transparent: true,
  opacity: 0.85,
});

export default function JakeFace({ mouthOpen, eyeGlow, isSpeaking }: JakeFaceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const visorRef = useRef<THREE.Mesh>(null);
  const breathRef = useRef(0);

  // Glow colour that ramps with eyeGlow
  const eyeColor = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    // -- idle breathing / sway --
    breathRef.current += delta;
    if (groupRef.current) {
      const sway = Math.sin(breathRef.current * 0.8) * 0.015;
      const bob = Math.sin(breathRef.current * 1.2) * 0.008;
      groupRef.current.position.y = bob;
      groupRef.current.rotation.z = sway;

      // Speaking head movement
      if (isSpeaking) {
        groupRef.current.rotation.y = Math.sin(breathRef.current * 3) * 0.04;
        groupRef.current.rotation.x = Math.sin(breathRef.current * 2.5) * 0.02;
      } else {
        groupRef.current.rotation.y += (0 - groupRef.current.rotation.y) * 0.02;
        groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.02;
      }
    }

    // -- mouth --
    if (mouthRef.current) {
      const targetScale = 0.3 + mouthOpen * 0.7;
      mouthRef.current.scale.y += (targetScale - mouthRef.current.scale.y) * 0.3;
      mouthRef.current.scale.x = 1 + mouthOpen * 0.15;
    }

    // -- eyes glow --
    const glow = THREE.MathUtils.lerp(0.1, 1.0, eyeGlow);
    eyeColor.setHSL(0.45, 0.8, 0.15 + glow * 0.5);

    [leftEyeRef, rightEyeRef].forEach((ref) => {
      if (ref.current) {
        (ref.current.material as THREE.MeshStandardMaterial).emissive = eyeColor;
        (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow * 2;
      }
    });

    // Pupil glow pulse
    const pulseScale = 1 + (isSpeaking ? Math.sin(breathRef.current * 8) * 0.15 * eyeGlow : 0);
    [leftPupilRef, rightPupilRef].forEach((ref) => {
      if (ref.current) {
        ref.current.scale.setScalar(pulseScale);
        (ref.current.material as THREE.MeshStandardMaterial).emissive = eyeColor;
        (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow * 3;
      }
    });

    // Visor glow
    if (visorRef.current) {
      (visorRef.current.material as THREE.MeshStandardMaterial).emissive = eyeColor;
      (visorRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main head — slightly elongated sphere */}
      <mesh material={matHead}>
        <sphereGeometry args={[1, 32, 32]} />
        <mesh scale={[1, 1.15, 0.9]} />
      </mesh>

      {/* Jaw / lower face */}
      <mesh position={[0, -0.45, 0.15]} material={matChin}>
        <boxGeometry args={[1.2, 0.6, 0.7]} />
      </mesh>

      {/* Visor / face plate */}
      <mesh ref={visorRef} position={[0, 0.1, 0.75]} material={matVisor}>
        <boxGeometry args={[1.5, 0.55, 0.08]} />
      </mesh>

      {/* Left eye */}
      <mesh ref={leftEyeRef} position={[-0.35, 0.15, 0.82]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#112b2b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh ref={leftPupilRef} position={[-0.35, 0.15, 0.92]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#00ffc8" emissive="#00ffc8" emissiveIntensity={0.5} />
      </mesh>

      {/* Right eye */}
      <mesh ref={rightEyeRef} position={[0.35, 0.15, 0.82]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#112b2b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh ref={rightPupilRef} position={[0.35, 0.15, 0.92]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#00ffc8" emissive="#00ffc8" emissiveIntensity={0.5} />
      </mesh>

      {/* Mouth — dark slit that opens */}
      <mesh ref={mouthRef} position={[0, -0.25, 0.78]}>
        <boxGeometry args={[0.4, 0.08, 0.04]} />
        <meshStandardMaterial color="#001a0d" emissive="#00ffc8" emissiveIntensity={0.2} />
      </mesh>

      {/* Ear panels */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.95, 0.05, 0]} rotation={[0, 0, side * 0.3]}>
          <boxGeometry args={[0.12, 0.4, 0.3]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Antenna / top detail */}
      <mesh position={[0, 0.95, -0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
        <meshStandardMaterial color="#2a2a4e" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.12, -0.1]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#00ffc8" emissive="#00ffc8" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}
