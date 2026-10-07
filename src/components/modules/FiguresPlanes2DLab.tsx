import React, { useState } from 'react';
import { Sparkles, RotateCw, CheckCircle2, BookOpen, Layers } from 'lucide-react';

interface Shape2D {
  id: string;
  name: string;
  symmetryElements: string;
  description: string;
  mirrorsCount: number;
  rotationOrder: number;
  hasCenterC: boolean;
  vertices: [number, number][]; // normalized coordinates [-1..1]
  mirrorLines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

const SHAPES_2D: Shape2D[] = [
  {
    id: 'iso_triangle',
    name: 'Triangle isocèle',
    symmetryElements: '1 miroir m (axe de symétrie vertical), 0 axe de rotation (>1), pas de centre C',
    description: 'Possède une seule symétrie bilatérale (réflexion par rapport à la hauteur issue du sommet principal).',
    mirrorsCount: 1,
    rotationOrder: 1,
    hasCenterC: false,
    vertices: [[0, -0.85], [0.75, 0.75], [-0.75, 0.75]],
    mirrorLines: [{ x1: 0, y1: -1.1, x2: 0, y2: 1.1 }],
  },
  {
    id: 'equi_triangle',
    name: 'Triangle équilatéral',
    symmetryElements: '1 axe A₃ (rotation 120°), 3 miroirs m, pas de centre C',
    description: '3 axes de réflexion (hauteurs/médiatrices) et 1 axe de rotation d\'ordre 3 au barycentre.',
    mirrorsCount: 3,
    rotationOrder: 3,
    hasCenterC: false,
    vertices: [
      [0, -0.88],
      [0.762, 0.44],
      [-0.762, 0.44],
    ],
    mirrorLines: [
      { x1: 0, y1: -1.1, x2: 0, y2: 1.1 },
      { x1: -0.95, y1: -0.55, x2: 0.95, y2: 0.55 },
      { x1: 0.95, y1: -0.55, x2: -0.95, y2: 0.55 },
    ],
  },
  {
    id: 'parallelogram',
    name: 'Parallélogramme',
    symmetryElements: '1 centre C (équivalent à un axe A₂ perpendiculaire), 0 miroir m',
    description: 'Les côtés opposés sont parallèles mais il n\'a AUCUN plan de réflexion. Il possède un centre d\'inversion C.',
    mirrorsCount: 0,
    rotationOrder: 2,
    hasCenterC: true,
    vertices: [[-0.4, -0.7], [0.8, -0.7], [0.4, 0.7], [-0.8, 0.7]],
    mirrorLines: [],
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    symmetryElements: '2 miroirs m (médiatrices des côtés), 1 axe A₂ (180°), 1 centre C',
    description: 'Deux axes de réflexion orthogonaux se coupant au centre C. Les diagonales ne sont PAS des miroirs !',
    mirrorsCount: 2,
    rotationOrder: 2,
    hasCenterC: true,
    vertices: [[-0.85, -0.55], [0.85, -0.55], [0.85, 0.55], [-0.85, 0.55]],
    mirrorLines: [
      { x1: 0, y1: -1.1, x2: 0, y2: 1.1 },
      { x1: -1.1, y1: 0, x2: 1.1, y2: 0 },
    ],
  },
  {
    id: 'square',
    name: 'Carré',
    symmetryElements: '1 axe A₄ (90°), 4 miroirs m (2 médiatrices + 2 diagonales), 1 centre C',
    description: 'Archétype de la symétrie d\'ordre 4 en 2D. 4 lignes de réflexion et invariance par rotation de 90°.',
    mirrorsCount: 4,
    rotationOrder: 4,
    hasCenterC: true,
    vertices: [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]],
    mirrorLines: [
      { x1: 0, y1: -1.1, x2: 0, y2: 1.1 },
      { x1: -1.1, y1: 0, x2: 1.1, y2: 0 },
      { x1: -0.9, y1: -0.9, x2: 0.9, y2: 0.9 },
      { x1: -0.9, y1: 0.9, x2: 0.9, y2: -0.9 },
    ],
  },
  {
    id: 'hexagon',
    name: 'Hexagone régulier',
    symmetryElements: '1 axe A₆ (60°), 6 miroirs m (3 sommets + 3 côtés), 1 centre C',
    description: 'Ordre 6 maximal en cristallographie 2D. 6 miroirs et rotation de 60° (2π/6).',
    mirrorsCount: 6,
    rotationOrder: 6,
    hasCenterC: true,
    vertices: Array.from({ length: 6 }).map((_, i) => {
      const ang = (i * Math.PI) / 3;
      return [0.75 * Math.cos(ang), 0.75 * Math.sin(ang)];
    }),
    mirrorLines: Array.from({ length: 6 }).map((_, i) => {
      const ang = (i * Math.PI) / 6;
      return {
        x1: -1.05 * Math.cos(ang),
        y1: -1.05 * Math.sin(ang),
        x2: 1.05 * Math.cos(ang),
        y2: 1.05 * Math.sin(ang),
      };
    }),
  },
];

