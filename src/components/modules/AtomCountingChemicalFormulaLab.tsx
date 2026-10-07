import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimpleOrbitController } from '../3d/OrbitControlsHelper';
import { CRYSTAL_STRUCTURES } from '../../data/crystallographyData';
import { CrystalStructureModel } from '../../types/crystallography';
import { Calculator, Eye, HelpCircle, Layers, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export default function AtomCountingChemicalFormulaLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SimpleOrbitController | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cellGroupRef = useRef<THREE.Group | null>(null);

  // Selected structure
  const [selectedStructureId, setSelectedStructureId] = useState<string>('rutile');
  const [viewMode, setViewMode] = useState<'ball_and_stick' | 'space_filling' | 'clipped'>('ball_and_stick');
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const activeStructure = useMemo<CrystalStructureModel>(() => {
    return CRYSTAL_STRUCTURES.find((s) => s.id === selectedStructureId) || CRYSTAL_STRUCTURES[0];
  }, [selectedStructureId]);

  // Compute breakdown by role and element
  const breakdown = useMemo(() => {
    const map = new Map<string, { count: number; contribution: number; total: number; color: string }>();

    activeStructure.atoms.forEach((atom) => {
      const key = `${atom.element} - ${atom.role}`;
      const existing = map.get(key) || { count: 0, contribution: atom.contribution, total: 0, color: atom.color };
      existing.count += 1;
      existing.total += atom.contribution;
      map.set(key, existing);
    });

    const elementTotals = new Map<string, number>();
    activeStructure.atoms.forEach((atom) => {
      elementTotals.set(atom.element, (elementTotals.get(atom.element) || 0) + atom.contribution);
    });

    return { roles: Array.from(map.entries()), elementTotals: Array.from(elementTotals.entries()) };
  }, [activeStructure]);

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b1120);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 3.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controller = new SimpleOrbitController(camera, renderer.domElement);
    controllerRef.current = controller;

    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir1.position.set(5, 10, 7);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dir2.position.set(-5, -5, -5);
    scene.add(dir2);

    const cellGroup = new THREE.Group();
    scene.add(cellGroup);
    cellGroupRef.current = cellGroup;

    // Small axes helper
    const axes = new THREE.AxesHelper(1.6);
    axes.position.set(-1.2, -1.2, -1.2);
    scene.add(axes);

    let reqId: number;
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      reqId = requestAnimationFrame(animate);
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      controller.update(delta);
      renderer.render(scene, camera);
    };
    reqId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      controller.unbindEvents();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild 3D structure representation
  useEffect(() => {
    const cellGroup = cellGroupRef.current;
    if (!cellGroup) return;

    while (cellGroup.children.length > 0) {
      const obj = cellGroup.children[0];
      cellGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    const a = 2.0; // scale in 3D
    const half = a / 2;
    const shift = new THREE.Vector3(-half, -half, -half);

    // 1. Box Wireframe
    const boxGeo = new THREE.BoxGeometry(a, a, a);
    const boxMat = new THREE.MeshPhysicalMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    cellGroup.add(new THREE.Mesh(boxGeo, boxMat));

    const edges = new THREE.EdgesGeometry(boxGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });
    cellGroup.add(new THREE.LineSegments(edges, edgeMat));

    // 2. Atoms
    activeStructure.atoms.forEach((atom) => {
      const isHighlighted = hoveredRole ? atom.role.includes(hoveredRole) : false;

      let r = atom.radius;
      if (viewMode === 'space_filling') r *= 1.8;
      if (isHighlighted) r *= 1.25;

      const sphereGeo = new THREE.SphereGeometry(r, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: isHighlighted ? 0xffffff : new THREE.Color(atom.color),
        emissive: isHighlighted ? new THREE.Color(atom.color) : 0x000000,
        emissiveIntensity: isHighlighted ? 0.6 : 0,
        roughness: 0.25,
        metalness: 0.15,
      });

      const sphere = new THREE.Mesh(sphereGeo, mat);
      sphere.position.set(
        atom.pos[0] * a + shift.x,
        atom.pos[1] * a + shift.y,
        atom.pos[2] * a + shift.z
      );
      cellGroup.add(sphere);
    });

    // 3. Connective Bonds (Ball and stick)
    if (viewMode === 'ball_and_stick') {
      const bondMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 });
      const bondPts: THREE.Vector3[] = [];

      // Link nearby cations and anions
      for (let i = 0; i < activeStructure.atoms.length; i++) {
        for (let j = i + 1; j < activeStructure.atoms.length; j++) {
          const a1 = activeStructure.atoms[i];
          const a2 = activeStructure.atoms[j];
          if (a1.element !== a2.element) {
            const p1 = new THREE.Vector3(a1.pos[0] * a + shift.x, a1.pos[1] * a + shift.y, a1.pos[2] * a + shift.z);
            const p2 = new THREE.Vector3(a2.pos[0] * a + shift.x, a2.pos[1] * a + shift.y, a2.pos[2] * a + shift.z);
            const dist = p1.distanceTo(p2);
            if (dist < a * 0.72) {
              bondPts.push(p1, p2);
            }
          }
        }
      }

      if (bondPts.length > 0) {
        const bondGeo = new THREE.BufferGeometry().setFromPoints(bondPts);
        cellGroup.add(new THREE.LineSegments(bondGeo, bondMat));
      }
    }
  }, [activeStructure, viewMode, hoveredRole]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
      {/* 3D WebGL Canvas */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto">
            <span className="text-xs font-semibold text-sky-400">{activeStructure.name}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-emerald-400">
              Formule : {activeStructure.formula} (Z = {activeStructure.zCount})
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
            <button
              onClick={() => setViewMode('ball_and_stick')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                viewMode === 'ball_and_stick' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Ball & Stick
            </button>
            <button
              onClick={() => setViewMode('space_filling')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                viewMode === 'space_filling' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Sphères Dures
            </button>
            <button
              onClick={() => controllerRef.current?.setViewPreset('isometric')}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="w-full h-[520px] flex-1 cursor-grab active:cursor-grabbing" />

        {/* Structure description & math note */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 p-4 text-xs text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-semibold text-slate-200">
              {activeStructure.formula} : {activeStructure.description}
            </div>
            <div className="text-slate-400 font-mono">
              Coordinence : {activeStructure.coordination}
            </div>
          </div>
          <div className="text-right text-xs font-mono text-emerald-400 shrink-0">
            <div>Multiplicité maille Z = {activeStructure.zCount}</div>
            {activeStructure.compacityValue && (
              <div className="text-sky-300">Compacité C ≈ {activeStructure.compacityValue}</div>
            )}
          </div>
        </div>
      </div>

      {/* Control Deck & Atom Counting Calculation */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* 1. Structure Chooser */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              Structures de l'Exercice 3 & 4
            </h3>
            <span className="text-xs text-slate-400 font-mono">TD</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
            {CRYSTAL_STRUCTURES.map((s) => {
              const isSelected = s.id === selectedStructureId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStructureId(s.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border text-left transition-colors ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/60 text-sky-200 font-medium'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="font-mono text-emerald-400 text-[11px]">{s.formula}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Tableau de décompte pas-à-pas (Exercice 3 Q1 & Q2) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Décompte par Maille (Formule Z)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Q1-Q2</span>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            Règle de partage : Sommet = <strong>1/8</strong> · Arête = <strong>1/4</strong> · Face = <strong>1/2</strong> · Intérieur = <strong>1</strong>.
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {breakdown.roles.map(([key, data]) => (
              <div
                key={key}
                onMouseEnter={() => setHoveredRole(key.split(' - ')[1])}
                onMouseLeave={() => setHoveredRole(null)}
                className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800/80 text-xs hover:border-sky-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></span>
                  <span className="font-medium text-slate-200">{key}</span>
                </div>
                <div className="font-mono text-slate-300">
                  {data.count} × {data.contribution === 0.125 ? '1/8' : data.contribution === 0.25 ? '1/4' : data.contribution === 0.5 ? '1/2' : '1'} ={' '}
                  <span className="text-emerald-400 font-bold">{data.total}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals by element */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total atomes par maille :</span>
            <div className="flex gap-2">
              {breakdown.elementTotals.map(([elem, tot]) => (
                <span key={elem} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                  {elem} : {tot}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
