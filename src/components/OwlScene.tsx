// Procedural great-horned owl for the hero: dark, desaturated, blood-red eyes.
// Built in three.js (no third-party model) so we own the silhouette, the flap, and the
// idle — and the chunk stays tiny. Flies in after ENTER, then perches on the wordmark.
import * as THREE from "three";
import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OWL_DPR } from "../lib/hooks";

const DARK = "#14110f";
const CHAR = "#1c1815";
const DOWN = "#2a241c";
const HORN = "#3a3228";
const DISC = "#1a1613";
const RED = "#d4141c";
const RED_DEEP = "#6e070b";
const BONE = "#c8bfb0";

const FLY_S = 3.05;

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
function bezier(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  return out.set(0, 0, 0).addScaledVector(a, uu * u).addScaledVector(b, 3 * uu * t).addScaledVector(c, 3 * u * tt).addScaledVector(d, tt * t);
}

function FeatherMat({ color, roughness = 0.86, metalness = 0.06 }: { color: string; roughness?: number; metalness?: number }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />;
}

function Eye({ x }: { x: number }) {
  return (
    <group position={[x, 0.06, 0.3]}>
      <mesh position={[0, 0, -0.01]} scale={[1.35, 1.35, 1]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color={RED} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.078, 16, 12]} />
        <meshStandardMaterial color={RED_DEEP} emissive={RED} emissiveIntensity={0.7} roughness={0.28} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0, 0.042]} scale={[0.42, 0.42, 0.28]}>
        <sphereGeometry args={[0.078, 12, 10]} />
        <meshStandardMaterial color="#070403" roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh position={[0.018, 0.022, 0.068]} scale={0.55}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshBasicMaterial color={BONE} />
      </mesh>
    </group>
  );
}

