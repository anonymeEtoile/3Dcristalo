import { CrystalStructureModel, TDQuizQuestion, InterstitialSite } from '../types/crystallography';

export const INTERSTITIAL_SITES_DATA: InterstitialSite[] = [
  {
    type: 'C',
    name: 'Site Cubique',
    coordination: 8,
    ratioFormula: 'r/R ≤ √3 - 1 ≈ 0.732',
    maxRatio: 0.732,
    example: 'CsCl (Cs⁺ dans le site cubique des Cl⁻)',
    description:
      'Cavité entourée de 8 anions formant un cube. Le cation est au centre de gravité. Au-dessus de 0.732 (jusqu\'à 1), la coordinence [8] est géométriquement stable.',
    color: '#06b6d4', // cyan
  },
  {
    type: 'O',
    name: 'Site Octaédrique',
    coordination: 6,
    ratioFormula: 'r/R ≤ √2 - 1 ≈ 0.414',
    maxRatio: 0.414,
    example: 'NaCl (Na⁺ dans tous les sites octaédriques du réseau CFC de Cl⁻)',
    description:
      'Cavité entourée de 6 anions formant un octaèdre régulier. Pour 0.414 ≤ r/R < 0.732, le site octaédrique est préféré énergétiquement et géométriquement.',
    color: '#f59e0b', // amber
  },
  {
    type: 'T',
    name: 'Site Tétraédrique',
    coordination: 4,
    ratioFormula: 'r/R ≤ √(3/2) - 1 ≈ 0.225',
    maxRatio: 0.225,
    example: 'ZnS Blende & CaF₂ Fluorine',
    description:
      'Cavité délimitée par 4 anions formant un tétraèdre régulier. Pour 0.225 ≤ r/R < 0.414, le site tétraédrique est la coordinence optimale sans écrasement.',
    color: '#ec4899', // pink
  },
];

