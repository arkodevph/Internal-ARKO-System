"use client";

import { Center, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Box3, Vector3, type Group } from "three";

const MODEL_PATH = "/projects/models/griffith-helmet.glb";

function Helmet({ rotating }: { rotating: boolean }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_PATH);
  const scale = useMemo(() => {
    const size = new Box3().setFromObject(scene).getSize(new Vector3());
    return 3.2 / Math.max(size.x, size.y, size.z);
  }, [scene]);

  useFrame((_, delta) => {
    if (rotating && group.current) group.current.rotation.y += delta * 0.45;
  });

  return (
    <Center>
      <group ref={group} rotation={[0.08, -0.35, -0.04]} scale={scale}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

export default function ProjectHelmet() {
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateRotation = () => setRotating(!preference.matches);
    updateRotation();
    preference.addEventListener("change", updateRotation);
    return () => preference.removeEventListener("change", updateRotation);
  }, []);

  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        aria-hidden
        camera={{ position: [0, 0.1, 5], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop={rotating ? "always" : "demand"}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={2.2} />
        <directionalLight position={[4, 5, 6]} intensity={3.5} />
        <directionalLight position={[-4, 1, 2]} intensity={1.8} />
        <Suspense fallback={null}>
          <Helmet rotating={rotating} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
