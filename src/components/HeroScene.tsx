// Hero particle portrait: the crew photo sampled into a noisy point cloud (a nod to the
// "noisy radiance field / 3DGS portrait" look) that tears apart under the cursor or finger.
// The soft round point sprite + depth fade is adapted from pmndrs/examples
// "gpgpu-curl-noise-dof" (MIT, © 2024 Poimandres); the image sampling, duotone,
// pointer tear and floaters are new.
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { DPR } from "../lib/hooks";

const vertex = /* glsl */ `
  attribute float aLum;
  attribute float aRand;
  uniform float uTime;
  uniform float uSize;
  uniform vec2 uMouse;
  uniform float uForce;
  uniform float uScatter;
  uniform float uIntro;
  varying float vLum;
  varying float vAlpha;
  varying float vHot;

  void main() {
    vec3 pos = position;
    // intro: fly in from a loose cloud
    vec3 dir = normalize(vec3(sin(aRand * 91.0), cos(aRand * 57.0), sin(aRand * 33.0) * 0.6));
    float intro = 1.0 - smoothstep(0.0, 1.0, clamp(uIntro * 1.4 - aRand * 0.4, 0.0, 1.0));
    pos += dir * intro * 6.0;

    // constant shimmer: unstable radiance-field geometry
    float n = sin(uTime * 1.3 + aRand * 60.0 + pos.y * 3.0) * cos(uTime * 0.9 + pos.x * 2.0);
    pos.z += n * 0.06 * (0.4 + aRand);
    pos.x += sin(uTime * 0.7 + aRand * 40.0) * 0.006;

    // pointer tear
    vec2 d = pos.xy - uMouse;
    float r2 = dot(d, d);
    float f = exp(-r2 / 0.09) * uForce;
    vec2 push = normalize(d + 1e-4) * f * (0.55 + aRand * 0.9);
    pos.xy += push;
    pos.z += f * (aRand - 0.25) * 2.4;

    // scroll scatter
    pos += dir * uScatter * (1.5 + aRand * 3.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = uSize * (0.6 + aLum * 0.7 + aRand * 0.3) * (6.0 / dist);
    vLum = aLum;
    vHot = clamp(f * 1.6, 0.0, 1.0);
    vAlpha = (0.22 + aLum * 0.95) * (1.0 - intro) * (1.0 - uScatter * 0.8);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uDark;
  uniform vec3 uRed;
  uniform vec3 uBone;
  varying float vLum;
  varying float vAlpha;
  varying float vHot;
  void main() {
    vec2 c = 2.0 * gl_PointCoord - 1.0;
    float r = dot(c, c);
    if (r > 1.0) discard;
    float soft = 1.0 - smoothstep(0.15, 1.0, r);
    // duotone: shadows -> blood red, highlights -> bone white
    vec3 col = mix(uDark, uRed, smoothstep(0.0, 0.22, vLum));
    col = mix(col, uBone, smoothstep(0.45, 0.85, vLum));
    col = mix(col, uRed * 1.4, vHot * 0.85);
    gl_FragColor = vec4(col, vAlpha * soft);
  }
`;

// dim duotone photo plane behind the points, so faces stay readable while the points shimmer and tear
const plateVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const plateFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uRed;
  varying vec2 vUv;
  void main() {
    float l = texture2D(uMap, vUv).r;
    vec3 col = mix(vec3(0.0), uRed, smoothstep(0.05, 0.6, l));
    col = mix(col, vec3(0.93, 0.9, 0.85), smoothstep(0.65, 1.0, l) * 0.6);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

type Sample = { positions: Float32Array; lum: Float32Array; rand: Float32Array; count: number; aspect: number; img: HTMLImageElement };

function sampleImage(img: HTMLImageElement, cols: number): Sample {
  const aspect = img.naturalHeight / img.naturalWidth;
  const rows = Math.round(cols * aspect);
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const W = 3.0;
  const H = W * aspect;
  const pos: number[] = [];
  const lum: number[] = [];
  const rand: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      let l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      // crush + contrast for a harsh noir look
      { const t = Math.min(1, Math.max(0, (l - 0.05) / 0.55)); l = t * t * (3 - 2 * t); } // smoothstep: lift faces, crush the backdrop
      if (l < 0.03 && Math.random() > 0.06) continue; // keep the blacks mostly empty
      const rr = Math.random();
      const floater = rr > 0.965; // translucent floaters drifting off the surface
      pos.push(
        (x / cols - 0.5) * W + (Math.random() - 0.5) * (W / cols),
        -(y / rows - 0.5) * H + (Math.random() - 0.5) * (H / rows),
        (l - 0.5) * 0.5 + (Math.random() - 0.5) * 0.12 + (floater ? (Math.random() - 0.3) * 2.2 : 0),
      );
      lum.push(floater ? l * 0.6 : l);
      rand.push(rr);
    }
  }
  return {
    positions: new Float32Array(pos),
    lum: new Float32Array(lum),
    rand: new Float32Array(rand),
    count: lum.length,
    aspect,
    img,
  };
}

