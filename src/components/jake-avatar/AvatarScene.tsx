"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import JakeFace from "./JakeFace";

interface AvatarSceneProps {
  mouthOpen: number;
  eyeGlow: number;
  isSpeaking: boolean;
}

export default function AvatarScene({ mouthOpen, eyeGlow, isSpeaking }: AvatarSceneProps) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300 }}>
      <Canvas
        camera={{ position: [0, 0.3, 3.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Ambient fill */}
        <ambientLight intensity={0.25} color="#8888aa" />

        {/* Key light — cool white from top-left */}
        <directionalLight position={[-2, 3, 2]} intensity={1.2} color="#dde8ff" />

        {/* Rim light — teal accent from behind */}
        <pointLight position={[0, 1, -2]} intensity={0.8} color="#00ffc8" />

        {/* Fill light — warm from right */}
        <pointLight position={[2, 0, 1]} intensity={0.3} color="#d4a574" />

        {/* Ground plane — faint grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#0a0a14" metalness={0.9} roughness={0.5} transparent opacity={0.6} />
        </mesh>

        {/* The avatar */}
        <JakeFace mouthOpen={mouthOpen} eyeGlow={eyeGlow} isSpeaking={isSpeaking} />

        {/* Subtle orbit — user can drag to rotate */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          autoRotate={false}
        />

        {/* Environment for reflections */}
        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