function Lid({ x, lid }: { x: number; lid: RefObject<THREE.Mesh | null> }) {
  return (
    <mesh ref={lid} position={[x, 0.13, 0.31]} rotation={[0.15, 0, 0]}>
      <sphereGeometry args={[0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <FeatherMat color={CHAR} roughness={0.9} />
    </mesh>
  );
}

function Wing({
  side,
  group,
  simple,
}: {
  side: 1 | -1;
  group: RefObject<THREE.Group | null>;
  simple: boolean;
}) {
  const feathers = simple ? [0, 1] : [0, 1, 2, 3];
  return (
    <group ref={group}>
      <mesh position={[side * 0.12, 0.04, -0.02]} rotation={[0.15, side * 0.15, side * 0.08]} scale={[1, 0.55, 0.85]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <FeatherMat color={DARK} />
      </mesh>
      <mesh position={[side * 0.42, -0.02, 0]} rotation={[0.35, side * 0.08, side * -0.28]} scale={[1.15, 0.22, 0.72]}>
        <sphereGeometry args={[0.32, 10, 8]} />
        <FeatherMat color={CHAR} />
      </mesh>
      {feathers.map((i) => (
        <mesh
          key={i}
          position={[side * (0.55 + i * 0.13), -0.08 - i * 0.05, 0.02 - i * 0.02]}
          rotation={[0.2 + i * 0.04, 0, side * (-0.42 - i * 0.1)]}
          scale={[1, 0.22, 0.55]}
        >
          <boxGeometry args={[0.34 - i * 0.03, 0.08, 0.2]} />
          <FeatherMat color={i % 2 ? DARK : CHAR} />
        </mesh>
      ))}
    </group>
  );
}

function OwlMesh({
  mobile,
  reduced,
  delay,
}: {
  mobile: boolean;
  reduced: boolean;
  delay: number;
}) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  const lidL = useRef<THREE.Mesh>(null!);
  const lidR = useRef<THREE.Mesh>(null!);
  const t0 = useRef<number | null>(null);
  const blinkAt = useRef(2.8);
  const ruffleAt = useRef(5.4);
  const look = useRef({ y: 0.42, x: 0.06 });
  const nextLook = useRef(1.8);

  const path = useMemo(() => {
    const perch = new THREE.Vector3(mobile ? 0.15 : -0.95, mobile ? -0.15 : -0.72, 0);
    return {
      perch,
      a: new THREE.Vector3(perch.x + 2.55, perch.y + 1.85, -0.35),
      b: new THREE.Vector3(perch.x + 1.55, perch.y + 1.45, 1.25),
      c: new THREE.Vector3(perch.x + 0.55, perch.y + 0.55, 0.55),
      d: perch.clone(),
      tmp: new THREE.Vector3(),
    };
  }, [mobile]);

  const segs = mobile ? 8 : 14;

  useFrame((state, delta) => {
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - t0.current;
    const flyT = reduced ? 1 : clamp01((elapsed - delay) / FLY_S);
    const u = easeOutCubic(flyT);
    const flying = u < 1;

    bezier(path.a, path.b, path.c, path.d, u, path.tmp);
    root.current.position.copy(path.tmp);

    // 3/4 perch facing the wordmark; bank + pitch through the camera-facing arc
    const yaw = THREE.MathUtils.lerp(1.15, 0.52, u);
    const pitch = flying ? THREE.MathUtils.lerp(-0.28, 0.08, u) + Math.sin(u * Math.PI) * -0.12 : 0.08;
    const roll = flying ? Math.sin(u * Math.PI) * 0.38 : 0;
    root.current.rotation.set(pitch, yaw, roll);

    const spread = flying ? 1 - easeInOut(clamp01((u - 0.72) / 0.28)) : 0;
    const flapSpeed = 15 - spread * 4;
    const flap = flying ? Math.sin(elapsed * flapSpeed) * (0.35 + spread * 0.7) : 0;

    const idleT = Math.max(0, elapsed - delay - FLY_S);
    let ruffle = 0;
    if (!reduced && !flying) {
      if (idleT > ruffleAt.current && idleT < ruffleAt.current + 0.45) {
        ruffle = Math.sin(((idleT - ruffleAt.current) / 0.45) * Math.PI) * 0.55;
      } else if (idleT > ruffleAt.current + 0.45) {
        ruffleAt.current = idleT + 4.5 + Math.random() * 5;
      }
    }

    const foldY = 0.78;
    const foldZ = 0.42;
    const foldX = 0.22;
    left.current.position.set(-0.1, 0.06, 0.02);
    right.current.position.set(0.1, 0.06, 0.02);
    left.current.rotation.set(foldX * (1 - spread), foldY * (1 - spread) + spread * 0.08, -foldZ * (1 - spread) - flap - ruffle);
    right.current.rotation.set(foldX * (1 - spread), -foldY * (1 - spread) - spread * 0.08, foldZ * (1 - spread) + flap + ruffle);

    if (!reduced && !flying) {
      body.current.position.y = Math.sin(idleT * 1.7) * 0.012;
      if (idleT > nextLook.current) {
        look.current.y = 0.38 + (Math.random() - 0.45) * 0.5;
        look.current.x = 0.04 + (Math.random() - 0.5) * 0.16;
        nextLook.current = idleT + 1.8 + Math.random() * 2.4;
      }
    } else {
      body.current.position.y = 0;
    }
    const hy = reduced ? 0.42 : THREE.MathUtils.damp(head.current.rotation.y, flying ? 0.08 : look.current.y, 2.2, delta);
    const hx = reduced ? 0.06 : THREE.MathUtils.damp(head.current.rotation.x, flying ? -0.04 : look.current.x, 2.2, delta);
    head.current.rotation.y = hy;
    head.current.rotation.x = hx;

    let lid = 0.02;
    if (!reduced) {
      const blinkClock = flying ? elapsed : idleT;
      if (blinkClock > blinkAt.current && blinkClock < blinkAt.current + 0.12) {
        lid = Math.sin(((blinkClock - blinkAt.current) / 0.12) * Math.PI) * 0.16;
      } else if (blinkClock > blinkAt.current + 0.12) {
        blinkAt.current = blinkClock + 2.6 + Math.random() * 3.5;
      }
    }
    lidL.current.position.y = 0.13 - lid * 0.35;
    lidR.current.position.y = 0.13 - lid * 0.35;
    lidL.current.rotation.x = 0.15 + lid * 2.4;
    lidR.current.rotation.x = 0.15 + lid * 2.4;
  });

  return (
    <group ref={root} scale={mobile ? 0.78 : 1}>
      <group ref={body}>
        <mesh scale={[1, 1.18, 0.92]} position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.4, segs, segs]} />
          <FeatherMat color={CHAR} />
        </mesh>
        <mesh scale={[0.78, 0.85, 0.55]} position={[0, -0.08, 0.16]}>
          <sphereGeometry args={[0.36, segs, segs]} />
          <FeatherMat color={DOWN} roughness={0.92} />
        </mesh>
        <group ref={head} position={[0, 0.42, 0.06]}>
          <mesh scale={[1.02, 0.92, 0.9]}>
            <sphereGeometry args={[0.34, segs, segs]} />
            <FeatherMat color={CHAR} />
          </mesh>
          <mesh position={[-0.12, 0.02, 0.22]} rotation={[0.15, -0.35, 0]} scale={[0.95, 1, 0.35]}>
            <sphereGeometry args={[0.2, 12, 10]} />
            <FeatherMat color={DISC} roughness={0.95} />
          </mesh>
          <mesh position={[0.12, 0.02, 0.22]} rotation={[0.15, 0.35, 0]} scale={[0.95, 1, 0.35]}>
            <sphereGeometry args={[0.2, 12, 10]} />
            <FeatherMat color={DISC} roughness={0.95} />
          </mesh>
          <Eye x={-0.11} />
          <Eye x={0.11} />
          <Lid x={-0.11} lid={lidL} />
          <Lid x={0.11} lid={lidR} />
          <mesh position={[0, -0.02, 0.34]} rotation={[Math.PI / 2.15, 0, 0]}>
            <coneGeometry args={[0.055, 0.14, 6]} />
            <meshStandardMaterial color={HORN} roughness={0.4} metalness={0.22} />
          </mesh>
          <mesh position={[-0.16, 0.3, -0.02]} rotation={[0.15, 0, -0.45]} scale={[0.45, 1, 0.35]}>
            <coneGeometry args={[0.1, 0.22, 5]} />
            <FeatherMat color={DARK} />
          </mesh>
          <mesh position={[0.16, 0.3, -0.02]} rotation={[0.15, 0, 0.45]} scale={[0.45, 1, 0.35]}>
            <coneGeometry args={[0.1, 0.22, 5]} />
            <FeatherMat color={DARK} />
          </mesh>
        </group>
        <Wing side={-1} group={left} simple={mobile} />
        <Wing side={1} group={right} simple={mobile} />
        <mesh position={[0, -0.22, -0.28]} rotation={[0.55, 0, 0]} scale={[0.7, 0.18, 1]}>
          <boxGeometry args={[0.32, 0.1, 0.28]} />
          <FeatherMat color={DARK} />
        </mesh>
        <mesh position={[-0.1, -0.42, 0.06]} rotation={[0.15, 0, 0.08]}>
          <cylinderGeometry args={[0.028, 0.022, 0.16, 6]} />
          <meshStandardMaterial color={HORN} roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[0.1, -0.42, 0.06]} rotation={[0.15, 0, -0.08]}>
          <cylinderGeometry args={[0.028, 0.022, 0.16, 6]} />
          <meshStandardMaterial color={HORN} roughness={0.5} metalness={0.15} />
        </mesh>
        {([-0.1, 0.1] as const).map((x) =>
          ([-0.04, 0, 0.04] as const).map((z, i) => (
            <mesh key={`${x}-${z}`} position={[x + (i - 1) * 0.012, -0.52, 0.1 + z]} rotation={[1.15, 0, (i - 1) * 0.35]}>
              <coneGeometry args={[0.012, 0.055, 4]} />
              <meshStandardMaterial color={HORN} roughness={0.4} metalness={0.2} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

function Lights({ mobile }: { mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.16} color="#8a8378" />
      <directionalLight position={[-2.2, 2.4, 3.2]} intensity={0.7} color="#d8d0c4" />
      <directionalLight position={[2.4, 0.8, -2.2]} intensity={mobile ? 0.35 : 0.55} color="#8a2024" />
      {!mobile && <pointLight position={[0.2, 0.35, 1.6]} intensity={0.22} color={RED} distance={3.4} />}
    </>
  );
}

export function OwlScene({
  active,
  reduced,
  mobile,
}: {
  active: boolean;
  reduced: boolean;
  mobile: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={mobile ? ([1, 1] as [number, number]) : OWL_DPR}
      gl={{ antialias: !mobile, powerPreference: "high-performance", alpha: true }}
      style={{ pointerEvents: "none" }}
      camera={{ position: [0.1, 0.15, 5.2], fov: mobile ? 34 : 28 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMappingExposure = 0.9;
      }}
      aria-hidden
    >
      <Lights mobile={mobile} />
      <OwlMesh mobile={mobile} reduced={reduced} delay={reduced ? 0 : 0.18} />
    </Canvas>
  );
}
