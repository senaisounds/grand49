// Procedural great-horned owl for the hero: dark, desaturated, blood-red eyes.
// Built in three.js (no third-party model) so we own the silhouette, the flap, and the
// idle — and the chunk stays tiny. Flies in after ENTER, then perches on the wordmark.
import * as THREE from "three";
import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OWL_DPR } from "../lib/hooks";

const BODY = "#4a4036";
const DOWN = "#6e6254";
const DARK = "#322c26";
const DISC = "#3a332c";
const HORN = "#c4a574";
const CLAW = "#9a8060";
const RED = "#d4141c";
const RED_DEEP = "#6e070b";
const BONE = "#e6dcc8";

const FLY_S = 3.1;

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
  return out
    .set(0, 0, 0)
    .addScaledVector(a, uu * u)
    .addScaledVector(b, 3 * uu * t)
    .addScaledVector(c, 3 * u * tt)
    .addScaledVector(d, tt * t);
}

function Eye({ x }: { x: number }) {
  return (
    <group position={[x, 0.03, 0.175]}>
      <mesh position={[0, 0, 0.002]} scale={1.45}>
        <circleGeometry args={[0.055, 16]} />
        <meshBasicMaterial color={RED} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.048, 16, 12]} />
        <meshStandardMaterial color={RED_DEEP} emissive={RED} emissiveIntensity={0.85} roughness={0.22} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.026]} scale={[0.4, 0.4, 0.28]}>
        <sphereGeometry args={[0.048, 10, 8]} />
        <meshStandardMaterial color="#090604" roughness={0.3} />
      </mesh>
      <mesh position={[0.012, 0.014, 0.04]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color={BONE} />
      </mesh>
    </group>
  );
}

