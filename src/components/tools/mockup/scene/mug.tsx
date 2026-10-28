/* eslint-disable react-hooks/immutability -- Three.js GPU handles and transforms intentionally use the engine's imperative API. */
"use client";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import {
  useMockupStore,
  type ArtState,
  type MugState,
  type CompanionMug,
} from "../state/store";
import { createCeramicMaterial } from "./ceramic-material";
import { buildModel, supportHeight } from "./model-geometry";
import { getArtImage } from "../lib/art-registry";
import {
  makeArtTexture,
  renderArtCanvas,
  canvasHeightFor,
  renderMetalMask,
} from "../lib/art-canvas";
import { NEUTRAL_ADJUSTMENTS } from "../lib/art-adjustments";
import { MUG, FLOAT_LIFT, PEDESTAL_H, PLATE_H, detectMobile } from "../lib/config";
import { studioRefs } from "./studio-refs";

function CeramicMaterial({ texture, mug, metalMask, color }: {
  texture?: THREE.Texture;
  mug: MugState;
  metalMask?: THREE.Texture;
  color?: THREE.ColorRepresentation;
}) {
  const material = useMemo(() => createCeramicMaterial(mug, { map: texture, metalMask, color }),
    [texture, metalMask, color, mug.roughness, mug.clearcoat, mug.reflection, mug.faithfulColor,
      mug.clearcoatRoughness, mug.specularIntensity, mug.glazeStrength]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}
function MugObject({
  id,
  mug,
  art,
  showArt = true,
  spinClock,
}: {
  id: string;
  mug: MugState;
  art: ArtState;
  showArt?: boolean;
  spinClock: RefObject<number>;
}) {
  const gl = useThree((s) => s.gl);
  const floor = useMockupStore((s) => s.bg.floor);
  const float = useMockupStore((s) => s.bg.floatAnim);
  const selected = useMockupStore((s) => s.selectedIds.includes(id));
  const tool = useMockupStore((s) => s.tool);
  const snap = useMockupStore((s) => s.snapEnabled);
  const compare = useMockupStore((s) => s.compareArt);
  const [object, setObject] = useState<THREE.Group | null>(null);
  const spinStart = useRef(0);
  const spinBase = useRef<number | null>(null);
  const sceneCamera = useMockupStore(s => s.camera);
  const entryGroup = useRef<THREE.Group>(null);
  const dragArt = useRef<{ x: number; y: number; art: ArtState } | null>(null);
  const startPose = useRef<THREE.Vector3 | null>(null);
  const initialized = useRef(false);
  const entranceStart = useRef<number | null>(null);
  const model = useMemo(() => buildModel(mug.model), [mug.model]);
  useEffect(
    () => () => {
      model.body.dispose();
      model.handle.dispose();
      model.basePrint.dispose();
    },
    [model],
  );
  const outline = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
          8.5,
          model.def.height,
          model.def.hasHandle ? 11.3 : 8.5,
        ),
      ),
    [model],
  );
  useEffect(() => () => outline.dispose(), [outline]);
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = detectMobile() ? 1536 : 2560;
    c.height = canvasHeightFor(c.width, undefined, mug.model);
    return c;
  }, [mug.model]);
  const texture = useMemo(
    () => makeArtTexture(canvas, gl.capabilities.getMaxAnisotropy()),
    [canvas, gl],
  );
  const metalMask = useMemo(() => {
    if (!art.metallic) return undefined;
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    renderMetalMask(c, art);
    const texture = new THREE.CanvasTexture(c);
    texture.wrapS = THREE.RepeatWrapping;
    texture.colorSpace = THREE.NoColorSpace;
    return texture;
  }, [art, canvas]);
  useEffect(() => () => metalMask?.dispose(), [metalMask]);
  const baseTexture = useMemo(() => {
    const entry = getArtImage(art.baseImageId ?? null);
    if (!entry) return null;
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = mug.baseColor ?? mug.bodyColor;
    ctx.fillRect(0, 0, 1024, 1024);
    const scale = Math.min(1024 / entry.width, 1024 / entry.height);
    const w = entry.width * scale,
      h = entry.height * scale;
    ctx.drawImage(entry.source, (1024 - w) / 2, (1024 - h) / 2, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [art.baseImageId, mug.baseColor, mug.bodyColor]);
  useEffect(() => () => baseTexture?.dispose(), [baseTexture]);
  const effective = useMemo(
    () => ({
      ...art,
      ...(compare ? NEUTRAL_ADJUSTMENTS : {}),
      ...(!showArt ? { imageId: null, text: "" } : {}),
    }),
    [art, compare, showArt],
  );
  useEffect(() => {
    renderArtCanvas(canvas, effective, mug);
    texture.needsUpdate = true;
  }, [canvas, effective, mug, texture]);
  useEffect(() => {
    const restored = () => {
      renderArtCanvas(canvas, effective, mug);
      texture.needsUpdate = true;
    };
    gl.domElement.addEventListener("webglcontextrestored", restored);
    return () =>
      gl.domElement.removeEventListener("webglcontextrestored", restored);
  }, [gl, canvas, texture, effective, mug]);
  useEffect(() => () => texture.dispose(), [texture]);
  const rotation = useMemo(
    () =>
      new THREE.Euler(
        THREE.MathUtils.degToRad(mug.tiltX ?? 0),
        THREE.MathUtils.degToRad(-mug.rotationY),
        THREE.MathUtils.degToRad(mug.tiltZ ?? 0),
      ),
    [mug.tiltX, mug.rotationY, mug.tiltZ],
  );
  const support = useMemo(
    () =>
      supportHeight(model.body, model.handle, rotation, model.def.hasHandle) *
      mug.scale,
    [model, rotation, mug.scale],
  );
  const base =
    (floor === "pedestal"
      ? PEDESTAL_H
      : floor.startsWith("base-")
        ? PLATE_H
        : floor === "flutuante"
          ? FLOAT_LIFT
          : 0) + (mug.posY ?? 0);
  useFrame(({ clock }) => {
    if (!object) return;
    if (!studioRefs.exporting) {
      if (sceneCamera.autoRotate) {
        const phase = spinClock.current / Math.max(3, sceneCamera.secondsPerTurn ?? 8);
        const travel = sceneCamera.direction === "pingpong"
          ? (1 - Math.cos(phase * Math.PI * 2)) * Math.PI
          : phase * Math.PI * 2 * (sceneCamera.direction === "left" ? -1 : 1);
        if (spinBase.current === null) {
          spinBase.current = object.rotation.y;
          spinStart.current = travel;
        }
        object.rotation.y = spinBase.current - (travel - spinStart.current);
      } else if (spinBase.current !== null) {
        // Pause is a real pause: retain the visible pose and persist it once.
        // The next play starts from this angle instead of jumping to the start.
        const paused = THREE.MathUtils.euclideanModulo(-THREE.MathUtils.radToDeg(object.rotation.y), 360);
        spinBase.current = null;
        useMockupStore.getState().patchObject(id, { rotationY: paused });
      }
    }
    if (!initialized.current) {
      initialized.current = true;
      entranceStart.current = clock.elapsedTime;
    }
    if (entryGroup.current) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const t =
        reduced || studioRefs.exporting
          ? 1
          : Math.min(
              1,
              (clock.elapsedTime - (entranceStart.current ?? 0)) / 1.25,
            );
      const e = 1 - Math.pow(1 - t, 3);
      entryGroup.current.position.y = (1 - e) * 5;
      entryGroup.current.rotation.y = (1 - e) * -0.75;
      entryGroup.current.scale.setScalar(0.82 + 0.18 * e);
    }
    if (
      !studioRefs.exporting &&
      floor === "flutuante" &&
      float &&
      tool === "select"
    )
      object.position.y =
        base + support + Math.sin(clock.elapsedTime * 1.35) * 0.18;
    if (studioRefs.artRefreshFrames && !studioRefs.exporting) {
      renderArtCanvas(canvas, effective, mug);
      texture.needsUpdate = true;
      if (id === "hero") studioRefs.artRefreshFrames--;
    }
  });
  const click = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (tool === "pan") return;
    useMockupStore.getState().select(id, e.shiftKey || e.ctrlKey || e.metaKey);
  };
  const startArt = (e: ThreeEvent<PointerEvent>) => {
    click(e);
    if (tool !== "art" || mug.locked) return;
    dragArt.current = { x: e.clientX, y: e.clientY, art };
    gl.domElement.setPointerCapture(e.pointerId);
    if (studioRefs.controls) studioRefs.controls.enabled = false;
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragArt.current;
      if (!d) return;
      useMockupStore
        .getState()
        .patchObjectArt(id, {
          offsetX: d.art.offsetX + (e.clientX - d.x) / 500,
          offsetY: d.art.offsetY - (e.clientY - d.y) / 250,
        });
    };
    const end = () => {
      dragArt.current = null;
      if (studioRefs.controls) studioRefs.controls.enabled = true;
    };
    gl.domElement.addEventListener("pointermove", move);
    gl.domElement.addEventListener("pointerup", end);
    return () => {
      gl.domElement.removeEventListener("pointermove", move);
      gl.domElement.removeEventListener("pointerup", end);
    };
  }, [gl, id]);
  const handle = mug.handleColor ?? (mug.variant === "white" ? "#ffffff" : mug.accentColor);
  return (
    <>
      <group
        ref={setObject}
        name="mug-float"
        visible={!mug.hidden}
        position={[mug.posX ?? 0, base + support, mug.posZ ?? 0]}
        rotation={rotation}
        scale={mug.scale}
        userData={{ baseY: base + support, objectId: id }}
        onPointerDown={startArt}
        onDoubleClick={(e) => {
          e.stopPropagation();
          useMockupStore.getState().requestFocus();
        }}
      >
        {selected && tool !== "select" && !mug.hidden && !mug.locked && (
          <lineSegments
            name="selection-outline"
            geometry={outline}
            position={[
              0,
              model.def.height / 2 - MUG.height / 2,
              model.def.hasHandle ? -1.2 : 0,
            ]}
          >
            <lineBasicMaterial
              color="#ff8654"
              transparent
              opacity={0.25}
              depthTest={false}
            />
          </lineSegments>
        )}
        <group ref={entryGroup} name="mug-entrance">
          <group position={[0, -MUG.height / 2, 0]}>
            <mesh
              geometry={model.body}
              castShadow
              receiveShadow
              name={id === "hero" ? "mug-body" : "mug-body-comp"}
              userData={{ objectId: id }}
            >
              <CeramicMaterial
                texture={texture}
                mug={mug}
                metalMask={metalMask}
              />
            </mesh>
            {baseTexture && (
              <mesh geometry={model.basePrint} rotation={[0, ((art.baseRotation ?? 0) * Math.PI) / 180, 0]}
                receiveShadow name="mug-base-print">
                <CeramicMaterial texture={baseTexture} mug={mug} />
              </mesh>
            )}
            {model.def.hasHandle && (
              <mesh geometry={model.handle} castShadow receiveShadow name="mug-handle" userData={{ objectId: id }}>
                <CeramicMaterial color={handle} mug={mug} />
              </mesh>
            )}

          </group>
        </group>
      </group>
      {object &&
        selected &&
        !mug.hidden &&
        !mug.locked &&
        ["move", "rotate", "scale"].includes(tool) && (
          <TransformControls
            object={object}
            mode={
              tool === "move"
                ? "translate"
                : tool === "rotate"
                  ? "rotate"
                  : "scale"
            }
            size={0.8}
            name="studio-gizmo"
            translationSnap={snap ? 0.5 : undefined}
            rotationSnap={snap ? Math.PI / 12 : undefined}
            scaleSnap={snap ? 0.05 : undefined}
            onMouseDown={() => {
              startPose.current = object.position.clone();
            }}
            onMouseUp={() => {
              const st = useMockupStore.getState();
              const delta = object.position
                .clone()
                .sub(startPose.current ?? object.position);
              st.patchObject(id, {
                posX: object.position.x,
                posZ: object.position.z,
                posY: (mug.posY ?? 0) + delta.y,
                tiltX: THREE.MathUtils.radToDeg(object.rotation.x),
                rotationY: -THREE.MathUtils.radToDeg(object.rotation.y),
                tiltZ: THREE.MathUtils.radToDeg(object.rotation.z),
                scale: Math.max(0.2, Math.min(3, object.scale.x)),
              });
              if (tool === "move")
                for (const other of st.selectedIds.filter((x) => x !== id)) {
                  const o =
                    other === "hero"
                      ? st.mug
                      : st.companions.find((c) => c.id === other);
                  if (o)
                    st.patchObject(other, {
                      posX: (o.posX ?? 0) + delta.x,
                      posY: (o.posY ?? 0) + delta.y,
                      posZ: (o.posZ ?? 0) + delta.z,
                    });
                }
            }}
          />
        )}
    </>
  );
}
export function Mug() {
  const art = useMockupStore((s) => s.art),
    mug = useMockupStore((s) => s.mug),
    companions = useMockupStore((s) => s.companions);
  // Um relógio compartilhado mantém todas as canecas no mesmo ritmo,
  // inclusive no vai e volta; exportações não avançam esse relógio.
  const spinClock = useRef(0);
  const rotating = useMockupStore(s => s.camera.autoRotate);
  useFrame((_, delta) => {
    if (studioRefs.exporting) return;
    spinClock.current = rotating ? spinClock.current + delta : 0;
  }, -1); // Antes de TODAS as peças, mesmo das montadas depois da principal.
  return (
    <group name="mockup-mugs">
      <MugObject id="hero" mug={mug} art={art} spinClock={spinClock} />
      {companions.map((c) => (
        <MugObject
          key={c.id}
          id={c.id}
          spinClock={spinClock}
          mug={
            {
              ...mug,
              ...c,
              model: c.model ?? mug.model,
              tiltX: c.tiltX ?? 0,
              tiltZ: c.tiltZ ?? 0,
              posY: c.posY ?? 0,
              hidden: c.hidden ?? false,
              locked: c.locked ?? false,
            } as MugState
          }
          art={c.art ?? art}
          showArt={c.showArt}
        />
      ))}
    </group>
  );
}
