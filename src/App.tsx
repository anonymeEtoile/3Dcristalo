/**
 * Cristallo3D - Université PEIP Cristallographie & Cristallochimie
 * Application 3D interactive complète
 */

import React, { useState } from 'react';
import { ActiveTab } from './types/crystallography';
import CubeSymmetryLab from './components/modules/CubeSymmetryLab';
import MillerPlanesLab from './components/modules/MillerPlanesLab';
import SystemsBravaisLab from './components/modules/SystemsBravaisLab';
import AtomCountingChemicalFormulaLab from './components/modules/AtomCountingChemicalFormulaLab';
import CompactPackingsAndSitesLab from './components/modules/CompactPackingsAndSitesLab';
import FiguresPlanes2DLab from './components/modules/FiguresPlanes2DLab';
import TDQuizMode from './components/modules/TDQuizMode';
import {
  Box,
  Compass,
  Layers,
  Calculator,
  Sparkles,
  BookOpen,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cube_symmetry');
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const navItems: Array<{ id: ActiveTab; label: string; tdRef: string }> = [
    { id: 'cube_symmetry', label: 'Cube & Symétries', tdRef: 'Ex. 2' },
    { id: 'miller_planes', label: 'Plans (hkl) & Miller', tdRef: 'Ex. 2 Q5-Q8' },
    { id: 'bravais_systems', label: '7 Systèmes & Bravais', tdRef: 'Slides 10-15' },
    { id: 'cell_counting', label: 'Décompte & Formules', tdRef: 'Ex. 3 & 4' },
    { id: 'packings_and_sites', label: 'Empilements & Sites', tdRef: 'Slides 44-77' },
    { id: 'figures_planes', label: 'Figures Planes 2D', tdRef: 'Ex. 1' },
    { id: 'td_quiz', label: 'Quiz & Exercices TD', tdRef: 'Entraînement' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Top Bar - Zone 1 (Brand) | Zone 2 (Nav) | Zone 3 (Actions) */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 rotate-45"></span>
              Cristallo3D
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal">
              PEIP Cristallographie
            </span>
          </div>

          {/* Zone 2: Navigation controls (Segmented functional bar) */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto p-1 bg-slate-900/80 rounded-lg border border-slate-800/80 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFormulaGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-950/50 border border-sky-800/60 rounded-lg hover:bg-sky-900/40 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Formulaire & Aide</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
              title="Plein écran"
              aria-label="Plein écran"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden overflow-x-auto pb-2 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-400 bg-slate-900/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {/* Editorial Subheader with contextual reminder */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              {activeTab === 'cube_symmetry' && 'Système Cubique & Opérations de Symétrie (Oh)'}
              {activeTab === 'miller_planes' && 'Indices de Miller (hkl) & Distances Interréticulaires'}
              {activeTab === 'bravais_systems' && 'Les 7 Systèmes Cristallins & 14 Réseaux de Bravais'}
              {activeTab === 'cell_counting' && 'Décompte d\'Atomes par Maille & Formule Chimique (Z)'}
              {activeTab === 'packings_and_sites' && 'Empilements Denses (ABAB vs ABCABC) & Sites Interstitiels'}
              {activeTab === 'figures_planes' && 'Figures Planes & Cristallographie Bidimensionnelle'}
              {activeTab === 'td_quiz' && 'Entraînement & Résolution Interactive des Questions de TD'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === 'cube_symmetry' && 'Manipulez les 3 A₄, 4 A₃, 6 A₂, miroirs m et le centre C en 3D temps réel.'}
              {activeTab === 'miller_planes' && 'Visualisez les plans réticulaires, calculez dhkl et comparez avec la formule théorique.'}
              {activeTab === 'bravais_systems' && 'Déformez les mailles a, b, c, α, β, γ et comprenez pourquoi certains modes sont interdits.'}
              {activeTab === 'cell_counting' && 'Appliquez les fractions 1/8, 1/4, 1/2, 1 sur Rutile (TiO₂), KNbO₃ et CFC.'}
              {activeTab === 'packings_and_sites' && 'Analysez les cavités tétraédriques, octaédriques, cubiques et les rayons limites r/R.'}
              {activeTab === 'figures_planes' && 'Étude des symétries 2D : triangles, rectangles, carrés et hexagones du TD.'}
              {activeTab === 'td_quiz' && 'Questions directes tirées des fiches de TD avec explications mathématiques pas-à-pas.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {navItems.find((n) => n.id === activeTab)?.tdRef}
            </span>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'cube_symmetry' && <CubeSymmetryLab />}
        {activeTab === 'miller_planes' && <MillerPlanesLab />}
        {activeTab === 'bravais_systems' && <SystemsBravaisLab />}
        {activeTab === 'cell_counting' && <AtomCountingChemicalFormulaLab />}
        {activeTab === 'packings_and_sites' && <CompactPackingsAndSitesLab />}
        {activeTab === 'figures_planes' && <FiguresPlanes2DLab />}
        {activeTab === 'td_quiz' && <TDQuizMode />}
      </main>

      {/* Quick Course Formula Reference Modal / Drawer */}
      {showFormulaGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                Formulaire & Notions Clés du Cours (PEIP)
              </h2>
              <button
                onClick={() => setShowFormulaGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs text-slate-300">
              {/* Formula 1: Miller distance */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-sky-300">
                  1. Distance interréticulaire dhkl (Système Cubique)
                </div>
                <div className="font-mono text-sm text-emerald-400">
                  dhkl = a / √(h² + k² + l²)
                </div>
                <div className="text-slate-400">
                  Pour l'orthorhombique : 1/d² = h²/a² + k²/b² + l²/c²
                </div>
              </div>

              {/* Formula 2: Atom counting */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-sky-300">
                  2. Fractions de décompte des atomes (Polyèdre à 8 sommets)
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li>Sommet : <strong>1/8</strong> (appartient à 8 mailles)</li>
                  <li>Arête : <strong>1/4</strong> (appartient à 4 mailles)</li>
                  <li>Face : <strong>1/2</strong> (appartient à 2 mailles)</li>
                  <li>Intérieur : <strong>1</strong> (propre à la maille)</li>
                </ul>
              </div>

              {/* Formula 3: Interstitial sites */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-sky-300">
                  3. Rayons limites des sites interstitiels (r / R)
                </div>
                <ul className="space-y-1 font-mono text-slate-300">
                  <li>Site Tétraédrique [4] : r/R ≤ √(3/2) - 1 ≈ <strong>0.225</strong></li>
                  <li>Site Octaédrique [6] : r/R ≤ √2 - 1 ≈ <strong>0.414</strong></li>
                  <li>Site Cubique [8] : r/R ≤ √3 - 1 ≈ <strong>0.732</strong></li>
                </ul>
              </div>

              {/* Formula 4: Compacity */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-sky-300">
                  4. Compacité C et Masse Volumique ρ
                </div>
                <div className="font-mono text-slate-300">
                  C = V_occupé / V_maille = (Σ 4/3 π R_i³) / V_maille
                </div>
                <div className="font-mono text-slate-300">
                  ρ = (M · Z) / (V_maille · N_A)
                </div>
              </div>

              {/* Symmetries of cube */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-sky-300">
                  5. Éléments de symétrie du cube (Groupe Oh, ordre 48)
                </div>
                <div className="text-slate-300 font-mono">
                  3 A₄ + 4 A₃ + 6 A₂ + 3 m₄ + 6 m₂ + C = 48 opérations
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFormulaGuide(false)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs"
              >
                Compris, fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-center text-xs text-slate-500">
        Cristallo3D · Outil d'apprentissage interactif de Cristallographie & Cristallochimie · PEIP
      </footer>
    </div>
  );
}
