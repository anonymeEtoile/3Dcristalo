import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimpleOrbitController } from '../3d/OrbitControlsHelper';
import { calculateD_hklCubic, intersectMillerPlaneWithCell, getLatticeVectors } from '../../utils/crystalMath';
import { Compass, Sliders, Layers, Sparkles, Check, ArrowRight, BookOpen } from 'lucide-react';

interface TDPlanePreset {
  h: number;
  k: number;
  l: number;
  label: string;
  tdNote?: string;
}

const TD_PRESETS: TDPlanePreset[] = [
  { h: 0, k: 0, l: 1, label: '(001)', tdNote: 'Ex. 2 Q6 : Face supérieure, d = a' },
  { h: 0, k: 2, l: 0, label: '(020)', tdNote: 'Ex. 2 Q6 : Coupe en y=1/2, d = a/2' },
  { h: 0, k: 1, l: 1, label: '(011)', tdNote: 'Ex. 2 Q6 : Plan diagonal, d = a/√2' },
  { h: 1, k: 1, l: 1, label: '(111)', tdNote: 'Ex. 2 Q6 : Plan diagonal dense, d = a/√3' },
  { h: 0, k: 2, l: 2, label: '(022)', tdNote: 'Ex. 2 Q6 : Famille parallèle à (011), d = a/√8 = a/(2√2)' },
  { h: 2, k: 2, l: 2, label: '(222)', tdNote: 'Ex. 2 Q6 : Famille parallèle à (111), d = a/√12 = a/(2√3)' },
  { h: 3, k: 2, l: 2, label: '(322)', tdNote: 'Ex. 2 Q6 / Slide 20 : d = a/√17' },
  { h: 1, k: 0, l: 0, label: '(100)', tdNote: 'Face avant, d = a' },
  { h: 1, k: 1, l: 0, label: '(110)', tdNote: 'Plan diagonal vertical, d = a/√2' },
  { h: 2, k: 3, l: 3, label: '(233)', tdNote: 'Slide 20 : Inverses de (3, 2, 2)' },
];

