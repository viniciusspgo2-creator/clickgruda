/* Cerâmica procedural. Todas as medidas estão em cm (escala normalizada × 5).
 * A Clássica tem parede cilíndrica, lábio contínuo e fundo cerâmico rebaixado.
 * O Lathe gira um perfil de raio CONSTANTE; usar Lathe não implica conicidade.
 */
import * as THREE from "three";
import { MUG, V_EXT, V_INT, texV, type PrintArea } from "../lib/config";

type P = [number, number];
export type CeramicProfile =
  | "classic"
  | "square"
  | "cone"
  | "beer"
  | "latte"
  | "tea";

function arcPoints(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  n: number,
): P[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

export function profileRadius(model: CeramicProfile, t: number): number {
  const u = THREE.MathUtils.clamp(t, 0, 1);
  switch (model) {
    case "cone":
      return 3.08 + 1.12 * u;
    case "beer":
      return 4.28 + 0.26 * Math.pow(u, 3);
    case "latte":
      return 3.0 + 1.88 * Math.pow(u, 0.93);
    case "tea":
      return 4.06 + 0.75 * u;
    default:
      return MUG.topOuterR;
  }
}

/** Centro do fundo elevado, anel de apoio, chanfro, parede, lábio e cavidade. */
function bodyProfile(model: CeramicProfile): {
  pts: P[];
  iExterior0: number;
  iLip0: number;
} {
  const baseR = profileRadius(model, 0);
  const ringOuter = baseR - MUG.baseBevel;
  const ringInner = ringOuter - MUG.footWidth;
  const dishR = ringInner - 0.12;
  const pts: P[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push([dishR * t, MUG.footH - 0.04 * t * t]);
  }
  // Ombro arredondado até o anel de apoio (sem um disco plano colado ao corpo).
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const e = t * t * (3 - 2 * t);
    pts.push([dishR + 0.12 * t, (MUG.footH - 0.04) * (1 - e)]);
  }
  pts.push([ringOuter, 0]);
  // O apoio e o fundo não recebem estampa. A face externa do chanfro sim.
  const iExterior0 = pts.length;
  pts.push([ringOuter, 0]);
  const bevel = arcPoints(
    ringOuter,
    MUG.baseBevel,
    MUG.baseBevel,
    -Math.PI / 2,
    0,
    16,
  );
  pts.push(...bevel.slice(1));
  const rimR = (MUG.topOuterR - MUG.innerR) / 2;
  const rimY = MUG.height - rimR;
  for (const y of [0.4, 0.9, 1.6, 3.2, 4.775, 6, 8.7, rimY]) {
    pts.push([
      profileRadius(model, (y - MUG.baseBevel) / (rimY - MUG.baseBevel)),
      y,
    ]);
  }
  const topR = profileRadius(model, 1);
  // A estampa acompanha a metade externa do lábio até o topo exato.
  // A metade interna tem sua própria costura UV e continua limpa.
  pts.push(
    ...arcPoints(
      topR - rimR,
      rimY,
      rimR,
      0,
      Math.PI / 2,
      MUG.rimSegments / 2,
    ).slice(1),
  );
  const iLip0 = pts.length;
  pts.push([topR - rimR, MUG.height]); // duplicated apex separates artwork from interior
  pts.push(
    ...arcPoints(
      topR - rimR,
      rimY,
      rimR,
      Math.PI / 2,
      Math.PI,
      MUG.rimSegments / 2,
    ).slice(1),
  );
  const cornerR = 0.38;
  for (const y of [8.4, 6, 3.4, 1.7, MUG.innerFloorY + cornerR]) {
    pts.push([
      profileRadius(model, (y - MUG.baseBevel) / (rimY - MUG.baseBevel)) -
        rimR * 2,
      y,
    ]);
  }
  const insideR = baseR - rimR * 2;
  pts.push(
    ...arcPoints(
      insideR - cornerR,
      MUG.innerFloorY + cornerR,
      cornerR,
      0,
      -Math.PI / 2,
      16,
    ).slice(1),
  );
  pts.push(
    [insideR * 0.6, MUG.innerFloorY],
    [insideR * 0.3, MUG.innerFloorY],
    [0, MUG.innerFloorY],
  );
  return { pts, iExterior0, iLip0 };
}