export default function FiguresPlanes2DLab() {
  const [selectedShapeId, setSelectedShapeId] = useState<string>('square');
  const [showMirrors, setShowMirrors] = useState(true);
  const [showRotationAxis, setShowRotationAxis] = useState(true);
  const [showCenter, setShowCenter] = useState(true);
  const [rotationAngle, setRotationAngle] = useState(0); // in degrees

  const activeShape = SHAPES_2D.find((s) => s.id === selectedShapeId) || SHAPES_2D[4];

  // Rotate shape
  const handleRotate = () => {
    const step = 360 / (activeShape.rotationOrder > 1 ? activeShape.rotationOrder : 4);
    setRotationAngle((prev) => prev + step);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
      {/* 2D Interactive Canvas */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold text-sky-400">{activeShape.name}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">
              Ordre {activeShape.rotationOrder} · {activeShape.mirrorsCount} miroir(s)
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800">
            <button
              onClick={handleRotate}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded border border-sky-500/40 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tourner (+{360 / activeShape.rotationOrder}°)</span>
            </button>
            <button
              onClick={() => setRotationAngle(0)}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* SVG Interactive Display */}
        <div className="w-full h-[520px] flex items-center justify-center p-6 bg-slate-950/90 relative">
          <svg viewBox="-150 -150 300 300" className="w-full h-full max-h-[480px]">
            {/* Background grid */}
            <circle cx="0" cy="0" r="115" fill="none" stroke="#1e293b" strokeDasharray="3,3" />
            <circle cx="0" cy="0" r="80" fill="none" stroke="#1e293b" strokeDasharray="2,2" />

            {/* Mirror Lines */}
            {showMirrors &&
              activeShape.mirrorLines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1 * 115}
                  y1={line.y1 * 115}
                  x2={line.x2 * 115}
                  y2={line.y2 * 115}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                  opacity="0.85"
                />
              ))}

            {/* The Rotating Polygon */}
            <g
              transform={`rotate(${rotationAngle})`}
              style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: '0px 0px' }}
            >
              {/* Fill polygon */}
              <polygon
                points={activeShape.vertices.map(([x, y]) => `${x * 105},${y * 105}`).join(' ')}
                fill="rgba(56, 189, 248, 0.15)"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Vertices */}
              {activeShape.vertices.map(([x, y], idx) => (
                <circle
                  key={idx}
                  cx={x * 105}
                  cy={y * 105}
                  r="5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}
            </g>

            {/* Inversion Center C */}
            {showCenter && activeShape.hasCenterC && (
              <circle cx="0" cy="0" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            )}

            {/* Rotation Order Indicator at Center */}
            {showRotationAxis && activeShape.rotationOrder > 1 && (
              <text
                x="0"
                y="-10"
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                A{activeShape.rotationOrder}
              </text>
            )}
          </svg>
        </div>

        {/* Math explanation banner */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 p-4 text-xs text-slate-300">
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Éléments identifiés pour {activeShape.name} :</span>
          </div>
          <div className="text-emerald-400 font-mono mt-1">{activeShape.symmetryElements}</div>
          <div className="text-slate-400 mt-1">{activeShape.description}</div>
        </div>
      </div>

      {/* Control Deck */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Shape Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Figures Planes du TD 1
            </h3>
            <span className="text-xs text-slate-400 font-mono">Ex. 1</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {SHAPES_2D.map((s) => {
              const isSelected = s.id === selectedShapeId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedShapeId(s.id);
                    setRotationAngle(0);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs border text-left transition-colors ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/60 text-sky-200 font-medium'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {s.mirrorsCount}m · {s.rotationOrder > 1 ? `A${s.rotationOrder}` : 'A1'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Toggles */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3 text-xs">
          <h3 className="text-sm font-semibold text-slate-100">Affichage des éléments</h3>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showMirrors}
              onChange={(e) => setShowMirrors(e.target.checked)}
              className="rounded text-rose-500 bg-slate-950 border-slate-700"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>Miroirs de symétrie m (pointillés rouges)</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showRotationAxis}
              onChange={(e) => setShowRotationAxis(e.target.checked)}
              className="rounded text-sky-500 bg-slate-950 border-slate-700"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span>Axe de rotation An au centre</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showCenter}
              onChange={(e) => setShowCenter(e.target.checked)}
              className="rounded text-amber-500 bg-slate-950 border-slate-700"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Centre d'inversion C (point doré)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
