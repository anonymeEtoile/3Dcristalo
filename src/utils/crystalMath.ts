import * as THREE from 'three';
import { CrystalSystemInfo } from '../types/crystallography';

/**
 * Crystallographic math & geometry helpers
 */

// Converts cell parameters (a, b, c, alpha, beta, gamma in degrees) to basis vectors
export function getLatticeVectors(
  a: number,
  b: number,
  c: number,
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number
): { va: THREE.Vector3; vb: THREE.Vector3; vc: THREE.Vector3 } {
  const alpha = (alphaDeg * Math.PI) / 180;
  const beta = (betaDeg * Math.PI) / 180;
  const gamma = (gammaDeg * Math.PI) / 180;

  const va = new THREE.Vector3(a, 0, 0);

  const bx = b * Math.cos(gamma);
  const by = b * Math.sin(gamma);
  const vb = new THREE.Vector3(bx, by, 0);

  const cx = c * Math.cos(beta);
  const cy = (c * (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma))) / Math.sin(gamma);
  const term =
    1 -
    Math.cos(alpha) * Math.cos(alpha) -
    Math.cos(beta) * Math.cos(beta) -
    Math.cos(gamma) * Math.cos(gamma) +
    2 * Math.cos(alpha) * Math.cos(beta) * Math.cos(gamma);
  const cz = (c * Math.sqrt(Math.max(0, term))) / Math.sin(gamma);
  const vc = new THREE.Vector3(cx, cy, cz);

  return { va, vb, vc };
}

// Compute unit cell vertices from basis vectors, centered around origin or corner
export function getCellCorners(
  va: THREE.Vector3,
  vb: THREE.Vector3,
  vc: THREE.Vector3,
  centered: boolean = true
): THREE.Vector3[] {
  const corners: THREE.Vector3[] = [];
  const shift = centered
    ? new THREE.Vector3()
        .add(va)
        .add(vb)
        .add(vc)
        .multiplyScalar(-0.5)
    : new THREE.Vector3(0, 0, 0);

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        const p = new THREE.Vector3()
          .addScaledVector(va, i)
          .addScaledVector(vb, j)
          .addScaledVector(vc, k)
          .add(shift);
        corners.push(p);
      }
    }
  }
  return corners;
}

// Edges connecting the 8 corners: 000, 001, 010, 011, 100, 101, 110, 111
export const CUBE_EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], // parallel to c
  [0, 2], [1, 3], [4, 6], [5, 7], // parallel to b
  [0, 4], [1, 5], [2, 6], [3, 7], // parallel to a
];

// Calculate interreticular distance d_hkl for cubic system
export function calculateD_hklCubic(a: number, h: number, k: number, l: number): number {
  const sq = h * h + k * k + l * l;
  if (sq === 0) return 0;
  return a / Math.sqrt(sq);
}

// Calculate interreticular distance d_hkl for orthorhombic / tetragonal
export function calculateD_hklOrtho(
  a: number,
  b: number,
  c: number,
  h: number,
  k: number,
  l: number
): number {
  const invD2 = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
  if (invD2 <= 0) return 0;
  return 1 / Math.sqrt(invD2);
}