// Structures from TD & Course
export const CRYSTAL_STRUCTURES: CrystalStructureModel[] = [
  {
    id: 'cscl',
    name: 'Césium Chlorure (CsCl)',
    formula: 'CsCl',
    system: 'Cubique',
    bravaisMode: 'P (deux réseaux cubiques simples interpénétrés)',
    zCount: 1,
    coordination: 'Cs/Cl = [8], Cl/Cs = [8]',
    compacityFormula: 'C = (4/3 π (R³ + r³)) / a³',
    compacityValue: 0.68,
    description:
      'Réseau cubique simple de Cl⁻ avec un cation Cs⁺ au centre (site cubique [8]). Contact anion-cation sur la grande diagonale : a√3 = 2(R_Cl⁻ + r_Cs⁺).',
    cations: 'Cs⁺ (r = 169 pm)',
    anions: 'Cl⁻ (R = 181 pm, r/R = 0.934 > 0.732 → Site C)',
    atoms: [
      // Cl- at 8 corners
      { element: 'Cl⁻', pos: [0, 0, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      { element: 'Cl⁻', pos: [1, 0, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      { element: 'Cl⁻', pos: [0, 1, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      { element: 'Cl⁻', pos: [1, 1, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      { element: 'Cl⁻', pos: [0, 0, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      { element: 'Cl⁻', pos: [1, 0, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      { element: 'Cl⁻', pos: [0, 1, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      { element: 'Cl⁻', pos: [1, 1, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.26 },
      // Cs+ at center
      { element: 'Cs⁺', pos: [0.5, 0.5, 0.5], role: 'Centre (Site C)', contribution: 1.0, color: '#38bdf8', radius: 0.24 },
    ],
  },
  {
    id: 'nacl',
    name: 'Chlorure de Sodium (NaCl)',
    formula: 'NaCl',
    system: 'Cubique',
    bravaisMode: 'F (CFC)',
    zCount: 4,
    coordination: 'Na/Cl = [6], Cl/Na = [6]',
    compacityFormula: 'C = 4 × (4/3 π (R³ + r³)) / a³',
    compacityValue: 0.67,
    description:
      'Réseau CFC d\'anions Cl⁻ avec les cations Na⁺ occupant la totalité des sites octaédriques (milieux des 12 arêtes et centre de la maille). Contact cation-anion le long d\'une arête : a = 2(R_Cl⁻ + r_Na⁺).',
    cations: 'Na⁺ (r = 97 pm)',
    anions: 'Cl⁻ (R = 181 pm, r/R = 0.536 ∈ [0.414, 0.732] → Site O)',
    atoms: [
      // Cl- at 8 corners + 6 face centers (FCC = 4 Cl-)
      { element: 'Cl⁻', pos: [0, 0, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [1, 0, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0, 1, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [1, 1, 0], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0, 0, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [1, 0, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0, 1, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [1, 1, 1], role: 'Sommet', contribution: 0.125, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0.5, 0.5, 0], role: 'Face', contribution: 0.5, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0.5, 0.5, 1], role: 'Face', contribution: 0.5, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0.5, 0, 0.5], role: 'Face', contribution: 0.5, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0.5, 1, 0.5], role: 'Face', contribution: 0.5, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [0, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#22c55e', radius: 0.25 },
      { element: 'Cl⁻', pos: [1, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#22c55e', radius: 0.25 },
      // Na+ at center + 12 edges (Octahedral sites = 1 + 12*0.25 = 4 Na+)
      { element: 'Na⁺', pos: [0.5, 0.5, 0.5], role: 'Centre (Site O)', contribution: 1.0, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0.5, 0, 0], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0.5, 1, 0], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0.5, 0, 1], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0.5, 1, 1], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0, 0.5, 0], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [1, 0.5, 0], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0, 0.5, 1], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [1, 0.5, 1], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0, 0, 0.5], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [1, 0, 0.5], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [0, 1, 0.5], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
      { element: 'Na⁺', pos: [1, 1, 0.5], role: 'Arête', contribution: 0.25, color: '#f59e0b', radius: 0.17 },
    ],
  },
  {
    id: 'zns_blende',
    name: 'Sphalérite / Blende (ZnS)',
    formula: 'ZnS',
    system: 'Cubique',
    bravaisMode: 'F (CFC)',
    zCount: 4,
    coordination: 'Zn/S = [4], S/Zn = [4]',
    compacityFormula: 'C = 4 × (4/3 π (R³ + r³)) / a³',
    compacityValue: 0.52,
    description:
      'Réseau CFC de S²⁻ avec les cations Zn²⁺ occupant la moitié des sites tétraédriques (4 sites sur 8) disposés en alternance dans les 8 sous-cubes de la maille.',
    cations: 'Zn²⁺ (r = 74 pm)',
    anions: 'S²⁻ (R = 184 pm, r/R = 0.402 ≈ 0.225-0.414 → Site T)',
    atoms: [
      // S2- at FCC positions (8 corners + 6 faces)
      { element: 'S²⁻', pos: [0, 0, 0], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [1, 0, 0], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0, 1, 0], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [1, 1, 0], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0, 0, 1], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [1, 0, 1], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0, 1, 1], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [1, 1, 1], role: 'Sommet', contribution: 0.125, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0.5, 0.5, 0], role: 'Face', contribution: 0.5, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0.5, 0.5, 1], role: 'Face', contribution: 0.5, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0.5, 0, 0.5], role: 'Face', contribution: 0.5, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0.5, 1, 0.5], role: 'Face', contribution: 0.5, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [0, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#eab308', radius: 0.24 },
      { element: 'S²⁻', pos: [1, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#eab308', radius: 0.24 },
      // Zn2+ in 4 tetrahedral sites (1/4, 1/4, 1/4), (3/4, 3/4, 1/4), (3/4, 1/4, 3/4), (1/4, 3/4, 3/4)
      { element: 'Zn²⁺', pos: [0.25, 0.25, 0.25], role: 'Site T', contribution: 1.0, color: '#a855f7', radius: 0.16 },
      { element: 'Zn²⁺', pos: [0.75, 0.75, 0.25], role: 'Site T', contribution: 1.0, color: '#a855f7', radius: 0.16 },
      { element: 'Zn²⁺', pos: [0.75, 0.25, 0.75], role: 'Site T', contribution: 1.0, color: '#a855f7', radius: 0.16 },
      { element: 'Zn²⁺', pos: [0.25, 0.75, 0.75], role: 'Site T', contribution: 1.0, color: '#a855f7', radius: 0.16 },
    ],
  },
  {
    id: 'caf2',
    name: 'Fluorine (CaF₂)',
    formula: 'CaF₂',
    system: 'Cubique',
    bravaisMode: 'F (CFC)',
    zCount: 4,
    coordination: 'Ca/F = [8], F/Ca = [4]',
    compacityFormula: 'C = 4 × (V_Ca + 2 V_F) / a³',
    compacityValue: 0.65,
    description:
      'Réseau CFC de Ca²⁺ avec les anions F⁻ occupant la totalité des 8 sites tétraédriques ! Stoechiométrie 1 : 2 vérifiée : 4 Ca²⁺ et 8 F⁻ par maille.',
    cations: 'Ca²⁺ (FCC, 4 par maille)',
    anions: 'F⁻ (8 sites T occupés, 8 par maille)',
    atoms: [
      // Ca2+ at FCC positions
      { element: 'Ca²⁺', pos: [0, 0, 0], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [1, 0, 0], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0, 1, 0], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [1, 1, 0], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0, 0, 1], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [1, 0, 1], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0, 1, 1], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [1, 1, 1], role: 'Sommet', contribution: 0.125, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0.5, 0.5, 0], role: 'Face', contribution: 0.5, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0.5, 0.5, 1], role: 'Face', contribution: 0.5, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0.5, 0, 0.5], role: 'Face', contribution: 0.5, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0.5, 1, 0.5], role: 'Face', contribution: 0.5, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [0, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#3b82f6', radius: 0.22 },
      { element: 'Ca²⁺', pos: [1, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#3b82f6', radius: 0.22 },
      // F- in ALL 8 tetrahedral sites
      { element: 'F⁻', pos: [0.25, 0.25, 0.25], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
      { element: 'F⁻', pos: [0.75, 0.25, 0.25], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
      { element: 'F⁻', pos: [0.25, 0.75, 0.25], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
      { element: 'F⁻', pos: [0.75, 0.75, 0.25], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
      { element: 'F⁻', pos: [0.25, 0.25, 0.75], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
      { element: 'F⁻', pos: [0.75, 0.25, 0.75], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
      { element: 'F⁻', pos: [0.25, 0.75, 0.75], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
      { element: 'F⁻', pos: [0.75, 0.75, 0.75], role: 'Site T', contribution: 1.0, color: '#06b6d4', radius: 0.16 },
    ],
  },
  {
    id: 'rutile',
    name: 'Rutile (TiO₂) - TD Exercice 3',
    formula: 'TiO₂',
    system: 'Quadratique',
    bravaisMode: 'P',
    zCount: 2,
    coordination: 'Ti/O = [6] (octaèdre), O/Ti = [3] (plan)',
    description:
      'Structure quadratique du pigment blanc (TiO₂). Ti aux 8 sommets (8×1/8 = 1) et au centre (1×1 = 1) → Total Ti = 2. Oxygènes : 2 à l\'intérieur (2×1 = 2) et 4 sur les faces (4×1/2 = 2) → Total O = 4. Formule Ti₂O₄ = 2 TiO₂.',
    atoms: [
      // Ti at 8 vertices
      { element: 'Ti', pos: [0, 0, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      { element: 'Ti', pos: [1, 0, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      { element: 'Ti', pos: [0, 1, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      { element: 'Ti', pos: [1, 1, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      { element: 'Ti', pos: [0, 0, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      { element: 'Ti', pos: [1, 0, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      { element: 'Ti', pos: [0, 1, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      { element: 'Ti', pos: [1, 1, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.22 },
      // Ti at center
      { element: 'Ti', pos: [0.5, 0.5, 0.5], role: 'Centre', contribution: 1.0, color: '#94a3b8', radius: 0.22 },
      // O atoms: 4 on faces + 2 inside
      { element: 'O', pos: [0.3, 0.3, 0], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.7, 0.7, 0], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.3, 0.3, 1], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.7, 0.7, 1], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.2, 0.8, 0.5], role: 'Intérieur', contribution: 1.0, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.8, 0.2, 0.5], role: 'Intérieur', contribution: 1.0, color: '#ef4444', radius: 0.18 },
    ],
  },
  {
    id: 'knbo3',
    name: 'Niobate de potassium (KNbO₃) - TD Ex. 3 (Pérovskite)',
    formula: 'KNbO₃',
    system: 'Cubique',
    bravaisMode: 'P',
    zCount: 1,
    coordination: 'K/O = [12], Nb/O = [6] (octaèdre)',
    description:
      'Structure pérovskite classique. K aux 8 sommets (8×1/8 = 1), Nb au centre du cube (1×1 = 1), O aux 6 centres des faces (6×1/2 = 3). Formule : K₁Nb₁O₃, Z = 1 !',
    atoms: [
      // K at 8 vertices
      { element: 'K', pos: [0, 0, 0], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      { element: 'K', pos: [1, 0, 0], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      { element: 'K', pos: [0, 1, 0], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      { element: 'K', pos: [1, 1, 0], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      { element: 'K', pos: [0, 0, 1], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      { element: 'K', pos: [1, 0, 1], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      { element: 'K', pos: [0, 1, 1], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      { element: 'K', pos: [1, 1, 1], role: 'Sommet', contribution: 0.125, color: '#8b5cf6', radius: 0.26 },
      // Nb at center
      { element: 'Nb', pos: [0.5, 0.5, 0.5], role: 'Centre', contribution: 1.0, color: '#0ea5e9', radius: 0.22 },
      // O at 6 face centers
      { element: 'O', pos: [0.5, 0.5, 0], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.5, 0.5, 1], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.5, 0, 0.5], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0.5, 1, 0.5], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [0, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
      { element: 'O', pos: [1, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#ef4444', radius: 0.18 },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamant de Carbone (C)',
    formula: 'C',
    system: 'Cubique',
    bravaisMode: 'F (CFC + motif biatomique)',
    zCount: 8,
    coordination: 'C/C = [4] (hybridation sp³)',
    compacityFormula: 'C = 8 × (4/3 π R³) / a³ = π√3 / 16',
    compacityValue: 0.34,
    description:
      'Chaque atome de carbone est lié de façon tétraédrique (sp³) à 4 voisins. Réseau CFC (4 atomes) + 4 atomes dans les sites tétraédriques → Total 8 atomes par maille ! Structure très ouverte mais extrêmement rigide.',
    atoms: [
      // 8 FCC corners
      { element: 'C', pos: [0, 0, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [1, 0, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [0, 1, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [1, 1, 0], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [0, 0, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [1, 0, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [0, 1, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [1, 1, 1], role: 'Sommet', contribution: 0.125, color: '#94a3b8', radius: 0.18 },
      // 6 FCC faces
      { element: 'C', pos: [0.5, 0.5, 0], role: 'Face', contribution: 0.5, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [0.5, 0.5, 1], role: 'Face', contribution: 0.5, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [0.5, 0, 0.5], role: 'Face', contribution: 0.5, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [0.5, 1, 0.5], role: 'Face', contribution: 0.5, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [0, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#94a3b8', radius: 0.18 },
      { element: 'C', pos: [1, 0.5, 0.5], role: 'Face', contribution: 0.5, color: '#94a3b8', radius: 0.18 },
      // 4 interior tetrahedral sites
      { element: 'C', pos: [0.25, 0.25, 0.25], role: 'Site T', contribution: 1.0, color: '#38bdf8', radius: 0.18 },
      { element: 'C', pos: [0.75, 0.75, 0.25], role: 'Site T', contribution: 1.0, color: '#38bdf8', radius: 0.18 },
      { element: 'C', pos: [0.75, 0.25, 0.75], role: 'Site T', contribution: 1.0, color: '#38bdf8', radius: 0.18 },
      { element: 'C', pos: [0.25, 0.75, 0.75], role: 'Site T', contribution: 1.0, color: '#38bdf8', radius: 0.18 },
    ],
  },
];

// Interactive TD Self-Test Questions based on the uploaded assignments
export const TD_QUIZ_QUESTIONS: TDQuizQuestion[] = [
  {
    id: 'td1_cube_sym',
    exercise: 'Exercice 2 : Système Cubique',
    question: 'Combien d\'axes d\'ordre 3 (A3) possède le cube, et par où passent-ils ?',
    context: 'Les éléments de symétrie du cube se coupent en son centre C.',
    options: [
      '3 axes A3 passant par les centres des faces',
      '4 axes A3 passant par les 4 grandes diagonales du cube',
      '6 axes A3 passant par les milieux des arêtes',
      '8 axes A3 passant par chaque sommet',
    ],
    correctIndex: 1,
    explanation:
      'Un cube possède 4 grandes diagonales qui relient les sommets opposés : [111], [11̄1], [1̄11] et [111̄]. Chacune constitue un axe de rotation d\'ordre 3 (angle α = 120°). Les 3 axes passant par les centres des faces sont d\'ordre 4 (A4).',
    formulaDetail: '4 diagonales = 4 A3 (rotation 120°)',
  },
  {
    id: 'td2_cube_bravais',
    exercise: 'Exercice 2 : Système Cubique (Q4)',
    question: 'Pourquoi ne peut-on pas considérer de mode à une seule paire de faces centrées (mode C, A ou B) dans le système cubique ?',
    options: [
      'Parce que le cube ne possède pas assez de sommets pour centrer deux faces',
      'Parce que centrer une seule paire de faces détruit la symétrie A3 (les axes X, Y, Z ne sont plus équivalents)',
      'Parce que les atomes se toucheraient sur les arêtes',
      'Parce que le volume de la maille deviendrait irrationnel',
    ],
    correctIndex: 1,
    explanation:
      'Dans le cube, les 3 directions X, Y, Z sont strictement équivalentes grâce aux 4 axes A3 (diagonales). Si on centrait uniquement la face z=0 et z=1 (mode C), l\'axe Z serait privilégié par rapport à X et Y : la maille deviendrait quadratique et perdrait sa symétrie cubique !',
    formulaDetail: 'Règle absolue : le mode de réseau doit préserver TOUTES les symétries du système.',
  },
  {
    id: 'td3_miller_plane',
    exercise: 'Exercice 2 : Indices de Miller (Q5)',
    question: 'Un plan coupe les axes en a/1, b/2 et est parallèle à l\'axe c. Quels sont ses indices de Miller (hkl) ?',
    options: ['(1 2 0)', '(2 1 0)', '(1 1/2 0)', '(0 2 1)'],
    correctIndex: 1,
    explanation:
      'Interceptions : p = 1, q = 2, r = ∞ (car parallèle à c). On prend les inverses : 1/1 = 1, 1/2, 1/∞ = 0. On réduit au plus petit dénominateur commun (multiplication par 2) : 2, 1, 0. Donc les indices de Miller sont (2 1 0).',
    formulaDetail: 'Inverses : (1/1, 1/2, 1/∞) = (1, 1/2, 0) × 2 → (2 1 0)',
  },
  {
    id: 'td4_dhkl_calc',
    exercise: 'Exercice 2 : Distance interréticulaire (Q8)',
    question: 'Pour une maille cubique de paramètre a = 4.0 Å, quelle est la distance interréticulaire d(111) ?',
    options: ['4.00 Å', '2.83 Å', '2.31 Å', '1.33 Å'],
    correctIndex: 2,
    explanation:
      'Pour le cubique, d_hkl = a / √(h² + k² + l²). Pour (111), √(1² + 1² + 1²) = √3 ≈ 1.732. Donc d(111) = 4.0 / 1.732 ≈ 2.31 Å.',
    formulaDetail: 'd(111) = a / √3 = 4.0 / 1.732 = 2.309 Å',
  },
  {
    id: 'td5_atom_decompte',
    exercise: 'Exercice 3 : Décompte des atomes (Q1)',
    question: 'Dans un polyèdre à 8 sommets, pour quelle fraction compte un atome situé sur une arête de la maille ?',
    options: ['1/8', '1/4', '1/2', '1'],
    correctIndex: 1,
    explanation:
      'Une arête d\'un polyèdre est partagée entre 4 mailles contiguës. Un atome situé sur cette arête appartient donc pour 1/4 à la maille élémentaire.',
    formulaDetail: 'Sommet : 1/8 | Arête : 1/4 | Face : 1/2 | Intérieur : 1',
  },
  {
    id: 'td6_cfc_multiplicity',
    exercise: 'Exercice 4 : Multiplicité de maille (Q1-Q4)',
    question: 'Combien d\'atomes contient la maille conventionnelle CFC, et pourquoi utilise-t-on cette maille multiple au lieu de la maille primitive ?',
    options: [
      '2 atomes ; parce qu\'elle est plus facile à peser',
      '4 atomes ; parce qu\'elle met en évidence la symétrie cubique orthogonale à 90°',
      '6 atomes ; pour former un hexagone parfait',
      '8 atomes ; car il y a 8 sommets',
    ],
    correctIndex: 1,
    explanation:
      'Dans la maille conventionnelle CFC : 8 sommets × 1/8 + 6 faces × 1/2 = 1 + 3 = 4 nœuds (multiplicité m = 4). La maille primitive est un rhomboèdre à 60° contenant 1 seul nœud. On préfère la maille multiple conventionnelle car elle conserve les angles droits à 90° et les symétries cubiques A4 et miroirs m4.',
    formulaDetail: 'Maille conventionnelle CFC : Z = 4 (m = 4). Maille primitive : Z = 1 (m = 1).',
  },
  {
    id: 'td7_site_occup',
    exercise: 'Cours & TD : Règle d\'occupation des sites',
    question: 'Dans le chlorure de sodium (NaCl), le rayon de Na⁺ est 97 pm et celui de Cl⁻ est 181 pm (r/R ≈ 0.536). Quel site est occupé par le sodium ?',
    options: [
      'Site Tétraédrique (car r/R < 0.414)',
      'Site Octaédrique (car 0.414 ≤ r/R < 0.732)',
      'Site Cubique (car r/R > 0.732)',
      'Site Linéaire (coordinence 2)',
    ],
    correctIndex: 1,
    explanation:
      'Le rapport r/R = 97 / 181 = 0.536. Comme 0.414 ≤ 0.536 < 0.732, le cation Na⁺ se loge parfaitement dans les sites octaédriques (coordinence [6]) sans déformer le réseau hôte de Cl⁻ et sans contact anion-anion répulsif.',
    formulaDetail: '0.414 (√2 - 1) ≤ r/R = 0.536 < 0.732 (√3 - 1) → Site Octaédrique [6]',
  },
];
