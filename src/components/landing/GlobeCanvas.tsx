import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 3400;
const ARC_COUNT = 70;

/** shared mutable speed factor — landing scroll progress drives 1x -> 3x */
export interface GlobeControls {
  speed: React.MutableRefObject<number>;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function fibonacciSphere(n: number, radius: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pos[i * 3] = Math.cos(theta) * r * radius;
    pos[i * 3 + 1] = y * radius;
    pos[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return pos;
}

function GlobePoints() {
  const positions = useMemo(() => fibonacciSphere(NODE_COUNT, 2.2), []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#22D3EE"
        size={0.017}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

function GlobeArcs() {
  const geometry = useMemo(() => {
    const rand = (() => {
      let s = 42;
      return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
    })();
    const nodes = fibonacciSphere(400, 2.2);
    const verts: number[] = [];
    for (let a = 0; a < ARC_COUNT; a++) {
      const i = Math.floor(rand() * 400);
      const j = Math.floor(rand() * 400);
      if (i === j) continue;
      const p0 = new THREE.Vector3(nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2]);
      const p1 = new THREE.Vector3(nodes[j * 3], nodes[j * 3 + 1], nodes[j * 3 + 2]);
      if (p0.distanceTo(p1) < 1.2) continue;
      const mid = p0.clone().add(p1).multiplyScalar(0.5).normalize().multiplyScalar(2.2 * (1.12 + rand() * 0.2));
      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
      const pts = curve.getPoints(24);
      for (let k = 0; k < pts.length - 1; k++) {
        verts.push(pts[k].x, pts[k].y, pts[k].z, pts[k + 1].x, pts[k + 1].y, pts[k + 1].z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#34D399" transparent opacity={0.32} depthWrite={false} />
    </lineSegments>
  );
}

function GlobeRig({ controls }: { controls: GlobeControls }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * ((Math.PI * 2) / 8) * 0.25 * controls.speed.current;
    const targetX = controls.mouse.current.y * 0.18;
    const targetZ = controls.mouse.current.x * 0.1;
    g.rotation.x += (targetX - g.rotation.x) * 0.04;
    g.rotation.z += (targetZ - g.rotation.z) * 0.04;
  });
  return (
    <group ref={group} rotation={[0.35, 0, -0.12]}>
      <GlobePoints />
      <GlobeArcs />
      {/* faint inner core glow sphere */}
      <mesh>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial color="#0A0E16" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export default function GlobeCanvas({ controls }: { controls: GlobeControls }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // pause render loop when off-screen
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 45 }}
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <GlobeRig controls={controls} />
      </Canvas>
    </div>
  );
}