// Intersect a plane (h*u + k*v + l*w = D) with unit cell [0,1]^3 and return polygon in real 3D space
export function intersectMillerPlaneWithCell(
  h: number,
  k: number,
  l: number,
  D: number, // plane equation level
  va: THREE.Vector3,
  vb: THREE.Vector3,
  vc: THREE.Vector3,
  centerShift: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3[] {
  // 12 edges in fractional coordinates [u, v, w]
  // [startPoint, directionAxis, endAxisVal]
  const edgesFractional: Array<{ p0: [number, number, number]; dir: [number, number, number] }> = [
    // 4 edges along u (dir = [1,0,0])
    { p0: [0, 0, 0], dir: [1, 0, 0] },
    { p0: [0, 1, 0], dir: [1, 0, 0] },
    { p0: [0, 0, 1], dir: [1, 0, 0] },
    { p0: [0, 1, 1], dir: [1, 0, 0] },
    // 4 edges along v (dir = [0,1,0])
    { p0: [0, 0, 0], dir: [0, 1, 0] },
    { p0: [1, 0, 0], dir: [0, 1, 0] },
    { p0: [0, 0, 1], dir: [0, 1, 0] },
    { p0: [1, 0, 1], dir: [0, 1, 0] },
    // 4 edges along w (dir = [0,0,1])
    { p0: [0, 0, 0], dir: [0, 0, 1] },
    { p0: [1, 0, 0], dir: [0, 0, 1] },
    { p0: [0, 1, 0], dir: [0, 0, 1] },
    { p0: [1, 1, 0], dir: [0, 0, 1] },
  ];

  const intersections: THREE.Vector3[] = [];
  const fracPoints: Array<[number, number, number]> = [];

  for (const edge of edgesFractional) {
    const denom = h * edge.dir[0] + k * edge.dir[1] + l * edge.dir[2];
    if (Math.abs(denom) < 1e-6) continue; // parallel

    const t = (D - (h * edge.p0[0] + k * edge.p0[1] + l * edge.p0[2])) / denom;
    if (t >= -1e-4 && t <= 1.0001) {
      const u = edge.p0[0] + edge.dir[0] * t;
      const v = edge.p0[1] + edge.dir[1] * t;
      const w = edge.p0[2] + edge.dir[2] * t;

      // Ensure no duplicate points
      const already = fracPoints.some(
        (fp) => Math.hypot(fp[0] - u, fp[1] - v, fp[2] - w) < 1e-4
      );
      if (!already) {
        fracPoints.push([u, v, w]);
        const pt = new THREE.Vector3()
          .addScaledVector(va, u)
          .addScaledVector(vb, v)
          .addScaledVector(vc, w)
          .add(centerShift);
        intersections.push(pt);
      }
    }
  }

  if (intersections.length < 3) return [];

  // Sort polygon vertices around center of mass
  const center = new THREE.Vector3();
  intersections.forEach((pt) => center.add(pt));
  center.divideScalar(intersections.length);

  // Normal vector in Cartesian space: n = h*b*c + ... or cross products
  // Normal of plane: grad(h*u + k*v + l*w)
  const normal = new THREE.Vector3(h, k, l).normalize();
  // Find two orthogonal basis vectors in the plane
  let tangent = new THREE.Vector3(1, 0, 0);
  if (Math.abs(normal.dot(tangent)) > 0.9) {
    tangent = new THREE.Vector3(0, 1, 0);
  }
  const uVec = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  const vVec = new THREE.Vector3().crossVectors(normal, uVec).normalize();

  intersections.sort((p1, p2) => {
    const d1 = new THREE.Vector3().subVectors(p1, center);
    const d2 = new THREE.Vector3().subVectors(p2, center);
    const angle1 = Math.atan2(d1.dot(vVec), d1.dot(uVec));
    const angle2 = Math.atan2(d2.dot(vVec), d2.dot(uVec));
    return angle1 - angle2;
  });

  return intersections;
}

// 7 Crystal Systems definitions as per lecture course (Slides 10-12)
export const CRYSTAL_SYSTEMS: CrystalSystemInfo[] = [
  {
    id: 'cubic',
    name: 'Cubique',
    symbol: 'c',
    cellDesc: 'a = b = c',
    anglesDesc: 'α = β = γ = 90°',
    allowedBravais: ['P', 'I', 'F'],
    symmetryElements: '3 A4, 4 A3, 6 A2, 3 m4, 6 m2, C (Oh)',
    defaultParams: { a: 2, b: 2, c: 2, alpha: 90, beta: 90, gamma: 90 },
    explanation:
      'Haute symétrie. Les 4 axes A3 le long des diagonales imposent l\'équivalence des trois axes x, y, z. Le mode base-centrée C est interdit car il briserait cette symétrie A3 !',
  },
  {
    id: 'tetragonal',
    name: 'Quadratique (Tétragonal)',
    symbol: 'q',
    cellDesc: 'a = b ≠ c',
    anglesDesc: 'α = β = γ = 90°',
    allowedBravais: ['P', 'I'],
    symmetryElements: '1 A4, 2 A2, 2 A\'2, 1 m4, 2 m2, 2 m\'2, C',
    defaultParams: { a: 2, b: 2, c: 2.8, alpha: 90, beta: 90, gamma: 90 },
    explanation:
      'Un prisme droit à base carrée. Le mode C est interdit car il est géométriquement équivalent à une maille P plus petite tournée de 45° ! Les modes F se ramènent à I.',
  },
  {
    id: 'orthorhombic',
    name: 'Orthorhombique',
    symbol: 'o',
    cellDesc: 'a ≠ b ≠ c',
    anglesDesc: 'α = β = γ = 90°',
    allowedBravais: ['P', 'I', 'F', 'C'],
    symmetryElements: '3 A\'2, 3 m\'2, C',
    defaultParams: { a: 1.8, b: 2.4, c: 3.0, alpha: 90, beta: 90, gamma: 90 },
    explanation:
      'Prisme droit à base rectangle. C\'est le SEUL système cristallin qui admet les 4 modes de Bravais (P, I, F, C), totalisant 4 réseaux !',
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal',
    symbol: 'h',
    cellDesc: 'a = b ≠ c',
    anglesDesc: 'α = β = 90°, γ = 120°',
    allowedBravais: ['P'],
    symmetryElements: '1 A6, 3 A2, 3 A\'2, 1 m6, 3 m2, 3 m\'2, C',
    defaultParams: { a: 2.0, b: 2.0, c: 3.2, alpha: 90, beta: 90, gamma: 120 },
    explanation:
      'Prisme à base losange 60°/120° ou prisme hexagonal complet. Admet uniquement le mode simple P.',
  },
  {
    id: 'rhombohedral',
    name: 'Rhomboédrique (Trigonal)',
    symbol: 'r',
    cellDesc: 'a = b = c',
    anglesDesc: 'α = β = γ ≠ 90°',
    allowedBravais: ['P'],
    symmetryElements: '1 A3, 3 A2, 3 m2, C',
    defaultParams: { a: 2.2, b: 2.2, c: 2.2, alpha: 70, beta: 70, gamma: 70 },
    explanation:
      'Polyèdre à faces losanges identiques (cube étiré ou comprimé selon sa diagonale A3). 1 seul réseau de Bravais R (souvent noté P).',
  },
  {
    id: 'monoclinic',
    name: 'Monoclinique',
    symbol: 'm',
    cellDesc: 'a ≠ b ≠ c',
    anglesDesc: 'α = γ = 90°, β ≠ 90°',
    allowedBravais: ['P', 'C'],
    symmetryElements: '1 A\'2, 1 m\'2, C',
    defaultParams: { a: 2.0, b: 2.5, c: 2.2, alpha: 90, beta: 105, gamma: 90 },
    explanation:
      'Prisme droit à base parallélogramme. Admet 2 réseaux de Bravais : P et C (base-centrée).',
  },
  {
    id: 'triclinic',
    name: 'Triclinique',
    symbol: 'a',
    cellDesc: 'a ≠ b ≠ c',
    anglesDesc: 'α ≠ β ≠ γ ≠ 90°',
    allowedBravais: ['P'],
    symmetryElements: 'Centre C uniquement (ou 1)',
    defaultParams: { a: 2.0, b: 2.4, c: 2.2, alpha: 80, beta: 100, gamma: 75 },
    explanation:
      'Le système de symétrie la plus basse : un parallélépipède quelconque sans aucun angle droit. Uniquement le mode P (1 réseau).',
  },
];