function Portrait({
  sample,
  scatter,
  reduced,
  layout,
}: {
  sample: Sample;
  scatter: RefObject<number>;
  reduced: boolean;
  layout: { x: number; y: number; scale: number };
}) {
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const group = useRef<THREE.Group>(null!);
  const { viewport, pointer } = useThree();
  const mouse = useRef(new THREE.Vector2(9, 9));
  const lastMove = useRef(0);
  const lastPointer = useRef(new THREE.Vector2());
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sample.positions, 3));
    g.setAttribute("aLum", new THREE.BufferAttribute(sample.lum, 1));
    g.setAttribute("aRand", new THREE.BufferAttribute(sample.rand, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
    return g;
  }, [sample]);
  const plate = useMemo(() => {
    const tex = new THREE.Texture(sample.img);
    tex.needsUpdate = true;
    tex.colorSpace = THREE.NoColorSpace;
    return {
      geo: new THREE.PlaneGeometry(3, 3 * sample.aspect),
      uniforms: { uMap: { value: tex }, uOpacity: { value: 0 }, uRed: { value: new THREE.Color("#b3101a") } },
    };
  }, [sample]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 4 },
      uMouse: { value: new THREE.Vector2(9, 9) },
      uForce: { value: 0 },
      uScatter: { value: 0 },
      uIntro: { value: reduced ? 1 : 0 },
      uDark: { value: new THREE.Color("#2a0204") },
      uRed: { value: new THREE.Color("#d4141c") },
      uBone: { value: new THREE.Color("#efe8dc") },
    }),
    [reduced],
  );
  useFrame((state, delta) => {
    const u = mat.current.uniforms;
    const t = state.clock.elapsedTime;
    u.uTime.value = t;
    u.uIntro.value = Math.min(1, u.uIntro.value + delta * 0.6);
    u.uSize.value = 1.9 * state.viewport.dpr * layout.scale;
    u.uScatter.value = THREE.MathUtils.damp(u.uScatter.value, scatter.current ?? 0, 6, delta);
    plate.uniforms.uOpacity.value = 0.45 * u.uIntro.value * (1 - u.uScatter.value);

    // pointer in portrait-local coordinates; when idle, a "ghost" hand wanders across the face
    if (!pointer.equals(lastPointer.current)) {
      lastPointer.current.copy(pointer);
      lastMove.current = t;
    }
    const idle = t - lastMove.current > 2.5;
    let tx: number, ty: number;
    if (idle) {
      // ghost hand drifts through the lower half (clothes, chair), never parks on a face
      tx = Math.sin(t * 0.45) * 1.15;
      ty = -0.55 + Math.sin(t * 0.31 + 1.0) * 0.5;
    } else {
      tx = ((pointer.x * viewport.width) / 2 - layout.x) / layout.scale;
      ty = ((pointer.y * viewport.height) / 2 - layout.y) / layout.scale;
    }
    mouse.current.x = THREE.MathUtils.damp(mouse.current.x, tx, idle ? 2 : 10, delta);
    mouse.current.y = THREE.MathUtils.damp(mouse.current.y, ty, idle ? 2 : 10, delta);
    u.uMouse.value.copy(mouse.current);
    u.uForce.value = THREE.MathUtils.damp(u.uForce.value, idle ? 0.28 : 0.8, 3, delta);

    if (!reduced) {
      group.current.rotation.y = Math.sin(t * 0.25) * 0.12 + pointer.x * 0.08;
      group.current.rotation.x = -pointer.y * 0.05;
    }
  });
  return (
    <group ref={group} position={[layout.x, layout.y, 0]} scale={layout.scale}>
      <mesh geometry={plate.geo} position={[0, 0, -0.35]}>
        <shaderMaterial vertexShader={plateVertex} fragmentShader={plateFragment} uniforms={plate.uniforms} transparent depthWrite={false} />
      </mesh>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={mat}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Layout({ sample, scatter, reduced, mobile }: { sample: Sample; scatter: RefObject<number>; reduced: boolean; mobile: boolean }) {
  const { viewport } = useThree();
  // fit the portrait: right half on desktop, upper area on phones
  const layout = useMemo(() => {
    const h = 3 * sample.aspect;
    if (mobile) {
      const scale = Math.min((viewport.height * 0.66) / h, (viewport.width * 1.0) / 3);
      return { x: 0, y: viewport.height * 0.5 - (h * scale) / 2 - viewport.height * 0.07, scale };
    }
    const scale = Math.min((viewport.height * 0.86) / h, (viewport.width * 0.46) / 3);
    return { x: viewport.width * 0.21, y: -viewport.height * 0.03, scale };
  }, [viewport.width, viewport.height, sample.aspect, mobile]);
  return <Portrait sample={sample} scatter={scatter} reduced={reduced} layout={layout} />;
}

export function HeroScene({
  image,
  eventSource,
  active,
  reduced,
  mobile,
  scatter,
  onReady,
}: {
  image: string;
  eventSource: RefObject<HTMLElement | null>;
  active: boolean;
  reduced: boolean;
  mobile: boolean;
  scatter: RefObject<number>;
  onReady?: () => void;
}) {
  const [sample, setSample] = useState<Sample | null>(null);
  useEffect(() => {
    const img = new Image();
    img.decoding = "async";
    img.src = image;
    img.onload = () => setSample(sampleImage(img, mobile ? 140 : 260));
  }, [image, mobile]);
  if (!sample) return null;
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={DPR}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      camera={{ position: [0, 0, 6], fov: 40 }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      onCreated={() => requestAnimationFrame(() => onReady?.())}
      aria-hidden
    >
      <Layout sample={sample} scatter={scatter} reduced={reduced} mobile={mobile} />
    </Canvas>
  );
}