function Lid({ x, lid }: { x: number; lid: RefObject<THREE.Mesh | null> }) {
  return (
    <mesh ref={lid} position={[x, 0.075, 0.172]} rotation={[0.2, 0, 0]}>
      <sphereGeometry args={[0.056, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      <meshStandardMaterial color={DARK} roughness={0.88} />
    </mesh>
  );
}

function Wing({ side, group }: { side: 1 | -1; group: RefObject<THREE.Group | null> }) {
  return (
    <group ref={group} position={[side * 0.13, 0.05, -0.01]}>
      <mesh rotation={[0.95, side * 1.05, side * 0.08]} scale={[0.36, 0.9, 0.18]} position={[0, -0.03, 0]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color={DARK} roughness={0.8} metalness={0.08} />
      </mesh>
      <group userData={{ flight: true }} position={[side * 0.16, 0.02, 0]}>
        <mesh rotation={[0.15, side * 0.15, side * -0.55]} scale={[1.15, 0.18, 0.42]}>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshStandardMaterial color={DARK} roughness={0.78} metalness={0.08} />
        </mesh>
      </group>
    </group>
  );
}

function OwlMesh({ mobile, reduced, delay }: { mobile: boolean; reduced: boolean; delay: number }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  const lidL = useRef<THREE.Mesh>(null!);
  const lidR = useRef<THREE.Mesh>(null!);
  const t0 = useRef<number | null>(null);
  const blinkAt = useRef(2.4);
  const ruffleAt = useRef(5.2);
  const look = useRef({ y: 0.15, x: 0.04 });
  const nextLook = useRef(1.6);

  const path = useMemo(() => {
    const perch = new THREE.Vector3(mobile ? 0.2 : 0.72, mobile ? -0.12 : -0.42, 0);
    return {
      a: perch.clone().add(new THREE.Vector3(1.85, 1.55, -0.4)),
      b: perch.clone().add(new THREE.Vector3(0.85, 1.15, 1.05)),
      c: perch.clone().add(new THREE.Vector3(0.28, 0.42, 0.35)),
      d: perch,
      tmp: new THREE.Vector3(),
    };
  }, [mobile]);

  const segs = mobile ? 8 : 16;

  useFrame((state, delta) => {
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - t0.current;
    const flyT = reduced ? 1 : clamp01((elapsed - delay) / FLY_S);
    const u = easeOutCubic(flyT);
    const flying = u < 1;

    bezier(path.a, path.b, path.c, path.d, u, path.tmp);
    root.current.position.copy(path.tmp);

    const yaw = THREE.MathUtils.lerp(1.05, 0.42, u);
    const pitch = flying ? THREE.MathUtils.lerp(-0.22, 0.06, u) + Math.sin(u * Math.PI) * -0.1 : 0.06;
    const roll = flying ? Math.sin(u * Math.PI) * 0.32 : 0;
    root.current.rotation.set(pitch, yaw, roll);

    const spread = flying ? 1 - easeInOut(clamp01((u - 0.7) / 0.3)) : 0;
    const flap = flying ? Math.sin(elapsed * 14) * (0.25 + spread * 0.7) : 0;

    const idleT = Math.max(0, elapsed - delay - FLY_S);
    let ruffle = 0;
    if (!reduced && !flying) {
      if (idleT > ruffleAt.current && idleT < ruffleAt.current + 0.4) {
        ruffle = Math.sin(((idleT - ruffleAt.current) / 0.4) * Math.PI) * 0.4;
      } else if (idleT > ruffleAt.current + 0.4) {
        ruffleAt.current = idleT + 4.8 + Math.random() * 5;
      }
    }

    left.current.rotation.set(-0.25 * spread, 0.35 * spread, -0.12 - flap - ruffle);
    right.current.rotation.set(-0.25 * spread, -0.35 * spread, 0.12 + flap + ruffle);
    for (const wing of [left.current, right.current]) {
      wing.traverse((obj) => {
        if (obj.userData.flight) obj.scale.setScalar(0.15 + spread * 0.95);
      });
    }

    if (!reduced && !flying) {
      body.current.position.y = Math.sin(idleT * 1.7) * 0.01;
      if (idleT > nextLook.current) {
        look.current.y = 0.12 + (Math.random() - 0.4) * 0.45;
        look.current.x = 0.02 + (Math.random() - 0.5) * 0.14;
        nextLook.current = idleT + 1.7 + Math.random() * 2.2;
      }
    } else {
      body.current.position.y = 0;
    }
    head.current.rotation.y = reduced ? 0.12 : THREE.MathUtils.damp(head.current.rotation.y, flying ? 0.06 : look.current.y, 2.4, delta);
    head.current.rotation.x = reduced ? 0.04 : THREE.MathUtils.damp(head.current.rotation.x, flying ? -0.02 : look.current.x, 2.4, delta);

    let lid = 0.015;
    if (!reduced) {
      const clock = flying ? elapsed : idleT;
      if (clock > blinkAt.current && clock < blinkAt.current + 0.11) {
        lid = Math.sin(((clock - blinkAt.current) / 0.11) * Math.PI) * 0.12;
      } else if (clock > blinkAt.current + 0.11) {
        blinkAt.current = clock + 2.4 + Math.random() * 3.2;
      }
    }
    for (const el of [lidL.current, lidR.current]) {
      el.position.y = 0.075 - lid * 0.3;
      el.rotation.x = 0.2 + lid * 2.2;
    }
  });

  return (
    <group ref={root} scale={mobile ? 0.7 : 0.78}>
      <group ref={body}>
        <mesh scale={[0.88, 1.02, 0.8]} position={[0, -0.04, 0]}>
          <sphereGeometry args={[0.24, segs, segs]} />
          <meshStandardMaterial color={BODY} roughness={0.78} metalness={0.08} />
        </mesh>
        <mesh scale={[0.66, 0.68, 0.4]} position={[0, -0.07, 0.11]}>
          <sphereGeometry args={[0.2, segs, segs]} />
          <meshStandardMaterial color={DOWN} roughness={0.9} metalness={0.04} />
        </mesh>
        <group ref={head} position={[0, 0.24, 0.05]}>
          <mesh scale={[1.08, 0.92, 0.9]}>
            <sphereGeometry args={[0.22, segs, segs]} />
            <meshStandardMaterial color={BODY} roughness={0.8} metalness={0.07} />
          </mesh>
          <mesh position={[-0.075, 0.01, 0.13]} rotation={[0.2, -0.4, 0]} scale={[0.95, 1, 0.32]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color={DISC} roughness={0.94} />
          </mesh>
          <mesh position={[0.075, 0.01, 0.13]} rotation={[0.2, 0.4, 0]} scale={[0.95, 1, 0.32]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color={DISC} roughness={0.94} />
          </mesh>
          <Eye x={-0.068} />
          <Eye x={0.068} />
          <Lid x={-0.068} lid={lidL} />
          <Lid x={0.068} lid={lidR} />
          <mesh position={[0, -0.02, 0.2]} rotation={[1.25, 0, 0]}>
            <coneGeometry args={[0.032, 0.08, 5]} />
            <meshStandardMaterial color={HORN} roughness={0.38} metalness={0.28} />
          </mesh>
          <mesh position={[-0.12, 0.2, -0.01]} rotation={[0.2, 0.08, -0.48]} scale={[0.55, 1.15, 0.34]}>
            <coneGeometry args={[0.075, 0.2, 5]} />
            <meshStandardMaterial color={DARK} roughness={0.82} />
          </mesh>
          <mesh position={[0.12, 0.2, -0.01]} rotation={[0.2, -0.08, 0.48]} scale={[0.55, 1.15, 0.34]}>
            <coneGeometry args={[0.075, 0.2, 5]} />
            <meshStandardMaterial color={DARK} roughness={0.82} />
          </mesh>
        </group>
        <Wing side={-1} group={left} />
        <Wing side={1} group={right} />
        <mesh position={[0, -0.14, -0.18]} rotation={[0.65, 0, 0]} scale={[0.62, 0.16, 0.85]}>
          <boxGeometry args={[0.18, 0.06, 0.16]} />
          <meshStandardMaterial color={DARK} roughness={0.82} />
        </mesh>
        <mesh position={[-0.07, -0.3, 0.04]} rotation={[0.2, 0, 0.06]}>
          <cylinderGeometry args={[0.018, 0.014, 0.1, 6]} />
          <meshStandardMaterial color={CLAW} roughness={0.45} metalness={0.18} />
        </mesh>
        <mesh position={[0.07, -0.3, 0.04]} rotation={[0.2, 0, -0.06]}>
          <cylinderGeometry args={[0.018, 0.014, 0.1, 6]} />
          <meshStandardMaterial color={CLAW} roughness={0.45} metalness={0.18} />
        </mesh>
        {([-0.07, 0.07] as const).map((x) =>
          ([-0.025, 0, 0.025] as const).map((z, i) => (
            <mesh key={`${x}-${z}`} position={[x + (i - 1) * 0.008, -0.36, 0.07 + z]} rotation={[1.2, 0, (i - 1) * 0.32]}>
              <coneGeometry args={[0.008, 0.036, 4]} />
              <meshStandardMaterial color={CLAW} roughness={0.4} metalness={0.22} />
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
      <hemisphereLight args={["#ddd4c6", "#2a1012", 0.75]} />
      <directionalLight position={[-1.8, 2.2, 3.4]} intensity={1.7} color="#f3eadc" />
      <directionalLight position={[2.2, 0.6, -1.8]} intensity={mobile ? 0.7 : 1.05} color="#d43038" />
      {!mobile && <pointLight position={[0.15, 0.2, 1.2]} intensity={0.35} color={RED} distance={2.8} />}
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
      camera={{ position: [0.2, 0.02, 4.55], fov: 30 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMappingExposure = 1.12;
      }}
      aria-hidden
    >
      <Lights mobile={mobile} />
      <OwlMesh mobile={mobile} reduced={reduced} delay={reduced ? 0 : 0.12} />
    </Canvas>
  );
}
