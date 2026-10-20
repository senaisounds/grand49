// Predator horned owl — owl silhouette, hawk hunt, eagle stoop.
// Procedural three.js so we own the scowl, the talons, and the strike.
import * as THREE from "three";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OWL_DPR } from "../lib/hooks";

const PLUME = "#1c1612";
const BODY = "#2a221c";
const DOWN = "#3f342c";
const EDGE = "#14110e";
const DISC = "#201a16";
const BEAK = "#8a6a3e";
const CLAW = "#6e5434";
const RED = "#d4141c";
const RED_HOT = "#ff2a28";

const HUNT = 3.15;
const DOM = 0.55;
const FOLD = 0.7;

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function easeIn(t: number) {
  return t * t;
}
function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function Feather({ color = PLUME }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={0.86} metalness={0.1} />;
}

function Eye({ x }: { x: number }) {
  return (
    <group position={[x, 0.008, 0.205]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]} scale={[0.38, 1.05, 1]}>
      <mesh position={[0, 0, 0.012]} scale={[2.4, 1.6, 1]}>
        <circleGeometry args={[0.05, 12]} />
        <meshBasicMaterial color={RED_HOT} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.048, 10, 8]} />
        <meshStandardMaterial color="#2a0305" emissive={RED} emissiveIntensity={1.35} roughness={0.16} metalness={0.28} />
      </mesh>
      <mesh position={[0, 0, 0.03]} scale={[0.32, 0.7, 0.22]}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshStandardMaterial color="#050201" roughness={0.22} />
      </mesh>
    </group>
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
  const n = simple ? 5 : 8;
  return (
    <group ref={group} position={[side * 0.1, 0.06, 0]}>
      <mesh position={[side * 0.16, 0.02, 0]} rotation={[0.1, 0, side * -0.12]} scale={[1, 0.32, 0.5]}>
        <boxGeometry args={[0.34, 0.1, 0.14]} />
        <Feather color={BODY} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh
          key={i}
          position={[side * (0.38 + i * 0.145), 0.04 - i * 0.045, (i % 2) * -0.02]}
          rotation={[0.08, side * 0.05, side * (-0.18 - i * 0.05)]}
        >
          <boxGeometry args={[0.3 - i * 0.02, 0.028, 0.09]} />
          <Feather color={i % 2 ? EDGE : PLUME} />
        </mesh>
      ))}
    </group>
  );
}

