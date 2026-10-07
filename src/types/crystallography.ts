/**
 * Types & data structures for Cristallo3D
 * University crystallography & solid state chemistry curriculum (PEIP)
 */

export type ActiveTab =
  | 'cube_symmetry'
  | 'miller_planes'
  | 'bravais_systems'
  | 'cell_counting'
  | 'packings_and_sites'
  | 'figures_planes'
  | 'td_quiz';

export type BravaisMode = 'P' | 'I' | 'F' | 'C';

export interface CrystalSystemInfo {
  id: string;
  name: string;
  symbol: string;
  cellDesc: string;
  anglesDesc: string;
  allowedBravais: BravaisMode[];
  symmetryElements: string;
  defaultParams: {
    a: number;
    b: number;
    c: number;
    alpha: number; // in degrees
    beta: number;
    gamma: number;
  };
  explanation: string;
}

export interface SymmetryElement {
  id: string;
  name: string;
  type: 'A4' | 'A3' | 'A2' | 'A6' | 'm4' | 'm2' | 'C';
  description: string;
  color: string;
  axisOrNormal?: [number, number, number];
  point?: [number, number, number];
  angle?: number; // rotation in degrees
}

export interface InterstitialSite {
  type: 'C' | 'O' | 'T';
  name: string;
  coordination: number;
  ratioFormula: string;
  maxRatio: number; // r/R
  example: string;
  description: string;
  color: string;
}

export interface CrystalStructureModel {
  id: string;
  name: string;
  formula: string;
  system: string;
  bravaisMode: string;
  zCount: number; // nb of formula units per cell
  coordination: string;
  compacityFormula?: string;
  compacityValue?: number;
  description: string;
  atoms: Array<{
    element: string;
    pos: [number, number, number];
    role: string; // 'Sommet' | 'Arête' | 'Face' | 'Centre' | 'Site T' | 'Site O'
    contribution: number;
    color: string;
    radius: number;
  }>;
  cations?: string;
  anions?: string;
}

export interface TDQuizQuestion {
  id: string;
  exercise: string;
  question: string;
  context?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  formulaDetail?: string;
}
