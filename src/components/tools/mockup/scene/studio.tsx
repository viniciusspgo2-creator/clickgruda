/* ============================================================
   Estúdio: iluminação (Environment + Lightformers + luzes reais),
   fundos (branco puro, escuro, gradiente, cor, imagem, sem fundo),
   chão (contínuo / flutuante / pedestal / espelhado) e sombras que
   crescem junto com o grupo de canecas.
   ============================================================ */

"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useMockupStore } from "../state/store";
import {
  FLOAT_LIFT,
  LIGHT_PRESETS,
  PEDESTAL_H,
  PLATE_H,
  detectMobile,
  groupFootprint,
  kelvinToRgb,
} from "../lib/config";
import { getEnvironment } from "../lib/environment-registry";
import { getBackgroundAvg } from "../lib/background-registry";
import {
  buildPedestalGeometry,
  buildRoundPlateGeometry,
  buildSquarePlateGeometry,
} from "./mug-geometry";
import { studioRefs } from "./studio-refs";

let rectAreaReady = false;
function ensureRectArea() {
  if (!rectAreaReady) {
    RectAreaLightUniformsLib.init();
    rectAreaReady = true;
  }
}

const rgbCss = ([r, g, b]: [number, number, number]) =>
  `rgb(${Math.round(Math.min(1, r / kelvinToRgb(6500)[0]) * 255)},${Math.round(Math.min(1, g / kelvinToRgb(6500)[1]) * 255)},${Math.round(Math.min(1, b / kelvinToRgb(6500)[2]) * 255)})`;

/* ---------------- Luzes ---------------- */

