'use client';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

function AbstractMedicalShapeInternal() {
  return (
    <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2}>
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]} scale={1.2}>
        <torusKnotGeometry args={[1, 0.35, 128, 32]} />
        <MeshDistortMaterial color="#10b981" envMapIntensity={1} clearcoat={1} clearcoatRoughness={0.1} metalness={0.6} roughness={0.1} distort={0.3} speed={2.5} />
      </mesh>
    </Float>
  );
}

export default function AbstractMedicalShape() {
  return (
     <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#10b981" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#34d399" />
        <spotLight position={[0, 10, 0]} intensity={1.5} penumbra={1} color="#ffffff" />
        <AbstractMedicalShapeInternal />
     </Canvas>
  );
}