function Talon({ x, group }: { x: number; group: RefObject<THREE.Group | null> }) {
  return (
    <group ref={group} position={[x, -0.28, 0.04]}>
      <mesh rotation={[0.35, 0, x > 0 ? -0.08 : 0.08]}>
        <cylinderGeometry args={[0.028, 0.02, 0.2, 5]} />
        <meshStandardMaterial color={CLAW} roughness={0.42} metalness={0.22} />
      </mesh>
      {([-0.036, 0, 0.036] as const).map((z, i) => (
        <mesh key={z} position={[(i - 1) * 0.014, -0.12, 0.06 + z]} rotation={[1.35, 0, (i - 1) * 0.4]}>
          <coneGeometry args={[0.015, 0.09, 4]} />
          <meshStandardMaterial color="#4a3824" roughness={0.32} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -0.1, -0.025]} rotation={[2.3, 0, 0]}>
        <coneGeometry args={[0.012, 0.065, 4]} />
        <meshStandardMaterial color="#4a3824" roughness={0.32} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Smoke({ burst, simple }: { burst: RefObject<number>; simple: boolean }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const seeds = useMemo(
    () =>
      Array.from({ length: simple ? 7 : 12 }, (_, i) => ({
        a: (i / 12) * Math.PI * 2,
        s: 0.5 + (i % 5) * 0.12,
        y: 0.2 + (i % 3) * 0.08,
      })),
    [simple],
  );
  useFrame(() => {
    const age = burst.current;
    const live = age > 0 && age < 0.7;
    seeds.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      if (!live) {
        m.visible = false;
        return;
      }
      m.visible = true;
      const t = age / 0.7;
      const r = 0.12 + t * 0.55 * p.s;
      m.position.set(Math.cos(p.a) * r, -0.42 + t * p.y, Math.sin(p.a) * r * 0.5);
      const sc = 0.08 + t * 0.22;
      m.scale.setScalar(sc);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.45;
    });
  });
  return (
    <group>
      {seeds.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={RED} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

type Hunt = {
  pos: THREE.Vector3;
  pitch: number;
  yaw: number;
  roll: number;
  spread: number;
  beat: number;
  talon: number;
  chest: number;
  scale: number;
};

function huntAt(u: number, perch: THREE.Vector3, out: Hunt) {
  const px = perch.x;
  const py = perch.y;
  const pz = perch.z;
  // 0-0.40 circle/glide · 0.40-0.58 tuck · 0.58-0.78 stoop · 0.78-0.90 flare · 0.90-1 land
  if (u < 0.4) {
    const t = u / 0.4;
    const ang = lerp(0.2, 2.55, easeInOut(t));
    const rad = lerp(2.15, 1.05, t);
    out.pos.set(px + Math.cos(ang) * rad, py + 1.85 - t * 0.45, pz + Math.sin(ang) * rad * 0.75 - 0.15);
    out.yaw = ang + Math.PI * 0.5;
    out.pitch = -0.18;
    out.roll = Math.sin(t * Math.PI) * 0.55;
    out.spread = 1;
    out.beat = Math.sin(t * Math.PI * 3.2) * (t < 0.22 || t > 0.7 ? 0.7 : 0.18);
    out.talon = 0.15;
    out.chest = 0;
    out.scale = 1;
    return;
  }
  if (u < 0.58) {
    const t = (u - 0.4) / 0.18;
    const e = easeIn(t);
    const ang = 2.55;
    out.pos.set(
      lerp(px + Math.cos(ang) * 1.05, px + 0.25, e),
      lerp(py + 1.4, py + 1.05, e),
      lerp(pz + Math.sin(ang) * 0.79 - 0.15, pz + 1.15, e),
    );
    out.yaw = lerp(ang + Math.PI * 0.5, 0.55, t);
    out.pitch = lerp(-0.18, 0.85, e);
    out.roll = lerp(0.15, 0.05, t);
    out.spread = lerp(1, 0.08, easeInOut(t));
    out.beat = 0;
    out.talon = lerp(0.15, 0.45, t);
    out.chest = 0;
    out.scale = lerp(1, 1.08, t);
    return;
  }
  if (u < 0.78) {
    const t = (u - 0.58) / 0.2;
    const e = easeIn(t);
    out.pos.set(lerp(px + 0.25, px + 0.08, e), lerp(py + 1.05, py + 0.22, e), lerp(pz + 1.15, pz + 1.85, e));
    out.yaw = 0.42;
    out.pitch = lerp(0.85, 1.05, t);
    out.roll = Math.sin(t * 6) * 0.04;
    out.spread = 0.06;
    out.beat = 0;
    out.talon = lerp(0.45, 1, e);
    out.chest = 0.1;
    out.scale = lerp(1.08, 1.55, e);
    return;
  }
  if (u < 0.9) {
    const t = (u - 0.78) / 0.12;
    const e = easeOut(t);
    out.pos.set(lerp(px + 0.08, px + 0.04, e), lerp(py + 0.22, py + 0.02, e), lerp(pz + 1.85, pz + 0.35, e));
    out.yaw = lerp(0.42, 0.38, t);
    out.pitch = lerp(1.05, -0.15, e);
    out.roll = 0;
    out.spread = lerp(0.06, 1.15, e);
    out.beat = 0;
    out.talon = 1;
    out.chest = lerp(0.1, 0.35, t);
    out.scale = lerp(1.55, 1.12, e);
    return;
  }
  const t = (u - 0.9) / 0.1;
  const e = easeOut(t);
  out.pos.set(lerp(px + 0.04, px, e), lerp(py + 0.02, py, e), lerp(pz + 0.35, pz, e));
  out.yaw = 0.38;
  out.pitch = lerp(-0.15, 0.08, t);
  out.roll = 0;
  out.spread = lerp(1.15, 0.85, t);
  out.beat = 0;
  out.talon = lerp(1, 0.35, t);
  out.chest = lerp(0.35, 0.55, t);
  out.scale = lerp(1.12, 1, t);
}

function OwlMesh({
  mobile,
  reduced,
  delay,
  onImpact,
}: {
  mobile: boolean;
  reduced: boolean;
  delay: number;
  onImpact?: () => void;
}) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  const talL = useRef<THREE.Group>(null!);
  const talR = useRef<THREE.Group>(null!);
  const lidL = useRef<THREE.Mesh>(null!);
  const lidR = useRef<THREE.Mesh>(null!);
  const t0 = useRef<number | null>(null);
  const hit = useRef(false);
  const burst = useRef(0);
  const shake = useRef(0);
  const snapT = useRef(1.4);
  const snap = useRef({ x: 0.04, y: 0.12 });
  const narrowAt = useRef(2.2);
  const flexAt = useRef(3.6);
  const look = useRef({ x: 0.04, y: 0.1 });
  const hunt = useRef<Hunt>({
    pos: new THREE.Vector3(),
    pitch: 0,
    yaw: 0,
    roll: 0,
    spread: 0,
    beat: 0,
    talon: 0,
    chest: 0,
    scale: 1,
  });
  const pointer = useRef({ x: 0, y: 0 });
  const { camera } = useThree();
  const cam0 = useMemo(() => new THREE.Vector3(0.12, 0.04, 4.2), []);

  const perch = useMemo(() => new THREE.Vector3(mobile ? 0.18 : 0.58, mobile ? -0.08 : -0.4, 0), [mobile]);
  const segs = mobile ? 7 : 12;

  useEffect(() => {
    const on = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    if (!mobile) window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [mobile]);

  useFrame((state, delta) => {
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - t0.current;
    const flyT = reduced ? 1 : clamp01((elapsed - delay) / HUNT);
    const flying = flyT < 1;
    const idleT = Math.max(0, elapsed - delay - HUNT);
    const h = hunt.current;

    if (reduced) {
      h.pos.copy(perch);
      h.pitch = 0.08;
      h.yaw = 0.4;
      h.roll = 0;
      h.spread = 0.12;
      h.beat = 0;
      h.talon = 0.2;
      h.chest = 0.15;
      h.scale = 1;
    } else if (flying) {
      huntAt(flyT, perch, h);
    } else if (idleT < DOM) {
      const t = idleT / DOM;
      h.pos.copy(perch);
      h.pitch = 0.06;
      h.yaw = 0.4;
      h.roll = 0;
      h.spread = lerp(0.85, 0.55, t);
      h.beat = 0;
      h.talon = 0.22;
      h.chest = lerp(0.55, 0.42, t);
      h.scale = 1;
    } else if (idleT < DOM + FOLD) {
      const t = (idleT - DOM) / FOLD;
      h.pos.copy(perch);
      h.pitch = 0.07;
      h.yaw = 0.4;
      h.roll = 0;
      h.spread = lerp(0.55, 0.12, easeInOut(t));
      h.beat = 0;
      h.talon = 0.2;
      h.chest = lerp(0.42, 0.18, t);
      h.scale = 1;
    } else {
      h.pos.copy(perch);
      h.pitch = 0.07;
      h.yaw = 0.4;
      h.roll = 0;
      h.spread = 0.12;
      h.beat = 0;
      h.talon = 0.2;
      h.chest = 0.18;
      h.scale = 1;
    }

    if (!reduced && flying && flyT >= 0.9 && !hit.current) {
      hit.current = true;
      shake.current = 1;
      burst.current = 0.001;
      onImpact?.();
    }
    if (burst.current > 0) burst.current += delta;
    shake.current = Math.max(0, shake.current - delta * 3.4);
    const sh = shake.current;
    camera.position.set(
      cam0.x + Math.sin(elapsed * 47) * sh * 0.09,
      cam0.y + Math.cos(elapsed * 39) * sh * 0.07,
      cam0.z,
    );

    root.current.position.copy(h.pos);
    root.current.rotation.set(h.pitch, h.yaw, h.roll);
    root.current.scale.setScalar((mobile ? 1.05 : 1.28) * h.scale);
    body.current.position.y = h.chest * 0.04;
    body.current.rotation.x = -h.chest * 0.18;

    let flex = 0;
    if (!reduced && !flying && idleT > flexAt.current && idleT < flexAt.current + 0.35) {
      flex = Math.sin(((idleT - flexAt.current) / 0.35) * Math.PI) * 0.55;
    } else if (!reduced && !flying && idleT > flexAt.current + 0.35) {
      flexAt.current = idleT + 3.2 + Math.random() * 3.5;
    }

    const sp = h.spread;
    const bt = h.beat;
    left.current.rotation.set(-0.12 + (1 - sp) * 0.72, 0.08 + (1 - sp) * 1.22, -0.06 - bt - flex);
    right.current.rotation.set(-0.12 + (1 - sp) * 0.72, -(0.08 + (1 - sp) * 1.22), 0.06 + bt + flex);
    left.current.scale.set(0.14 + sp * 0.96, 1, 1);
    right.current.scale.set(0.14 + sp * 0.96, 1, 1);

    const kick = h.talon;
    talL.current.rotation.set(-0.15 - kick * 1.15, 0, 0.08);
    talR.current.rotation.set(-0.15 - kick * 1.15, 0, -0.08);
    talL.current.position.z = 0.04 + kick * 0.16;
    talR.current.position.z = 0.04 + kick * 0.16;

    if (!reduced && !flying) {
      if (mobile) {
        if (idleT > snapT.current) {
          snap.current.y = (Math.random() > 0.5 ? 1 : -1) * (0.25 + Math.random() * 0.35);
          snap.current.x = (Math.random() - 0.5) * 0.18;
          snapT.current = idleT + 1.1 + Math.random() * 1.8;
        }
        look.current.y = THREE.MathUtils.damp(look.current.y, snap.current.y, 8, delta);
        look.current.x = THREE.MathUtils.damp(look.current.x, snap.current.x, 8, delta);
      } else {
        const tx = -pointer.current.y * 0.22;
        const ty = pointer.current.x * 0.62;
        if (idleT > snapT.current) {
          snap.current.y = ty + (Math.random() - 0.5) * 0.55;
          snap.current.x = tx + (Math.random() - 0.5) * 0.16;
          snapT.current = idleT + 1.4 + Math.random() * 2.2;
        }
        const snapping = idleT < snapT.current - 1.15;
        look.current.y = THREE.MathUtils.damp(look.current.y, snapping ? snap.current.y : ty, snapping ? 10 : 3.2, delta);
        look.current.x = THREE.MathUtils.damp(look.current.x, snapping ? snap.current.x : tx, snapping ? 10 : 3.2, delta);
      }
    } else if (flying) {
      look.current.x = THREE.MathUtils.damp(look.current.x, 0.18, 4, delta);
      look.current.y = THREE.MathUtils.damp(look.current.y, 0.0, 4, delta);
    }
    head.current.rotation.y = reduced ? 0.08 : look.current.y;
    head.current.rotation.x = reduced ? 0.05 : look.current.x;

    let lid = 0.02;
    if (!reduced) {
      const clock = flying ? elapsed : idleT;
      if (clock > narrowAt.current && clock < narrowAt.current + 0.7) {
        const n = (clock - narrowAt.current) / 0.7;
        lid = Math.sin(n * Math.PI) * 0.085;
      } else if (clock > narrowAt.current + 0.7) {
        narrowAt.current = clock + 2.8 + Math.random() * 3.4;
      }
    }
    for (const el of [lidL.current, lidR.current]) {
      el.position.y = 0.055 - lid * 0.22;
      el.rotation.x = 0.35 + lid * 1.6;
    }
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh scale={[0.78, 1.12, 0.72]} position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.26, segs, segs]} />
          <Feather color={BODY} />
        </mesh>
        <mesh scale={[0.58, 0.62, 0.34]} position={[0, -0.04, 0.12]}>
          <sphereGeometry args={[0.22, segs, segs]} />
          <Feather color={DOWN} />
        </mesh>
        {([-0.12, 0.12] as const).map((x) =>
          [0, 1, 2].map((i) => (
            <mesh key={`${x}-${i}`} position={[x * 0.7, 0.02 - i * 0.07, -0.14]} rotation={[0.4, x > 0 ? 0.2 : -0.2, x > 0 ? 0.3 : -0.3]}>
              <boxGeometry args={[0.1, 0.025, 0.08]} />
              <Feather color={EDGE} />
            </mesh>
          )),
        )}
        <group ref={head} position={[0, 0.26, 0.07]}>
          <mesh scale={[1.05, 0.72, 0.86]}>
            <sphereGeometry args={[0.2, segs, segs]} />
            <Feather color={BODY} />
          </mesh>
          <mesh position={[0, 0.07, 0.15]} rotation={[0.65, 0, 0]} scale={[1.2, 0.18, 0.7]}>
            <boxGeometry args={[0.2, 0.07, 0.12]} />
            <Feather color={EDGE} />
          </mesh>
          <mesh position={[-0.055, 0.062, 0.185]} rotation={[0.25, 0.25, 0.72]}>
            <boxGeometry args={[0.16, 0.032, 0.07]} />
            <Feather color={EDGE} />
          </mesh>
          <mesh position={[0.055, 0.062, 0.185]} rotation={[0.25, -0.25, -0.72]}>
            <boxGeometry args={[0.16, 0.032, 0.07]} />
            <Feather color={EDGE} />
          </mesh>
          <mesh position={[-0.07, -0.01, 0.155]} rotation={[0.2, -0.55, 0.2]} scale={[0.9, 0.85, 0.2]}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <Feather color={DISC} />
          </mesh>
          <mesh position={[0.07, -0.01, 0.155]} rotation={[0.2, 0.55, -0.2]} scale={[0.9, 0.85, 0.2]}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <Feather color={DISC} />
          </mesh>
          <Eye x={-0.048} />
          <Eye x={0.048} />
          <mesh ref={lidL} position={[-0.048, 0.048, 0.2]} rotation={[0.45, 0, 0.12]} scale={[0.5, 1, 1]}>
            <sphereGeometry args={[0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
            <Feather color={EDGE} />
          </mesh>
          <mesh ref={lidR} position={[0.048, 0.048, 0.2]} rotation={[0.45, 0, -0.12]} scale={[0.5, 1, 1]}>
            <sphereGeometry args={[0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
            <Feather color={EDGE} />
          </mesh>
          <mesh position={[0, -0.04, 0.235]} rotation={[0.95, 0, 0]}>
            <coneGeometry args={[0.042, 0.145, 5]} />
            <meshStandardMaterial color={BEAK} roughness={0.3} metalness={0.32} />
          </mesh>
          <mesh position={[0, -0.085, 0.292]} rotation={[2.55, 0, 0]}>
            <coneGeometry args={[0.02, 0.07, 4]} />
            <meshStandardMaterial color={BEAK} roughness={0.28} metalness={0.34} />
          </mesh>
          <mesh position={[-0.115, 0.22, -0.01]} rotation={[0.02, 0.15, -0.32]} scale={[0.28, 1.55, 0.16]}>
            <coneGeometry args={[0.065, 0.26, 4]} />
            <Feather color={EDGE} />
          </mesh>
          <mesh position={[0.115, 0.22, -0.01]} rotation={[0.02, -0.15, 0.32]} scale={[0.28, 1.55, 0.16]}>
            <coneGeometry args={[0.065, 0.26, 4]} />
            <Feather color={EDGE} />
          </mesh>
        </group>
        <Wing side={-1} group={left} simple={mobile} />
        <Wing side={1} group={right} simple={mobile} />
        <mesh position={[0, -0.12, -0.22]} rotation={[0.7, 0, 0]} scale={[0.7, 0.14, 1.1]}>
          <boxGeometry args={[0.16, 0.05, 0.18]} />
          <Feather color={EDGE} />
        </mesh>
        <Talon x={-0.08} group={talL} />
        <Talon x={0.08} group={talR} />
        <Smoke burst={burst} simple={mobile} />
      </group>
    </group>
  );
}

function Lights({ mobile }: { mobile: boolean }) {
  return (
    <>
      <hemisphereLight args={["#8a8074", "#140608", 0.35]} />
      <directionalLight position={[-2.2, 2.4, 3.2]} intensity={1.15} color="#d8cfc0" />
      <directionalLight position={[2.6, 0.4, -2.0]} intensity={mobile ? 1.1 : 1.65} color="#e01820" />
      <pointLight position={[0.1, 0.15, 1.4]} intensity={0.55} color={RED} distance={3.2} />
    </>
  );
}

export function OwlScene({
  active,
  reduced,
  mobile,
  onImpact,
}: {
  active: boolean;
  reduced: boolean;
  mobile: boolean;
  onImpact?: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={mobile ? ([1, 1] as [number, number]) : OWL_DPR}
      gl={{ antialias: !mobile, powerPreference: "high-performance", alpha: true }}
      style={{ pointerEvents: "none" }}
      camera={{ position: [0.12, 0.04, 4.2], fov: 32 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden
    >
      <Lights mobile={mobile} />
      <OwlMesh mobile={mobile} reduced={reduced} delay={reduced ? 0 : 0.1} onImpact={onImpact} />
    </Canvas>
  );
}