export function StudioLights() {
  const light = useMockupStore((s) => s.light);
  const castShadow = useMockupStore((s) => s.bg.castShadow);
  const bg = useMockupStore((s) => s.bg);
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const mobile = useMemo(() => detectMobile(), []);
  const preset =
    LIGHT_PRESETS.find((p) => p.id === light.preset) ?? LIGHT_PRESETS[0];
  ensureRectArea();

  // a câmera de sombra cresce junto com o grupo (nunca corta a sombra)
  const extent = groupFootprint(companions, mugScale);

  const keyPos = useMemo(() => {
    const [x, y, z] = preset.keyDir;
    const a = THREE.MathUtils.degToRad(light.rotation);
    return new THREE.Vector3(x, y, z).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      a,
    );
  }, [preset.keyDir, light.rotation]);

  const keyColor = useMemo(
    () => rgbCss(kelvinToRgb(preset.keyTemp + light.temperature)),
    [preset, light.temperature],
  );
  const fillColor = useMemo(
    () => rgbCss(kelvinToRgb(preset.fillTemp + light.temperature)),
    [preset, light.temperature],
  );
  const rimColor = useMemo(
    () => rgbCss(kelvinToRgb(preset.rimTemp + light.temperature)),
    [preset, light.temperature],
  );

  // "Combinar luz com o fundo": tinge o ambiente com a cor média da foto
  const matchAvg =
    bg.type === "image" && bg.matchLight ? getBackgroundAvg(bg.imageId) : null;

  // Environment reconstruído apenas em mudanças discretas (preset/rotação grossa)
  const hdr = getEnvironment(light.hdriId)?.texture;
  const envKey = `${preset.id}-${Math.round(light.rotation / 6) * 6}-${Math.round(light.intensity * 10)}-${light.temperature}`;

  return (
    <>
      <ambientLight
        intensity={(matchAvg ? 0.26 : 0.18) * (light.ambientStrength ?? 1)}
        color={matchAvg ? rgbCss(matchAvg) : "#ffffff"}
      />
      {/* luz chave com sombra suave */}
      <directionalLight
        position={keyPos.toArray()}
        intensity={
          preset.keyInt * light.intensity * 1.4 * (light.keyStrength ?? 1)
        }
        color={keyColor}
        castShadow={castShadow}
        shadow-mapSize-width={mobile ? 1024 : 2048}
        shadow-mapSize-height={mobile ? 1024 : 2048}
        shadow-radius={20 + light.softness * 80}
        shadow-blurSamples={12}
        shadow-bias={-0.0001}
        shadow-normalBias={0.015}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-extent, extent, extent * 1.35 + 4, -2.4, 0.5, 90]}
        />
      </directionalLight>
      {/* preenchimento */}
      <directionalLight
        position={[keyPos.x * -0.9, 7, keyPos.z * 0.6]}
        intensity={
          preset.fillInt * light.intensity * 1.1 * (light.fillStrength ?? 1)
        }
        color={fillColor}
      />
      {/* recorte (rim) atrás */}
      <directionalLight
        position={[keyPos.x * 0.4, 9, keyPos.z * -1.4]}
        intensity={
          preset.rimInt * light.intensity * 0.8 * (light.rimStrength ?? 1)
        }
        color={rimColor}
      />
      {/* softbox retangular real — reflexo de janela na porcelana */}
      <rectAreaLight
        position={[keyPos.x * 0.7, 8.5, keyPos.z * 0.9 + 2]}
        width={7}
        height={10}
        intensity={
          preset.keyInt * light.intensity * 0.7 * (light.keyStrength ?? 1)
        }
        color={keyColor}
        onUpdate={(self) => self.lookAt(0, 4.5, 0)}
      />

      {/* ambiente de estúdio procedural (softboxes refletem no verniz) */}
      {hdr ? (
        <Environment
          map={hdr}
          environmentIntensity={light.envIntensity * 0.7}
          background={false}
        />
      ) : (
        <Environment
          key={envKey}
          resolution={mobile ? 512 : 1024}
          frames={1}
          background={false}
          environmentIntensity={light.envIntensity * 0.7}
        >
          <group
            rotation={[
              0,
              THREE.MathUtils.degToRad(Math.round(light.rotation / 6) * 6),
              0,
            ]}
          >
            {/* Faixa fotográfica vertical: torna o verniz legível sobre a arte. */}
            <Lightformer
              form="rect"
              intensity={3.5 * preset.env * light.intensity}
              color="#ffffff"
              position={[-6, 4, 5]}
              scale={[1.1, 9, 1]}
              target={[0, 4, 0]}
            />
            {/* softbox principal */}
            <Lightformer
              form="rect"
              intensity={2.6 * preset.env * light.intensity}
              color={keyColor}
              position={[-4, 6, 7]}
              scale={[9, 6, 1]}
              target={[0, 3.5, 0]}
            />
            {/* preenchedor vertical */}
            <Lightformer
              form="rect"
              intensity={1.1 * preset.env * light.intensity}
              color={fillColor}
              position={[7, 4, 2]}
              scale={[4, 9, 1]}
              target={[0, 3.5, 0]}
            />
            {/* recorte traseiro */}
            <Lightformer
              form="rect"
              intensity={1.8 * preset.env * light.intensity}
              color={rimColor}
              position={[-2, 7, -8]}
              scale={[10, 3, 1]}
              target={[0, 4, 0]}
            />
            {/* teto suave */}
            <Lightformer
              form="rect"
              intensity={1.5 * preset.env * light.intensity}
              color="#ffffff"
              position={[0, 11, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[12, 12, 1]}
            />
            {/* faixa de chão clara (luz refletida) */}
            <Lightformer
              form="rect"
              intensity={0.7 * preset.env * light.intensity}
              color="#ffffff"
              position={[0, -0.5, 4]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[10, 8, 1]}
            />
          </group>
        </Environment>
      )}
    </>
  );
}

/* ---------------- Fundo ---------------- */