export default function MillerPlanesLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SimpleOrbitController | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const planesGroupRef = useRef<THREE.Group | null>(null);

  // Miller indices state
  const [h, setH] = useState(1);
  const [k, setK] = useState(1);
  const [l, setL] = useState(1);

  // Lattice parameter a in Ångströms
  const [paramA, setParamA] = useState(4.0);
  const [showMultiPlanes, setShowMultiPlanes] = useState(false);
  const [showNormalVector, setShowNormalVector] = useState(true);
  const [showNodes, setShowNodes] = useState(true);

  // Computed interreticular distance
  const dhkl = useMemo(() => {
    return calculateD_hklCubic(paramA, h, k, l);
  }, [paramA, h, k, l]);

  const sqrtSum = useMemo(() => {
    return Math.sqrt(h * h + k * k + l * l);
  }, [h, k, l]);

  // Intercepts
  const intercepts = useMemo(() => {
    return {
      x: h === 0 ? '∞ (parallèle)' : `a / ${h} = ${(paramA / h).toFixed(2)} Å`,
      y: k === 0 ? '∞ (parallèle)' : `b / ${k} = ${(paramA / k).toFixed(2)} Å`,
      z: l === 0 ? '∞ (parallèle)' : `c / ${l} = ${(paramA / l).toFixed(2)} Å`,
    };
  }, [h, k, l, paramA]);

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
    camera.position.set(3.6, 2.8, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controller = new SimpleOrbitController(camera, renderer.domElement);
    controllerRef.current = controller;

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    const dir2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dir2.position.set(-5, -5, -5);
    scene.add(dir2);

    const planesGroup = new THREE.Group();
    scene.add(planesGroup);
    planesGroupRef.current = planesGroup;

    // Subtle coordinate axes helper
    const axesHelper = new THREE.AxesHelper(1.8);
    axesHelper.position.set(-1.0, -1.0, -1.0);
    scene.add(axesHelper);

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

  // Update Miller plane meshes
  useEffect(() => {
    const planesGroup = planesGroupRef.current;
    if (!planesGroup) return;

    while (planesGroup.children.length > 0) {
      const obj = planesGroup.children[0];
      planesGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    const cellSize = 2.0; // scale in 3D
    const va = new THREE.Vector3(cellSize, 0, 0);
    const vb = new THREE.Vector3(0, cellSize, 0);
    const vc = new THREE.Vector3(0, 0, cellSize);
    const centerShift = new THREE.Vector3(-cellSize / 2, -cellSize / 2, -cellSize / 2);

    // 1. Unit Cell Box Wireframe
    const boxGeom = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
    const boxMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.15,
      roughness: 0.2,
      depthWrite: false,
    });
    planesGroup.add(new THREE.Mesh(boxGeom, boxMat));

    const edgesGeo = new THREE.EdgesGeometry(boxGeom);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
    planesGroup.add(new THREE.LineSegments(edgesGeo, edgesMat));

    // 2. Corner Node Atoms
    if (showNodes) {
      const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
      for (let x = 0; x <= 1; x++) {
        for (let y = 0; y <= 1; y++) {
          for (let z = 0; z <= 1; z++) {
            const sphere = new THREE.Mesh(sphereGeo, nodeMat);
            sphere.position.set(
              x * cellSize + centerShift.x,
              y * cellSize + centerShift.y,
              z * cellSize + centerShift.z
            );
            planesGroup.add(sphere);
          }
        }
      }
    }

    // 3. Render Miller Plane(s)
    // We compute planes h*u + k*v + l*w = D
    // Primary plane is at D = 1
    const levelsToRender = showMultiPlanes ? [0, 1, 2, 3] : [1];

    levelsToRender.forEach((D, idx) => {
      const polyPts = intersectMillerPlaneWithCell(h, k, l, D, va, vb, vc, centerShift);
      if (polyPts.length >= 3) {
        // Construct triangles (fan)
        const vertices: number[] = [];
        for (let i = 1; i < polyPts.length - 1; i++) {
          vertices.push(
            polyPts[0].x, polyPts[0].y, polyPts[0].z,
            polyPts[i].x, polyPts[i].y, polyPts[i].z,
            polyPts[i + 1].x, polyPts[i + 1].y, polyPts[i + 1].z
          );
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.computeVertexNormals();

        const planeMat = new THREE.MeshStandardMaterial({
          color: idx === 0 && !showMultiPlanes ? 0x10b981 : 0x06b6d4, // emerald or cyan
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          roughness: 0.2,
          metalness: 0.1,
          depthWrite: false,
        });

        const mesh = new THREE.Mesh(geom, planeMat);
        planesGroup.add(mesh);

        // Highlight contour border of the plane
        const borderPts = [...polyPts, polyPts[0]];
        const borderGeom = new THREE.BufferGeometry().setFromPoints(borderPts);
        const borderMat = new THREE.LineBasicMaterial({
          color: idx === 0 && !showMultiPlanes ? 0x34d399 : 0x38bdf8,
          linewidth: 3,
        });
        planesGroup.add(new THREE.Line(borderGeom, borderMat));
      }
    });

    // 4. Perpendicular Normal Direction Vector [hkl]
    if (showNormalVector && (h !== 0 || k !== 0 || l !== 0)) {
      const norm = new THREE.Vector3(h, k, l).normalize();
      const origin = new THREE.Vector3(0, 0, 0);
      const length = 1.6;
      const arrowHelper = new THREE.ArrowHelper(norm, origin, length, 0xf59e0b, 0.25, 0.12);
      planesGroup.add(arrowHelper);
    }
  }, [h, k, l, showMultiPlanes, showNormalVector, showNodes]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
      {/* 3D WebGL Canvas */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto">
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              Plan ({h} {k} {l})
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-300 font-mono">
              dhkl = {dhkl.toFixed(3)} Å
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
            <button
              onClick={() => controllerRef.current?.setViewPreset('isometric')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Vue 3D
            </button>
            <button
              onClick={() => controllerRef.current?.setViewPreset('top')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Vue Dessus (001)
            </button>
            <button
              onClick={() => controllerRef.current?.setViewPreset('front')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Vue Face (010)
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="w-full h-[540px] flex-1 cursor-grab active:cursor-grabbing" />

        {/* Math & Analytical Formula Deck */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 p-4 text-xs text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-slate-400 flex items-center gap-2 font-mono">
              <span>Formule de la distance réticulaire (système cubique) :</span>
            </div>
            <div className="text-sm font-semibold text-sky-300 font-mono">
              dhkl = a / √(h² + k² + l²) = {paramA.toFixed(2)} / √({h * h + k * k + l * l}) = {dhkl.toFixed(3)} Å
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div>
              <span className="text-slate-400">Interceptions : </span>
              <span className="text-emerald-400 font-medium">
                x = {intercepts.x} | y = {intercepts.y} | z = {intercepts.z}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Deck */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* 1. Miller Indices Sliders */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Indices de Miller (h k l)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Slide 20-23</span>
          </div>

          {/* Sliders for h, k, l */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-mono">h (Axe X / a)</span>
                <span className="font-mono font-bold text-sky-400">{h}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={h}
                onChange={(e) => setH(parseInt(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-mono">k (Axe Y / b)</span>
                <span className="font-mono font-bold text-sky-400">{k}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={k}
                onChange={(e) => setK(parseInt(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-mono">l (Axe Z / c)</span>
                <span className="font-mono font-bold text-sky-400">{l}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={l}
                onChange={(e) => setL(parseInt(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            {/* Lattice constant a */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Paramètre de maille a</span>
                <span className="font-mono text-emerald-400">{paramA.toFixed(1)} Å</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.2"
                value={paramA}
                onChange={(e) => setParamA(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showMultiPlanes}
                onChange={(e) => setShowMultiPlanes(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Empilement de plans successifs (famille {`{${h}${k}${l}}`})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showNormalVector}
                onChange={(e) => setShowNormalVector(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Vecteur normal perpendiculaire [{h}{k}{l}]</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showNodes}
                onChange={(e) => setShowNodes(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
              <span>Afficher les nœuds atomiques</span>
            </label>
          </div>
        </div>

        {/* 2. Préréglages du TD (Exercice 2 Q5-Q8) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              Plans du TD & Exemples Clés
            </h3>
            <span className="text-[11px] text-slate-400">1 clic</span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {TD_PRESETS.map((p) => {
              const isSelected = h === p.h && k === p.k && l === p.l;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    setH(p.h);
                    setK(p.k);
                    setL(p.l);
                  }}
                  className={`p-2 rounded-lg text-left text-xs border transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="font-mono font-semibold">{p.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{p.tdNote}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
