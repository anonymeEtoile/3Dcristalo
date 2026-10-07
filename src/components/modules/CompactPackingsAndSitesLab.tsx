import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimpleOrbitController } from '../3d/OrbitControlsHelper';
import { INTERSTITIAL_SITES_DATA } from '../../data/crystallographyData';
import { InterstitialSite } from '../../types/crystallography';
import { Layers, Activity, Sparkles, Sliders, Info, Zap } from 'lucide-react';

export default function CompactPackingsAndSitesLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SimpleOrbitController | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const visualGroupRef = useRef<THREE.Group | null>(null);

  // Submode: 'packings' (ABAB vs ABCABC) or 'sites' (T, O, C polyhedra) or 'madelung'
  const [subMode, setSubMode] = useState<'packings' | 'sites' | 'madelung'>('sites');

  // Packing state
  const [packingType, setPackingType] = useState<'ABAB' | 'ABCABC'>('ABCABC');
  const [showLayerA, setShowLayerA] = useState(true);
  const [showLayerB, setShowLayerB] = useState(true);
  const [showLayerC, setShowLayerC] = useState(true);

  // Sites state
  const [selectedSiteType, setSelectedSiteType] = useState<'C' | 'O' | 'T'>('O');
  const [cationRatio, setCationRatio] = useState<number>(0.414); // r/R slider

  // Madelung state
  const [madelungStructure, setMadelungStructure] = useState<'NaCl' | 'CsCl' | 'CaF2' | 'ZnS'>('NaCl');
  const [bornExponentN, setBornExponentN] = useState<number>(9);

  const activeSiteInfo = useMemo(() => {
    return INTERSTITIAL_SITES_DATA.find((s) => s.type === selectedSiteType) || INTERSTITIAL_SITES_DATA[1];
  }, [selectedSiteType]);

  // Check contact condition
  const contactStatus = useMemo(() => {
    const lim = activeSiteInfo.maxRatio;
    if (cationRatio > lim + 0.05) {
      return {
        label: 'Dilatation du réseau hôte',
        desc: 'Le cation est trop volumineux et écarte les anions (perte de contact direct anion-anion).',
        color: 'text-amber-400',
      };
    } else if (cationRatio < (selectedSiteType === 'C' ? 0.732 : selectedSiteType === 'O' ? 0.414 : 0.225) - 0.05) {
      return {
        label: 'Sous-dimensionné (Instable)',
        desc: 'Le cation est trop petit : risque d\'instabilité coulombienne ou passage à une coordinence inférieure.',
        color: 'text-rose-400',
      };
    } else {
      return {
        label: 'Idéal / Contact Parfait',
        desc: 'Contact simultané cation-anion sans déformation du réseau hôte.',
        color: 'text-emerald-400',
      };
    }
  }, [cationRatio, activeSiteInfo, selectedSiteType]);

  // Setup Three.js
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

    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dir2.position.set(-5, -5, -5);
    scene.add(dir2);

    const visualGroup = new THREE.Group();
    scene.add(visualGroup);
    visualGroupRef.current = visualGroup;

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

  // Render 3D Objects based on subMode
  useEffect(() => {
    const group = visualGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    if (subMode === 'sites') {
      // Render the Interstitial Polyhedron (T, O, or C)
      const R = 0.55; // host anion radius
      const r = R * cationRatio; // interstitial cation radius
      const anionMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.85,
        roughness: 0.25,
      });
      const cationMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(activeSiteInfo.color),
        roughness: 0.2,
        metalness: 0.3,
      });

      // Interstitial cation at center
      const cationMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), cationMat);
      cationMesh.position.set(0, 0, 0);
      group.add(cationMesh);

      let anionPositions: THREE.Vector3[] = [];
      let polyGeo: THREE.BufferGeometry | null = null;

      if (selectedSiteType === 'C') {
        // Cubic: 8 anions at corners of a cube of edge d = 2*R
        const d = R * 1.35;
        for (let x = -1; x <= 1; x += 2) {
          for (let y = -1; y <= 1; y += 2) {
            for (let z = -1; z <= 1; z += 2) {
              anionPositions.push(new THREE.Vector3(x * d, y * d, z * d));
            }
          }
        }
        polyGeo = new THREE.BoxGeometry(2 * d, 2 * d, 2 * d);
      } else if (selectedSiteType === 'O') {
        // Octahedral: 6 anions at +/-d on X, Y, Z
        const d = R * 1.5;
        anionPositions = [
          new THREE.Vector3(d, 0, 0),
          new THREE.Vector3(-d, 0, 0),
          new THREE.Vector3(0, d, 0),
          new THREE.Vector3(0, -d, 0),
          new THREE.Vector3(0, 0, d),
          new THREE.Vector3(0, 0, -d),
        ];
        polyGeo = new THREE.OctahedronGeometry(d);
      } else if (selectedSiteType === 'T') {
        // Tetrahedral: 4 anions at alternating corners of a cube
        const d = R * 1.4;
        anionPositions = [
          new THREE.Vector3(d, d, d),
          new THREE.Vector3(-d, -d, d),
          new THREE.Vector3(-d, d, -d),
          new THREE.Vector3(d, -d, -d),
        ];
        polyGeo = new THREE.TetrahedronGeometry(d * 1.5);
      }

      // Add anions
      anionPositions.forEach((pos) => {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 20), anionMat);
        sphere.position.copy(pos);
        group.add(sphere);

        // Bond line to center
        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x94a3b8 }));
        group.add(line);
      });

      // Add translucent coordination polyhedron wireframe/surface
      if (polyGeo) {
        const polyMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(activeSiteInfo.color),
          transparent: true,
          opacity: 0.15,
          wireframe: true,
        });
        group.add(new THREE.Mesh(polyGeo, polyMat));
      }
    } else if (subMode === 'packings') {
      // 3D Compact stacking (ABAB vs ABCABC)
      const R = 0.32;
      const layerSpacing = R * Math.sqrt(8 / 3); // ~ 1.633 R

      // Layer A hexagonal grid
      const addHexLayer = (z: number, color: number, offsetX: number = 0, offsetY: number = 0) => {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
        const sphereGeo = new THREE.SphereGeometry(R, 18, 18);
        const rows = 3;
        const cols = 3;
        for (let i = -rows; i <= rows; i++) {
          for (let j = -cols; j <= cols; j++) {
            const x = (i + (j % 2) * 0.5) * (2 * R) + offsetX;
            const y = j * (Math.sqrt(3) * R) + offsetY;
            if (Math.hypot(x, y) < 1.4) {
              const mesh = new THREE.Mesh(sphereGeo, mat);
              mesh.position.set(x, y, z);
              group.add(mesh);
            }
          }
        }
      };

      // Layer A at z = -layerSpacing
      if (showLayerA) addHexLayer(-layerSpacing, 0x10b981, 0, 0); // Green

      // Layer B (crevices G1) at z = 0
      const offsetBx = 0;
      const offsetBy = (2 * R) / Math.sqrt(3);
      if (showLayerB) addHexLayer(0, 0xf59e0b, offsetBx, offsetBy); // Amber

      // Layer C or 2nd Layer A at z = +layerSpacing
      if (packingType === 'ABAB') {
        // ABAB: Layer A superposed exactly over first Layer A
        if (showLayerC) addHexLayer(layerSpacing, 0x10b981, 0, 0);
      } else {
        // ABCABC: Layer C at crevices G2
        const offsetCx = R;
        const offsetCy = R / Math.sqrt(3);
        if (showLayerC) addHexLayer(layerSpacing, 0x38bdf8, offsetCx, offsetCy); // Cyan
      }
    } else if (subMode === 'madelung') {
      // 3D Ionic pair interaction visualization
      const rEq = 1.0;
      const cationGeo = new THREE.SphereGeometry(0.3, 24, 24);
      const anionGeo = new THREE.SphereGeometry(0.4, 24, 24);
      const catMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
      const anMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2 });

      const catMesh = new THREE.Mesh(cationGeo, catMat);
      catMesh.position.set(-rEq / 2, 0, 0);
      const anMesh = new THREE.Mesh(anionGeo, anMat);
      anMesh.position.set(rEq / 2, 0, 0);
      group.add(catMesh);
      group.add(anMesh);

      // Force arrows between them (electrostatic attraction vs electronic repulsion)
      const arrowAttract = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-0.9, 0, 0),
        0.5,
        0xef4444,
        0.15,
        0.08
      );
      group.add(arrowAttract);
      const arrowAttract2 = new THREE.ArrowHelper(
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0.9, 0, 0),
        0.5,
        0xef4444,
        0.15,
        0.08
      );
      group.add(arrowAttract2);
    }
  }, [subMode, selectedSiteType, cationRatio, packingType, showLayerA, showLayerB, showLayerC, madelungStructure]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
      {/* 3D WebGL Canvas */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        {/* Top Navigation HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
            <button
              onClick={() => setSubMode('sites')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                subMode === 'sites' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Sites Interstitiels (T, O, C)
            </button>
            <button
              onClick={() => setSubMode('packings')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                subMode === 'packings' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Empilements (ABAB vs ABCABC)
            </button>
            <button
              onClick={() => setSubMode('madelung')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                subMode === 'madelung' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Énergie de Cohésion (Madelung)
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
            <button
              onClick={() => controllerRef.current?.setViewPreset('isometric')}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Reset 3D
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="w-full h-[520px] flex-1 cursor-grab active:cursor-grabbing" />

        {/* Bottom Context Banner */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 p-4 text-xs text-slate-300 flex items-start justify-between gap-4">
          {subMode === 'sites' && (
            <div>
              <div className="font-semibold text-slate-100 flex items-center gap-2">
                <span>{activeSiteInfo.name} (Coordinence [{activeSiteInfo.coordination}])</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-sky-400">{activeSiteInfo.ratioFormula}</span>
              </div>
              <div className="text-slate-400 mt-0.5">{activeSiteInfo.description}</div>
            </div>
          )}

          {subMode === 'packings' && (
            <div>
              <div className="font-semibold text-slate-100">
                {packingType === 'ABAB'
                  ? 'Structure Hexagonale Compacte (hc / hcp) : Période ABAB · c/a = √(8/3) ≈ 1.633 · Compacité 74%'
                  : 'Structure Cubique à Faces Centrées (cfc / fcc) : Période ABCABC · Plans denses (111) · Compacité 74%'}
              </div>
              <div className="text-slate-400 mt-0.5">
                Chaque sphère est entourée de 12 voisines (coordinence 12 = 6 dans son plan + 3 au-dessus + 3 en-dessous).
              </div>
            </div>
          )}

          {subMode === 'madelung' && (
            <div>
              <div className="font-semibold text-slate-100 font-mono">
                Énergie réticulaire : ER = - (z+ |z-| e² M NA) / (4πε0 d0) × (1 - 1/n)
              </div>
              <div className="text-slate-400 mt-0.5">
                Minimum du potentiel à l'équilibre r = d0. Dépend de la géométrie du réseau via la constante M de Madelung.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Deck */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {subMode === 'sites' && (
          <>
            {/* 1. Site Selector */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Type de Site Interstitiel
                </h3>
                <span className="text-xs text-slate-400 font-mono">Slides 44-48</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {INTERSTITIAL_SITES_DATA.map((site) => {
                  const isSelected = selectedSiteType === site.type;
                  return (
                    <button
                      key={site.type}
                      onClick={() => {
                        setSelectedSiteType(site.type);
                        setCationRatio(site.maxRatio);
                      }}
                      className={`p-2.5 rounded-lg border text-center text-xs transition-colors ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 text-sky-200 ring-1 ring-sky-500/30'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="font-bold text-sm" style={{ color: site.color }}>
                        Site "{site.type}"
                      </div>
                      <div className="text-[11px] text-slate-300">Coord. [{site.coordination}]</div>
                      <div className="text-[10px] text-slate-400 font-mono">r/R ≤ {site.maxRatio}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Cation Size Slider & Contact Rules */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Rapport de Rayon (r / R)
                </h3>
                <span className="text-xs font-mono font-bold text-sky-400">{cationRatio.toFixed(3)}</span>
              </div>

              <input
                type="range"
                min="0.10"
                max="1.0"
                step="0.005"
                value={cationRatio}
                onChange={(e) => setCationRatio(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />

              {/* Status card */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs">
                <div className={`font-semibold ${contactStatus.color}`}>{contactStatus.label}</div>
                <div className="text-slate-400 mt-1">{contactStatus.desc}</div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <strong>Règle d'or (Slide 48) :</strong> L'atome d'insertion doit occuper le site sans déformer le réseau hôte (r ≤ r_max) et être le plus ajusté possible.
              </div>
            </div>
          </>
        )}

        {subMode === 'packings' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Mode d'Empilement Dense
              </h3>
              <span className="text-xs text-slate-400 font-mono">Slides 49-56</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPackingType('ABAB')}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  packingType === 'ABAB'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-100">ABAB</div>
                <div className="text-slate-400 text-[11px]">Hexagonal Compact (hc)</div>
              </button>

              <button
                onClick={() => setPackingType('ABCABC')}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  packingType === 'ABCABC'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-100">ABCABC</div>
                <div className="text-slate-400 text-[11px]">Cubique Faces Centrées (cfc)</div>
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="font-semibold text-slate-300">Affichage des plans :</div>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLayerA}
                  onChange={(e) => setShowLayerA(e.target.checked)}
                  className="rounded text-emerald-500 bg-slate-950 border-slate-700"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Couche A (Plan hexagonal de base)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLayerB}
                  onChange={(e) => setShowLayerB(e.target.checked)}
                  className="rounded text-amber-500 bg-slate-950 border-slate-700"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Couche B (Creux G₁)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLayerC}
                  onChange={(e) => setShowLayerC(e.target.checked)}
                  className="rounded text-sky-500 bg-slate-950 border-slate-700"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>{packingType === 'ABAB' ? 'Couche A\' (superposée à A)' : 'Couche C (Creux G₂)'}</span>
              </label>
            </div>
          </div>
        )}

        {subMode === 'madelung' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Constante de Madelung (M)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Slides 31-35</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'NaCl', m: 1.748 },
                { name: 'CsCl', m: 1.763 },
                { name: 'CaF2', m: 2.519 },
                { name: 'ZnS (blende)', m: 1.638 },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setMadelungStructure(item.name as any)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                    madelungStructure === item.name
                      ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[11px] font-mono text-amber-400">M = {item.m}</div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Indice de Born (n) :</span>
                <span className="font-mono font-bold text-amber-400">{bornExponentN}</span>
              </div>
              <input
                type="range"
                min="5"
                max="12"
                step="1"
                value={bornExponentN}
                onChange={(e) => setBornExponentN(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                Facteur de répulsion : (1 - 1/n) = {(1 - 1 / bornExponentN).toFixed(3)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