const backdropVert = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backdropFrag = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uDir;
  varying vec3 vPos;
  void main() {
    vec3 d = normalize(vPos);
    float t = clamp(dot(d, normalize(uDir)) * 0.5 + 0.5, 0.0, 1.0);
    t = smoothstep(0.08, 0.92, t);
    vec3 col = mix(uB, uA, t);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Converte hex para o espaço que o shader escreve direto no framebuffer
 * (sRGB) — SEM conversão para linear, senão o branco sai queimado/bege.
 */
function hexToVecRaw(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function Backdrop() {
  const bg = useMockupStore((s) => s.bg);

  const { uA, uB, uDir } = useMemo(() => {
    let a = "#ffffff";
    let b = "#ffffff";
    let dirAngleDeg = 90;
    if (bg.type === "studio-white") {
      // branco PURO de ponta a ponta (padrão)
      a = "#ffffff";
      b = "#ffffff";
      dirAngleDeg = 90;
    } else if (bg.type === "studio-dark") {
      a = "#2b2721";
      b = "#060505";
      dirAngleDeg = 90;
    } else if (bg.type === "gradient") {
      a = bg.colorA;
      b = bg.colorB;
      dirAngleDeg = bg.angle;
    } else if (bg.type === "solid") {
      a = bg.colorB;
      b = bg.colorB;
    }
    const aRad = THREE.MathUtils.degToRad(dirAngleDeg);
    const dir = new THREE.Vector3(
      Math.cos(aRad) * 0.45,
      1,
      Math.sin(aRad) * 0.45,
    ).normalize();
    return { uA: a, uB: b, uDir: dir };
  }, [bg]);

  const uniforms = {
    uA: { value: hexToVecRaw(uA) },
    uB: { value: hexToVecRaw(uB) },
    uDir: { value: uDir },
  };

  if (bg.type === "transparent" || bg.type === "image") return null;

  return (
    <>
      <mesh name="backdrop" scale={70}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial
          vertexShader={backdropVert}
          fragmentShader={backdropFrag}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {(bg.type === "studio-dark" || bg.type === "solid") &&
      bg.glow === true ? (
        <GlowBoard />
      ) : null}
    </>
  );
}

/** brilho suave atrás da caneca — OPCIONAL (ligado no painel Cena) */
function GlowBoard() {
  const tex = useMemo(() => {
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,178,128,0.55)");
    g.addColorStop(0.45, "rgba(232,112,58,0.18)");
    g.addColorStop(1, "rgba(232,112,58,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh name="glowboard" position={[0, 6, -28]}>
      <planeGeometry args={[38, 26]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ---------------- Chão + sombras ---------------- */

/** textura radial suave (usada na sombra difusa do modo flutuante) */
function makeBlobTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(24,16,10,0.85)");
  g.addColorStop(0.5, "rgba(24,16,10,0.38)");
  g.addColorStop(1, "rgba(24,16,10,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

/** sombra suave no ar (modo flutuante) — mais difusa e fraca quanto mais alta */
export function FloatShadows() {
  const floor = useMockupStore((s) => s.bg.floor);
  const companions = useMockupStore((s) => s.companions);
  const mug = useMockupStore((s) => s.mug);
  const mugPosY = mug.posY;
  const mugScale = useMockupStore((s) => s.mug.scale);
  const tex = useMemo(() => makeBlobTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  if (floor !== "flutuante") return null;

  const mugs = [
    {
      x: mug.posX ?? 0,
      z: mug.posZ ?? 0,
      lift: FLOAT_LIFT + mugPosY,
      scale: mugScale,
    },
    ...companions
      .filter((c) => !c.hidden)
      .map((c) => ({ x: c.posX, z: c.posZ, lift: FLOAT_LIFT, scale: c.scale })),
  ];

  return (
    <group name="float-shadow">
      {mugs.map((m, i) => {
        const soft = 1 + m.lift * 0.16;
        const opacity = Math.max(0.14, 0.5 / (1 + m.lift * 0.4));
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[m.x, 0.02, m.z]}
            scale={11 * m.scale * soft}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={tex}
              transparent
              opacity={opacity}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** plano gigante que só recebe sombra — some contra o fundo em qualquer ângulo */
function ShadowCatcher() {
  return (
    <mesh
      name="ground"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[90, 90]} />
      <shadowMaterial transparent opacity={0.09} />
    </mesh>
  );
}

/** pedestal redondo premium com bevel — acompanha o tamanho do grupo */
function Pedestal() {
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);
  const radius = useMemo(
    () =>
      Math.min(30, Math.max(8.5, groupFootprint(companions, mugScale) - 0.6)),
    [companions, mugScale],
  );
  const geo = useMemo(
    () => buildPedestalGeometry(radius, PEDESTAL_H),
    [radius],
  );
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group name="pedestal">
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#241c15"
          roughness={0.32}
          metalness={0.08}
          clearcoat={0.85}
          clearcoatRoughness={0.24}
          envMapIntensity={0.4 + envIntensity * 0.5}
        />
      </mesh>
      <ShadowCatcher />
    </group>
  );
}

/** prato redondo de cerâmica clara (base redonda) */
function RoundPlate() {
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);
  const radius = useMemo(
    () =>
      Math.min(28, Math.max(7.4, groupFootprint(companions, mugScale) - 1.6)),
    [companions, mugScale],
  );
  const geo = useMemo(() => buildRoundPlateGeometry(radius, PLATE_H), [radius]);
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group name="pedestal">
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#edeae4"
          roughness={0.28}
          metalness={0.02}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          envMapIntensity={0.45 + envIntensity * 0.55}
        />
      </mesh>
      <ShadowCatcher />
    </group>
  );
}

/** placa quadrada com cantos arredondados (base quadrada — look premium) */
function SquarePlate() {
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);
  const size = useMemo(
    () =>
      Math.min(
        52,
        Math.max(15, (groupFootprint(companions, mugScale) - 1.2) * 2),
      ),
    [companions, mugScale],
  );
  const geo = useMemo(() => buildSquarePlateGeometry(size, PLATE_H), [size]);
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group name="pedestal">
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e7e2da"
          roughness={0.3}
          metalness={0.03}
          clearcoat={0.75}
          clearcoatRoughness={0.22}
          envMapIntensity={0.45 + envIntensity * 0.55}
        />
      </mesh>
      <ShadowCatcher />
    </group>
  );
}

/** piso espelhado com reflexo suave (fallback leve no celular) */
function MirrorFloor() {
  const bg = useMockupStore((s) => s.bg);
  const mobile = useMemo(() => detectMobile(), []);
  const color = useMemo(() => {
    switch (bg.type) {
      case "studio-white":
        return "#f4f2ee";
      case "studio-dark":
        return "#100e0c";
      case "solid":
      case "gradient":
        return bg.colorB;
      default:
        return "#191715";
    }
  }, [bg]);

  return (
    <mesh
      name="ground"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[90, 90]} />
      <MeshReflectorMaterial
        resolution={mobile ? 512 : 1024}
        blur={[mobile ? 200 : 320, mobile ? 60 : 100]}
        mixBlur={0.9}
        mixStrength={mobile ? 1.7 : 3}
        roughness={0.86}
        depthScale={1.1}
        minDepthThreshold={0.9}
        maxDepthThreshold={1.3}
        color={color}
        metalness={0.35}
        mirror={0.55}
      />
    </mesh>
  );
}

export function Ground() {
  const bg = useMockupStore((s) => s.bg);
  const floor = bg.floor ?? "continuo";

  if (floor === "flutuante") return null; // sombras ficam por conta do FloatShadows
  if (floor === "pedestal") return <Pedestal />;
  if (floor === "base-redonda") return <RoundPlate />;
  if (floor === "base-quadrada") return <SquarePlate />;
  if (floor === "espelhado") return <MirrorFloor />;

  // contínuo (padrão): só receptor de sombra — o fundo (branco puro,
  // gradiente, cor sólida ou imagem) aparece por trás sem nenhuma borda
  return <ShadowCatcher />;
}

export function StudioContactShadows() {
  const bg = useMockupStore((s) => s.bg);
  const softness = useMockupStore((s) => s.light.softness);
  const shadowOpacity = useMockupStore((s) => s.light.shadowOpacity);
  const shadowColor = useMockupStore((s) => s.light.shadowColor);
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const mobile = useMemo(() => detectMobile(), []);
  const floor = bg.floor ?? "continuo";
  if (!bg.contactShadow || floor === "flutuante") return null;
  const extent = groupFootprint(companions, mugScale);
  const topY =
    floor === "pedestal"
      ? PEDESTAL_H + 0.002
      : floor === "base-redonda" || floor === "base-quadrada"
        ? PLATE_H + 0.002
        : 0.002;
  return (
    <group name="studio-contact-shadows">
      <ContactShadows
        position={[0, topY + 0.001, 0]}
        opacity={(shadowOpacity ?? 0.44) * 0.8}
        scale={Math.min(64, extent * 2.2)}
        blur={0.7 + softness * 0.6}
        far={0.8}
        resolution={mobile ? 512 : 1024}
        color={shadowColor ?? "#242424"}
        frames={Infinity}
      />
      <ContactShadows
        position={[0, topY, 0]}
        opacity={(shadowOpacity ?? 0.44) * 0.6}
        scale={Math.min(64, extent * 2.2)}
        blur={2.2 + softness * 2.4}
        far={4.2}
        resolution={mobile ? 512 : 1024}
        color={shadowColor ?? "#242424"}
        frames={Infinity}
      />
    </group>
  );
}

/* ---------------- util: tempo para animação de flutuar ---------------- */

/** fase estável por id (cada caneca sobe e desce fora de sincronia) */
export function floatPhaseFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return (h / 1000) * Math.PI * 2;
}

/** hook de referência mutável usada pelo mug.tsx para o sobe-e-desce */
export function useFloatClock() {
  const ref = useRef(0);
  useFrame(({ clock }) => {
    ref.current = clock.elapsedTime;
  });
  return ref;
}

/** reexpõe refs para o mug (evita import cíclico do studioRefs na cena) */
export { studioRefs };