/** UVs separados conservam normais contínuas nas costuras da cerâmica. */
export function smoothBodyNormals(geo: THREE.BufferGeometry): void {
  const p = geo.getAttribute("position"),
    n = geo.getAttribute("normal");
  const groups = new Map<
    string,
    { normal: THREE.Vector3; indices: number[] }
  >();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(5)},${p.getY(i).toFixed(5)},${p.getZ(i).toFixed(5)}`;
    let group = groups.get(key);
    if (!group) {
      group = { normal: new THREE.Vector3(), indices: [] };
      groups.set(key, group);
    }
    group.normal.add(new THREE.Vector3().fromBufferAttribute(n, i));
    group.indices.push(i);
  }
  for (const { normal, indices } of groups.values()) {
    if (indices.length < 2) continue;
    normal.normalize();
    for (const i of indices) n.setXYZ(i, normal.x, normal.y, normal.z);
  }
  n.needsUpdate = true;
}

export function buildMugBodyGeometry(
  _area?: PrintArea,
  model: CeramicProfile = "classic",
): THREE.BufferGeometry {
  const { pts, iExterior0, iLip0 } = bodyProfile(model);
  const geo = new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    MUG.segments,
  );
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  for (let k = 0; k < pos.count; k++) {
    const j = k % pts.length;
    uv.setXY(
      k,
      uv.getX(k) + 0.5,
      j < iExterior0 ? V_EXT : j < iLip0 ? texV(pos.getY(k)) : V_INT,
    );
  }
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  smoothBodyNormals(geo);
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

// A alça nasce DENTRO da espessura da parede, sem entrar na cavidade.
// As pontas alargadas fazem parte da mesma malha da alça, sem calços brancos.
const HANDLE_POINTS = [
  [0, 7.45, -3.89],
  [0, 7.45, -4.45],
  [0, 7.74, -5.25],
  [0, 7.18, -6.25],
  [0, 5.35, -6.62],
  [0, 3.55, -6.25],
  [0, 2.48, -5.25],
  [0, 2.3, -4.45],
  [0, 2.3, -3.89],
];
const getHandleCurve = () =>
  new THREE.CatmullRomCurve3(
    HANDLE_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    "centripetal",
  );
export const HANDLE_A_X = 0.66;
export const HANDLE_B_N = 0.52;
export function handleExtentR(): number {
  return 7.2;
}

export function buildHandleGeometry(): THREE.BufferGeometry {
  const curve = getHandleCurve();
  const tubular = 144,
    radial = 40,
    ring = radial + 1;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const X = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const perp = new THREE.Vector3().crossVectors(X, tangent).normalize();
    // Fillet da barbotina: alargamento suave em ambas as soldas, sem toros.
    const weld =
      1 +
      0.72 *
        (Math.exp(-Math.pow(t / 0.12, 2)) +
          Math.exp(-Math.pow((1 - t) / 0.12, 2)));
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      // Superelipse arredondada, ligeiramente mais larga na face externa.
      const ca = Math.cos(a),
        sa = Math.sin(a);
      const ox =
        Math.sign(ca) * Math.pow(Math.abs(ca), 0.85) * HANDLE_A_X * weld;
      const on =
        Math.sign(sa) * Math.pow(Math.abs(sa), 0.9) * HANDLE_B_N * weld;
      positions.push(
        center.x + ox,
        center.y + perp.y * on,
        center.z + perp.z * on,
      );
      uvs.push(j / radial, t);
    }
  }
  for (let i = 0; i < tubular; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * ring + j,
        b = a + ring;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const p = geo.getAttribute("position"),
    n = geo.getAttribute("normal");
  const normal = new THREE.Vector3(),
    ceramicNormal = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    // Fecha a costura da seção sem uma linha de brilho longitudinal.
    const a = i * ring,
      b = a + radial;
    normal
      .fromBufferAttribute(n, a)
      .add(new THREE.Vector3().fromBufferAttribute(n, b))
      .normalize();
    n.setXYZ(a, normal.x, normal.y, normal.z);
    n.setXYZ(b, normal.x, normal.y, normal.z);
  }
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getZ(i));
    const blend =
      1 - THREE.MathUtils.smoothstep(r - MUG.topOuterR, 0.015, 0.32);
    if (blend > 0) {
      ceramicNormal.set(p.getX(i), 0, p.getZ(i)).normalize();
      normal.fromBufferAttribute(n, i).lerp(ceramicNormal, blend).normalize();
      n.setXYZ(i, normal.x, normal.y, normal.z);
    }
  }
  n.needsUpdate = true;
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/** Decalque inferior segue o prato côncavo; não flutua dentro da caneca. */
export function buildBasePrintGeometry(
  model: CeramicProfile = "classic",
): THREE.BufferGeometry {
  const radius = profileRadius(model, 0) - MUG.baseBevel - MUG.footWidth - 0.12;
  const rings = 24,
    segments = 128;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= rings; i++)
    for (let j = 0; j <= segments; j++) {
      const t = i / rings,
        a = (j / segments) * Math.PI * 2;
      const x = Math.cos(a) * radius * t,
        z = Math.sin(a) * radius * t;
      positions.push(x, MUG.footH - 0.04 * t * t - 0.003, z);
      uvs.push(0.5 + x / radius / 2, 0.5 + z / radius / 2);
    }
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j,
        b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Pedestal redondo premium com bordas arredondadas (bevel) — usado no
 * modo de chão "Podium". O raio acompanha o tamanho do grupo de canecas.
 */
export function buildPedestalGeometry(
  radius: number,
  height: number,
): THREE.BufferGeometry {
  const bev = Math.min(0.24, height * 0.3, radius * 0.12);
  const r = Math.max(3, radius);
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0001, 0),
    new THREE.Vector2(r * 0.86, 0),
    new THREE.Vector2(r - bev * 0.4, 0.02),
    new THREE.Vector2(r, bev),
    new THREE.Vector2(r, height - bev),
    new THREE.Vector2(r - bev, height),
    new THREE.Vector2(0.0001, height),
  ];
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

/** prato redondo de cerâmica (base redonda) */
export function buildRoundPlateGeometry(
  radius: number,
  height: number,
): THREE.BufferGeometry {
  const bev = Math.min(0.22, height * 0.35);
  const r = Math.max(4.5, radius);
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0001, 0),
    new THREE.Vector2(r * 0.9, 0),
    new THREE.Vector2(r - bev * 0.35, 0.015),
    new THREE.Vector2(r, bev),
    new THREE.Vector2(r, height - bev * 0.4),
    new THREE.Vector2(r - bev * 0.4, height),
    new THREE.Vector2(0.0001, height),
  ];
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

/** placa quadrada com cantos arredondados (base quadrada) */
export function buildSquarePlateGeometry(
  size: number,
  height: number,
): THREE.BufferGeometry {
  const half = Math.max(5, size) / 2;
  const bev = Math.min(0.28, height * 0.42);
  const shape = new THREE.Shape();
  const r = Math.min(bev, half * 0.2);
  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.quadraticCurveTo(half, -half, half, -half + r);
  shape.lineTo(half, half - r);
  shape.quadraticCurveTo(half, half, half - r, half);
  shape.lineTo(-half + r, half);
  shape.quadraticCurveTo(-half, half, -half, half - r);
  shape.lineTo(-half, -half + r);
  shape.quadraticCurveTo(-half, -half, -half + r, -half);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.05, height - bev * 2),
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.rotateX(-Math.PI / 2); // deita a placa (extrusão é em +Z)
  // normaliza: assenta no chão (y: 0..height) e centra em XZ
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(
    -((bb.max.x + bb.min.x) / 2),
    -bb.min.y,
    -((bb.max.z + bb.min.z) / 2),
  );
  geo.computeVertexNormals();
  return geo;
}
