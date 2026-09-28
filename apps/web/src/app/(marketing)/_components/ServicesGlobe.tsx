"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from "react";
import { BackSide, Vector3, type Mesh } from "three";
import land from "./globe-land-rows.json";

const COUNTRIES = [
  { name: "Philippines", code: "PH", lat: 12.88, lng: 121.77, note: "Nationwide · Luzon, Visayas & Mindanao" },
  { name: "Australia", code: "AU", lat: -25.27, lng: 133.78, note: "Remote collaboration · Australia" },
  { name: "Canada", code: "CA", lat: 56.13, lng: -106.35, note: "Remote collaboration · Canada" },
  { name: "United States", code: "US", lat: 37.09, lng: -95.71, note: "Remote collaboration · United States" },
];
type GlobeControls = ComponentRef<typeof OrbitControls>;

function globePosition(lat: number, lng: number, radius: number) {
  const latitude = lat * Math.PI / 180;
  const longitude = lng * Math.PI / 180;
  return new Vector3(
    radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
    radius * Math.cos(latitude) * Math.cos(longitude),
  );
}

function Earth() {
  const surface = useRef<Mesh>(null!);
  // Equirectangular land mask sampled from dotted-map's bundled world GeoJSON (MIT).
  const dots = useMemo(() => new Float32Array(land.rows.flatMap((row, y) => {
    const latitude = 90 - y / land.height * 180;
    const stride = Math.max(1, Math.round(1 / Math.max(0.15, Math.cos(latitude * Math.PI / 180))));
    return row.filter((x) => x % stride === 0).flatMap((x) => globePosition(latitude, x / land.width * 360 - 180, 2.012).toArray());
  })), []);

  return (
    <group>
      <mesh ref={surface}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#030503" emissive="#081300" emissiveIntensity={0.35} roughness={0.95} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.014, 64, 64]} />
        <meshBasicMaterial color="#b8ff2e" side={BackSide} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dots, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#b8ff2e" size={0.027} sizeAttenuation />
      </points>
      {COUNTRIES.map((country) => (
        <group key={country.code} position={globePosition(country.lat, country.lng, 2.045)}>
          <mesh>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshBasicMaterial color="#b8ff2e" />
          </mesh>
          <Html center occlude={[surface]} zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
            <span className="eyebrow block -translate-y-7 whitespace-nowrap border border-acid/50 bg-ink/95 px-2.5 py-1.5 text-[10px] text-acid">
              {country.name}
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}

function CameraFocus({ country, controls }: { country: number; controls: RefObject<GlobeControls | null> }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const target = COUNTRIES[country];
    camera.position.copy(globePosition(target.lat, target.lng, 6.6));
    camera.lookAt(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [country, camera, controls, invalidate]);
  return null;
}

export default function ServicesGlobe({ visible }: { visible: boolean }) {
  const controls = useRef<GlobeControls>(null);
  const [country, setCountry] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSpinning(!preference.matches);
    const onChange = () => setSpinning(!preference.matches);
    preference.addEventListener("change", onChange);
    return () => preference.removeEventListener("change", onChange);
  }, []);

  function rotate(direction: number) {
    setSpinning(false);
    const orbit = controls.current;
    if (orbit) orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + direction * Math.PI / 6);
  }

  const buttonStyle = "min-h-11 border border-acid/25 px-4 py-2 text-xs text-acid transition-colors hover:bg-acid/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid disabled:opacity-40";

  return (
    <div>
      <div className="relative isolate aspect-square cursor-grab active:cursor-grabbing" role="group" aria-label="Interactive 3D globe showing ARKO service coverage" aria-describedby="globe-instructions">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[9%] rounded-full bg-acid/10 blur-3xl" />
        <Canvas
          camera={{ position: [5.5, 1.5, -3.5], fov: 43 }}
          dpr={[1, 1.5]}
          frameloop={visible && spinning ? "always" : "demand"}
          gl={{ antialias: true, alpha: true }}
          onCreated={() => setReady(true)}
          fallback={<p className="p-8 text-center text-white/60">3D is unavailable on this device. Our service coverage is listed below.</p>}
          style={{ touchAction: "pan-y" }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[3, 5, 4]} intensity={2} />
          <Earth />
          <OrbitControls
            ref={controls}
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.5}
            autoRotate={spinning && visible}
            autoRotateSpeed={0.45}
            minPolarAngle={Math.PI * 0.08}
            maxPolarAngle={Math.PI * 0.92}
            onStart={() => setSpinning(false)}
          />
          <CameraFocus country={country} controls={controls} />
        </Canvas>
      </div>

      <div className="relative z-10 -mt-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-acid/20 py-3">
          <p id="globe-instructions" className="eyebrow text-[10px] text-white/55">Drag to explore / Select a country</p>
          <div className="flex gap-2" aria-label="Globe rotation controls">
            <button type="button" disabled={!ready} aria-label="Rotate globe left" onClick={() => rotate(-1)} className={buttonStyle}>←</button>
            <button type="button" disabled={!ready} aria-label={spinning ? "Pause globe rotation" : "Start globe rotation"} aria-pressed={spinning} onClick={() => setSpinning((value) => !value)} className={`${buttonStyle} min-w-20`}>{spinning ? "Pause" : "Rotate"}</button>
            <button type="button" disabled={!ready} aria-label="Rotate globe right" onClick={() => rotate(1)} className={buttonStyle}>→</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Service coverage">
          {COUNTRIES.map((item, index) => (
            <button key={item.code} type="button" aria-pressed={country === index} onClick={() => { setCountry(index); setSpinning(false); }} className={`min-h-16 border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid ${country === index ? "border-acid bg-acid text-ink" : "border-acid/20 text-white/70 hover:border-acid/60"}`}>
              <span className="eyebrow block text-[10px] opacity-60">{item.code}</span>
              <span className="mt-1 block text-xs font-semibold">{item.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/55" aria-live="polite">{COUNTRIES[country].note}</p>
      </div>
    </div>
  );
}
