import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimpleOrbitController } from '../3d/OrbitControlsHelper';
import { CRYSTAL_SYSTEMS, getLatticeVectors } from '../../utils/crystalMath';
import { CrystalSystemInfo, BravaisMode } from '../../types/crystallography';
import { Box, Layers, Grid3X3, Info, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function SystemsBravaisLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SimpleOrbitController | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  // Selected system & mode
  const [selectedSystemId, setSelectedSystemId] = useState<string>('cubic');
  const [bravaisMode, setBravaisMode] = useState<BravaisMode>('P');
  const [repeatGrid, setRepeatGrid] = useState<number>(1); // 1, 2, or 3 cells

  // Custom adjustable parameters
  const currentSystem = useMemo(() => {
    return CRYSTAL_SYSTEMS.find((s) => s.id === selectedSystemId) || CRYSTAL_SYSTEMS[0];
  }, [selectedSystemId]);

  const [paramA, setParamA] = useState(2.2);
  const [paramB, setParamB] = useState(2.2);
  const [paramC, setParamC] = useState(2.2);
  const [alpha, setAlpha] = useState(90);
  const [beta, setBeta] = useState(90);
  const [gamma, setGamma] = useState(90);

  // When system changes, reset default parameters and ensure valid Bravais mode
  useEffect(() => {
    const p = currentSystem.defaultParams;
    setParamA(p.a);
    setParamB(p.b);
    setParamC(p.c);
    setAlpha(p.alpha);
    setBeta(p.beta);
    setGamma(p.gamma);

    // If current mode is not allowed for this system, fallback to P
    if (!currentSystem.allowedBravais.includes(bravaisMode)) {
      setBravaisMode('P');
    }
  }, [selectedSystemId]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b1120);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 3.8, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controller = new SimpleOrbitController(camera, renderer.domElement);
    controllerRef.current = controller;

    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

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

  // Build the 3D crystal lattice & Bravais nodes
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    if (!meshGroup) return;

    while (meshGroup.children.length > 0) {
      const obj = meshGroup.children[0];
      meshGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    const { va, vb, vc } = getLatticeVectors(paramA, paramB, paramC, alpha, beta, gamma);

    // Center offset for the whole repeated grid
    const totalCenter = new THREE.Vector3()
      .addScaledVector(va, repeatGrid * 0.5)
      .addScaledVector(vb, repeatGrid * 0.5)
      .addScaledVector(vc, repeatGrid * 0.5)
      .negate();

    const sphereGeo = new THREE.SphereGeometry(0.12, 20, 20);
    const cornerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
    const centerMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });

    // Edge indices in unit cell corners [0..7]
    const edgePairs: [number, number][] = [
      [0, 1], [2, 3], [4, 5], [6, 7], // along c
      [0, 2], [1, 3], [4, 6], [5, 7], // along b
      [0, 4], [1, 5], [2, 6], [3, 7], // along a
    ];

    // Build each unit cell in the repeated grid
    for (let gx = 0; gx < repeatGrid; gx++) {
      for (let gy = 0; gy < repeatGrid; gy++) {
        for (let gz = 0; gz < repeatGrid; gz++) {
          const originCell = new THREE.Vector3()
            .addScaledVector(va, gx)
            .addScaledVector(vb, gy)
            .addScaledVector(vc, gz)
            .add(totalCenter);

          // 8 corners
          const corners: THREE.Vector3[] = [];
          for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
              for (let k = 0; k < 2; k++) {
                const pt = new THREE.Vector3()
                  .copy(originCell)
                  .addScaledVector(va, i)
                  .addScaledVector(vb, j)
                  .addScaledVector(vc, k);
                corners.push(pt);

                // Add atom node at corner
                const sphere = new THREE.Mesh(sphereGeo, cornerMat);
                sphere.position.copy(pt);
                meshGroup.add(sphere);
              }
            }
          }

          // 12 edges
          const linePts: THREE.Vector3[] = [];
          edgePairs.forEach(([c1, c2]) => {
            linePts.push(corners[c1], corners[c2]);
          });
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
          meshGroup.add(new THREE.LineSegments(lineGeo, lineMat));

          // Body center for Mode I
          if (bravaisMode === 'I') {
            const bodyCenter = new THREE.Vector3()
              .copy(originCell)
              .addScaledVector(va, 0.5)
              .addScaledVector(vb, 0.5)
              .addScaledVector(vc, 0.5);
            const centerSphere = new THREE.Mesh(sphereGeo, centerMat);
            centerSphere.position.copy(bodyCenter);
            meshGroup.add(centerSphere);
          }

          // Face centers for Mode F (all 6 faces)
          if (bravaisMode === 'F') {
            const faceOffsets: [number, number, number][] = [
              [0.5, 0.5, 0], [0.5, 0.5, 1], // z-faces
              [0.5, 0, 0.5], [0.5, 1, 0.5], // y-faces
              [0, 0.5, 0.5], [1, 0.5, 0.5], // x-faces
            ];
            faceOffsets.forEach(([u, v, w]) => {
              const facePos = new THREE.Vector3()
                .copy(originCell)
                .addScaledVector(va, u)
                .addScaledVector(vb, v)
                .addScaledVector(vc, w);
              const sphere = new THREE.Mesh(sphereGeo, faceMat);
              sphere.position.copy(facePos);
              meshGroup.add(sphere);
            });
          }

          // Base centers for Mode C (top and bottom faces only)
          if (bravaisMode === 'C') {
            const cOffsets: [number, number, number][] = [
              [0.5, 0.5, 0], [0.5, 0.5, 1],
            ];
            cOffsets.forEach(([u, v, w]) => {
              const basePos = new THREE.Vector3()
                .copy(originCell)
                .addScaledVector(va, u)
                .addScaledVector(vb, v)
                .addScaledVector(vc, w);
              const sphere = new THREE.Mesh(sphereGeo, faceMat);
              sphere.position.copy(basePos);
              meshGroup.add(sphere);
            });
          }
        }
      }
    }

    // Origin basis vectors arrows (a: red, b: green, c: blue)
    const arrowOrigin = totalCenter.clone();
    meshGroup.add(new THREE.ArrowHelper(va.clone().normalize(), arrowOrigin, 1.2, 0xef4444, 0.18, 0.08));
    meshGroup.add(new THREE.ArrowHelper(vb.clone().normalize(), arrowOrigin, 1.2, 0x22c55e, 0.18, 0.08));
    meshGroup.add(new THREE.ArrowHelper(vc.clone().normalize(), arrowOrigin, 1.2, 0x3b82f6, 0.18, 0.08));
  }, [paramA, paramB, paramC, alpha, beta, gamma, bravaisMode, repeatGrid]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
      {/* 3D WebGL Canvas */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto">
            <span className="text-xs font-semibold text-sky-400">
              Système {currentSystem.name} ({currentSystem.symbol})
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-emerald-400">Mode {bravaisMode}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
            <button
              onClick={() => setRepeatGrid(1)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                repeatGrid === 1 ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Maille 1×1×1
            </button>
            <button
              onClick={() => setRepeatGrid(2)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                repeatGrid === 2 ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Réseau 2×2×2
            </button>
            <button
              onClick={() => controllerRef.current?.setViewPreset('isometric')}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Reset Vue
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="w-full h-[540px] flex-1 cursor-grab active:cursor-grabbing" />

        {/* System Details Footer */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 p-4 text-xs text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-semibold text-slate-200">
              {currentSystem.name} : {currentSystem.cellDesc} · {currentSystem.anglesDesc}
            </div>
            <div className="text-slate-400">{currentSystem.explanation}</div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
            <div>Éléments : {currentSystem.symmetryElements}</div>
            <div className="text-emerald-400">
              Modes permis : {currentSystem.allowedBravais.join(', ')} (total 14 réseaux)
            </div>
          </div>
        </div>
      </div>

      {/* Control Deck */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* 1. System Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Box className="w-4 h-4 text-sky-400" />
              Les 7 Systèmes Cristallins
            </h3>
            <span className="text-xs text-slate-400 font-mono">Slides 10-12</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-[210px] overflow-y-auto pr-1">
            {CRYSTAL_SYSTEMS.map((sys) => {
              const isSelected = sys.id === selectedSystemId;
              return (
                <button
                  key={sys.id}
                  onClick={() => setSelectedSystemId(sys.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border text-left transition-colors ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/60 text-sky-200 font-medium'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div>
                    <span className="font-semibold">{sys.name}</span>
                    <span className="ml-1 text-slate-400 font-mono text-[11px]">({sys.symbol})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{sys.cellDesc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Bravais Mode Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Mode de Réseau (Bravais)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Slides 13-15</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['P', 'I', 'F', 'C'] as BravaisMode[]).map((mode) => {
              const isAllowed = currentSystem.allowedBravais.includes(mode);
              const isSelected = bravaisMode === mode;
              const modeNames: Record<BravaisMode, string> = {
                P: 'Primitif (P)',
                I: 'Centré (I)',
                F: 'Faces Centrées (F)',
                C: 'Base Centrée (C/S)',
              };

              return (
                <button
                  key={mode}
                  disabled={!isAllowed}
                  onClick={() => setBravaisMode(mode)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                      : isAllowed
                      ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      : 'bg-slate-950/20 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                >
                  <div className="font-semibold">{modeNames[mode]}</div>
                  <div className="text-[10px] text-slate-400">
                    {isAllowed ? 'Valide selon Bravais' : 'Non permis'}
                  </div>
                </button>
              );
            })}
          </div>

          {!currentSystem.allowedBravais.includes('C') && (
            <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Slide 14 : Le mode C est interdit pour le système {currentSystem.name} car il briserait les symétries
                propres du système ou équivaudrait à une maille P plus petite.
              </span>
            </div>
          )}
        </div>

        {/* 3. Realtime Parameter Sliders */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Paramètres Géométriques</h3>
            <span className="text-xs text-slate-400 font-mono">Maille en direct</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-400 mb-1">a : {paramA.toFixed(1)}</div>
              <input
                type="range"
                min="1.5"
                max="3.5"
                step="0.1"
                value={paramA}
                onChange={(e) => setParamA(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>
            <div>
              <div className="text-slate-400 mb-1">b : {paramB.toFixed(1)}</div>
              <input
                type="range"
                min="1.5"
                max="3.5"
                step="0.1"
                value={paramB}
                onChange={(e) => setParamB(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>
            <div>
              <div className="text-slate-400 mb-1">c : {paramC.toFixed(1)}</div>
              <input
                type="range"
                min="1.5"
                max="3.5"
                step="0.1"
                value={paramC}
                onChange={(e) => setParamC(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
