import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitController } from '../3d/OrbitControlsHelper';
import { RotateCw, Eye, Sparkles, Layers, Compass, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function CubeSymmetryLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SimpleOrbitController | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const animRotationRef = useRef<{ axis: THREE.Vector3; remaining: number; speed: number } | null>(null);

  // Symmetry toggles
  const [showA4, setShowA4] = useState(true);
  const [showA3, setShowA3] = useState(false);
  const [showA2, setShowA2] = useState(false);
  const [showM4, setShowM4] = useState(false);
  const [showM2, setShowM2] = useState(false);
  const [showCenterC, setShowCenterC] = useState(true);

  // Bravais & MRT modes
  const [bravaisMode, setBravaisMode] = useState<'P' | 'I' | 'F' | 'C_forbidden'>('P');
  const [isMRTProjection, setIsMRTProjection] = useState(false);
  const [cubeOpacity, setCubeOpacity] = useState(0.25);
  const [selectedElementInfo, setSelectedElementInfo] = useState<string | null>(
    '3 axes A₄ (ordre 4, rotation 90°) reliant les centres des faces opposées.'
  );

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b1120); // deep slate slate-950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 3.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controller = new SimpleOrbitController(camera, renderer.domElement);
    controllerRef.current = controller;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.6);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Cube parent group (rotates during symmetry operations)
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    cubeGroupRef.current = cubeGroup;

    // Subtle coordinate axes helper at bottom corner
    const axesHelper = new THREE.AxesHelper(1.6);
    axesHelper.position.set(-1.4, -1.4, -1.4);
    scene.add(axesHelper);

    // Animation loop
    let reqId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      reqId = requestAnimationFrame(animate);
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle animated symmetry rotation
      if (animRotationRef.current && cubeGroupRef.current) {
        const anim = animRotationRef.current;
        const step = Math.min(anim.speed * delta, anim.remaining);
        cubeGroupRef.current.rotateOnAxis(anim.axis, step);
        anim.remaining -= step;
        if (anim.remaining <= 1e-4) {
          animRotationRef.current = null;
        }
      }

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

  // Trigger smooth rotation along chosen axis
  const triggerAxisRotation = (axis: THREE.Vector3, angleRad: number) => {
    // If already animating, complete it immediately
    animRotationRef.current = {
      axis: axis.clone().normalize(),
      remaining: angleRad,
      speed: 3.5, // rad/s
    };
  };

  // Build the 3D cube and its symmetry objects whenever state updates
  useEffect(() => {
    const cubeGroup = cubeGroupRef.current;
    if (!cubeGroup) return;

    // Clear previous children
    while (cubeGroup.children.length > 0) {
      const obj = cubeGroup.children[0];
      cubeGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    const a = 2.0; // cube size (-1 to +1)

    // 1. Semi-transparent Glass Cube mesh
    const cubeGeom = new THREE.BoxGeometry(a, a, a);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: cubeOpacity,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.4,
      depthWrite: false,
    });
    const cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
    cubeGroup.add(cubeMesh);

    // 2. Crisp edges wireframe
    const edgesGeom = new THREE.EdgesGeometry(cubeGeom);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });
    const edgesLine = new THREE.LineSegments(edgesGeom, edgesMat);
    cubeGroup.add(edgesLine);

    // 3. Atom Nodes based on Bravais mode
    const sphereGeom = new THREE.SphereGeometry(0.12, 24, 24);
    const cornerMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.2,
    });

    // 8 Corners for all modes (P)
    const corners: [number, number, number][] = [
      [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1],
    ];

    corners.forEach(([x, y, z]) => {
      const sphere = new THREE.Mesh(sphereGeom, cornerMat);
      sphere.position.set(x, y, z);
      cubeGroup.add(sphere);
    });

    // Mode I (Centré): 1 atom at center
    if (bravaisMode === 'I') {
      const centerAtomMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
      const centerAtom = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), centerAtomMat);
      centerAtom.position.set(0, 0, 0);
      cubeGroup.add(centerAtom);
    }

    // Mode F (Faces Centrées): 6 atoms at face centers
    if (bravaisMode === 'F') {
      const faceMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
      const facePositions: [number, number, number][] = [
        [0, 0, 1], [0, 0, -1],
        [0, 1, 0], [0, -1, 0],
        [1, 0, 0], [-1, 0, 0],
      ];
      facePositions.forEach(([x, y, z]) => {
        const atom = new THREE.Mesh(sphereGeom, faceMat);
        atom.position.set(x, y, z);
        cubeGroup.add(atom);
      });
    }

    // Mode C (Base Centrée - INTERDIT DANS LE CUBIQUE): only 2 faces centered!
    if (bravaisMode === 'C_forbidden') {
      const cMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const cPositions: [number, number, number][] = [
        [0, 0, 1], [0, 0, -1], // only top and bottom
      ];
      cPositions.forEach(([x, y, z]) => {
        const atom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), cMat);
        atom.position.set(x, y, z);
        cubeGroup.add(atom);
      });
    }

    // --- SYMMETRY ELEMENTS ---

    // A. 3 Axes A4 (Cyan, Order 4 = 90°)
    if (showA4) {
      const a4Color = 0x06b6d4;
      const a4Axes = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
      ];

      a4Axes.forEach((axisDir) => {
        // Line extending through face centers
        const pts = [
          axisDir.clone().multiplyScalar(-1.7),
          axisDir.clone().multiplyScalar(1.7),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({ color: a4Color, linewidth: 3 });
        cubeGroup.add(new THREE.Line(lineGeo, lineMat));

        // Cones at ends
        const coneGeo = new THREE.ConeGeometry(0.08, 0.22, 16);
        const coneMat = new THREE.MeshBasicMaterial({ color: a4Color });
        const cone1 = new THREE.Mesh(coneGeo, coneMat);
        cone1.position.copy(axisDir.clone().multiplyScalar(1.7));
        cone1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisDir);
        cubeGroup.add(cone1);

        const cone2 = new THREE.Mesh(coneGeo, coneMat);
        cone2.position.copy(axisDir.clone().multiplyScalar(-1.7));
        cone2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisDir.clone().negate());
        cubeGroup.add(cone2);
      });
    }

    // B. 4 Axes A3 (Amber, Order 3 = 120°) along body diagonals
    if (showA3) {
      const a3Color = 0xf59e0b;
      const a3Dirs = [
        new THREE.Vector3(1, 1, 1).normalize(),
        new THREE.Vector3(-1, 1, 1).normalize(),
        new THREE.Vector3(1, -1, 1).normalize(),
        new THREE.Vector3(1, 1, -1).normalize(),
      ];

      a3Dirs.forEach((dir) => {
        const pts = [
          dir.clone().multiplyScalar(-2.3),
          dir.clone().multiplyScalar(2.3),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineDashedMaterial({
          color: a3Color,
          dashSize: 0.15,
          gapSize: 0.08,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        cubeGroup.add(line);

        const coneGeo = new THREE.ConeGeometry(0.07, 0.2, 16);
        const coneMat = new THREE.MeshBasicMaterial({ color: a3Color });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.copy(dir.clone().multiplyScalar(2.3));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        cubeGroup.add(cone);
      });
    }

    // C. 6 Axes A2 (Purple, Order 2 = 180°) passing through edge midpoints
    if (showA2) {
      const a2Color = 0xa855f7;
      const a2Dirs = [
        new THREE.Vector3(1, 1, 0).normalize(),
        new THREE.Vector3(1, -1, 0).normalize(),
        new THREE.Vector3(1, 0, 1).normalize(),
        new THREE.Vector3(1, 0, -1).normalize(),
        new THREE.Vector3(0, 1, 1).normalize(),
        new THREE.Vector3(0, 1, -1).normalize(),
      ];

      a2Dirs.forEach((dir) => {
        const pts = [
          dir.clone().multiplyScalar(-1.8),
          dir.clone().multiplyScalar(1.8),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({ color: a2Color });
        cubeGroup.add(new THREE.Line(lineGeo, lineMat));
      });
    }

    // D. 3 Miroirs m4 (Planes perpendicular to A4 axes)
    if (showM4) {
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const planeGeo = new THREE.PlaneGeometry(2.1, 2.1);

      // xy plane (z = 0)
      const pXY = new THREE.Mesh(planeGeo, planeMat);
      cubeGroup.add(pXY);

      // yz plane (x = 0)
      const pYZ = new THREE.Mesh(planeGeo, planeMat);
      pYZ.rotateY(Math.PI / 2);
      cubeGroup.add(pYZ);

      // xz plane (y = 0)
      const pXZ = new THREE.Mesh(planeGeo, planeMat);
      pXZ.rotateX(Math.PI / 2);
      cubeGroup.add(pXZ);
    }

    // E. 6 Miroirs m2 (Diagonal planes through opposite edges)
    if (showM2) {
      const m2Mat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      // Diagonal length = sqrt(2^2 + 2^2) = 2.828
      const diagGeo = new THREE.PlaneGeometry(2.83, 2.05);

      // Plane x = y
      const p1 = new THREE.Mesh(diagGeo, m2Mat);
      p1.rotateZ(Math.PI / 4);
      cubeGroup.add(p1);

      // Plane x = -y
      const p2 = new THREE.Mesh(diagGeo, m2Mat);
      p2.rotateZ(-Math.PI / 4);
      cubeGroup.add(p2);

      // Plane y = z
      const p3 = new THREE.Mesh(diagGeo, m2Mat);
      p3.rotateX(Math.PI / 4);
      cubeGroup.add(p3);

      // Plane y = -z
      const p4 = new THREE.Mesh(diagGeo, m2Mat);
      p4.rotateX(-Math.PI / 4);
      cubeGroup.add(p4);

      // Plane x = z
      const p5 = new THREE.Mesh(diagGeo, m2Mat);
      p5.rotateY(Math.PI / 4);
      cubeGroup.add(p5);

      // Plane x = -z
      const p6 = new THREE.Mesh(diagGeo, m2Mat);
      p6.rotateY(-Math.PI / 4);
      cubeGroup.add(p6);
    }

    // F. Centre de Symétrie / Inversion C
    if (showCenterC) {
      const centerGeo = new THREE.SphereGeometry(0.1, 24, 24);
      const centerMat = new THREE.MeshStandardMaterial({
        color: 0xe0e7ff,
        emissive: 0x6366f1,
        emissiveIntensity: 0.6,
      });
      const centerMesh = new THREE.Mesh(centerGeo, centerMat);
      cubeGroup.add(centerMesh);

      // Subtle inversion lines connecting opposite corners through C
      const invMat = new THREE.LineDashedMaterial({
        color: 0x818cf8,
        dashSize: 0.08,
        gapSize: 0.08,
      });
      for (let i = 0; i < 4; i++) {
        const c1 = corners[i];
        const c2 = corners[7 - i];
        const geom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...c1),
          new THREE.Vector3(...c2),
        ]);
        const line = new THREE.Line(geom, invMat);
        line.computeLineDistances();
        cubeGroup.add(line);
      }
    }
  }, [showA4, showA3, showA2, showM4, showM2, showCenterC, bravaisMode, cubeOpacity]);

  // Adjust camera for MRT projection mode (Exercice 2 Q2)
  const toggleMRT = () => {
    const next = !isMRTProjection;
    setIsMRTProjection(next);
    if (controllerRef.current) {
      if (next) {
        controllerRef.current.setViewPreset('a3_111');
        setSelectedElementInfo(
          'Vue MRT (Exercice 2 Q2) : Projection orthogonale sur le plan perpendiculaire à l\'axe A₃ [111]. Le cube se projette en hexagone régulier avec les sommets aux cotes 0, a/3, 2a/3 et a.'
        );
      } else {
        controllerRef.current.setViewPreset('isometric');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
      {/* 3D WebGL Canvas Viewport */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        {/* Canvas Toolbar & HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto">
            <span className="text-xs font-semibold text-sky-400">Cube & Symétries (Oh)</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">48 Opérations de symétrie</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
            <button
              onClick={() => controllerRef.current?.setViewPreset('isometric')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Isométrique
            </button>
            <button
              onClick={() => controllerRef.current?.setViewPreset('front')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Face A₄
            </button>
            <button
              onClick={toggleMRT}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                isMRTProjection
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800'
              }`}
            >
              Vue MRT [111]
            </button>
            <button
              onClick={() => {
                if (cubeGroupRef.current) cubeGroupRef.current.rotation.set(0, 0, 0);
                controllerRef.current?.setViewPreset('isometric');
              }}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Réinitialiser rotation"
            >
              Reset
            </button>
          </div>
        </div>

        {/* WebGL Canvas */}
        <div ref={containerRef} className="w-full h-[540px] flex-1 cursor-grab active:cursor-grabbing" />

        {/* In-Canvas Explanatory Context Bar */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 p-3.5 text-xs text-slate-300 flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-slate-200 font-medium">
              {selectedElementInfo || 'Sélectionnez un élément ou appliquez une symétrie ci-contre.'}
            </div>
            {isMRTProjection && (
              <div className="mt-1 text-amber-300/90 font-mono text-[11px]">
                Cotes des sommets projetés : 1 sommet à h=0 · 3 sommets à h=a/3 · 3 sommets à h=2a/3 · 1 sommet à h=a.
                {bravaisMode === 'F' && ' (En CFC, les 6 centres de faces se projettent à h=a/3 et 2a/3).'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Deck & Interactive Symmetry Operators */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* 1. Interactive Symmetry Elements Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Éléments de Symétrie du Cube
            </h3>
            <span className="text-xs text-slate-400 font-mono">TD Ex. 2</span>
          </div>

          <div className="space-y-2">
            {/* 3 Axes A4 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={showA4}
                  onChange={(e) => {
                    setShowA4(e.target.checked);
                    setSelectedElementInfo('3 axes A₄ : Perpendiculaires aux faces carrées. Rotation α = 360°/4 = 90°.');
                  }}
                  className="rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>3 Axes A₄ (ordre 4)</span>
              </label>
              <button
                onClick={() => triggerAxisRotation(new THREE.Vector3(0, 1, 0), Math.PI / 2)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 transition-colors"
                title="Faire tourner le cube de 90° autour de l'axe vertical A4"
              >
                <RotateCw className="w-3 h-3" />
                <span>+90°</span>
              </button>
            </div>

            {/* 4 Axes A3 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={showA3}
                  onChange={(e) => {
                    setShowA3(e.target.checked);
                    setSelectedElementInfo('4 axes A₃ : Selon les 4 grandes diagonales [111]. Rotation α = 360°/3 = 120°.');
                  }}
                  className="rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>4 Axes A₃ (ordre 3)</span>
              </label>
              <button
                onClick={() => triggerAxisRotation(new THREE.Vector3(1, 1, 1), (2 * Math.PI) / 3)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 transition-colors"
                title="Faire tourner le cube de 120° autour de la grande diagonale [111]"
              >
                <RotateCw className="w-3 h-3" />
                <span>+120°</span>
              </button>
            </div>

            {/* 6 Axes A2 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={showA2}
                  onChange={(e) => {
                    setShowA2(e.target.checked);
                    setSelectedElementInfo('6 axes A₂ : Joignant les milieux d\'arêtes opposées. Rotation α = 180°.');
                  }}
                  className="rounded text-purple-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <span>6 Axes A₂ (ordre 2)</span>
              </label>
              <button
                onClick={() => triggerAxisRotation(new THREE.Vector3(1, 1, 0), Math.PI)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 transition-colors"
                title="Faire tourner le cube de 180° autour d'un axe A2"
              >
                <RotateCw className="w-3 h-3" />
                <span>+180°</span>
              </button>
            </div>

            {/* 3 Miroirs m4 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={showM4}
                  onChange={(e) => {
                    setShowM4(e.target.checked);
                    setSelectedElementInfo('3 miroirs m₄ : Plans médiateurs des axes A₄, parallèles aux faces.');
                  }}
                  className="rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-300"></span>
                <span>3 Miroirs m₄ (parallèles faces)</span>
              </label>
            </div>

            {/* 6 Miroirs m2 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={showM2}
                  onChange={(e) => {
                    setShowM2(e.target.checked);
                    setSelectedElementInfo('6 miroirs m₂ : Plans diagonaux passant par deux arêtes opposées.');
                  }}
                  className="rounded text-rose-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span>6 Miroirs m₂ (diagonaux)</span>
              </label>
            </div>

            {/* Centre de symétrie C */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={showCenterC}
                  onChange={(e) => {
                    setShowCenterC(e.target.checked);
                    setSelectedElementInfo('Centre d\'inversion C : Inverse chaque sommet r ➔ -r à travers le centre du cube.');
                  }}
                  className="rounded text-indigo-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                <span>Centre d'Inversion C</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Bravais Mode & Exercice 2 Q4 Test */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Modes de Réseau du Système Cubique
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Q4 du TD</span>
          </div>

          <p className="text-xs text-slate-400">
            Pourquoi le mode <strong className="text-rose-400">Base Centrée C</strong> est-il rigoureusement interdit dans le cubique ?
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setBravaisMode('P');
                setSelectedElementInfo('Mode P (Primitif / Simple) : 1 nœud à chaque sommet. Multiplicité m = 1.');
              }}
              className={`p-2 text-left rounded-lg border text-xs transition-colors ${
                bravaisMode === 'P'
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-slate-200">Mode P</div>
              <div className="text-[11px] text-slate-400">Simple (Z = 1)</div>
            </button>

            <button
              onClick={() => {
                setBravaisMode('I');
                setSelectedElementInfo('Mode I (Centré) : P + 1 nœud au centre de la maille. Multiplicité m = 2.');
              }}
              className={`p-2 text-left rounded-lg border text-xs transition-colors ${
                bravaisMode === 'I'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-slate-200">Mode I</div>
              <div className="text-[11px] text-slate-400">Centré (Z = 2)</div>
            </button>

            <button
              onClick={() => {
                setBravaisMode('F');
                setSelectedElementInfo('Mode F (Faces Centrées) : P + 6 centres de faces. Multiplicité m = 4.');
              }}
              className={`p-2 text-left rounded-lg border text-xs transition-colors ${
                bravaisMode === 'F'
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-slate-200">Mode F</div>
              <div className="text-[11px] text-slate-400">Faces Centrées (Z = 4)</div>
            </button>

            <button
              onClick={() => {
                setBravaisMode('C_forbidden');
                setSelectedElementInfo(
                  'INTERDIT : Centrer seulement 2 faces (en rouge) brise la symétrie A₃ ! La direction Z est privilégiée, le système devient quadratique.'
                );
              }}
              className={`p-2 text-left rounded-lg border text-xs transition-colors ${
                bravaisMode === 'C_forbidden'
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-200 ring-1 ring-rose-500'
                  : 'bg-slate-950/40 border-slate-800 text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <div className="font-semibold text-rose-300">Mode C (Test)</div>
              <div className="text-[11px] text-rose-400">Interdit en cubique ✕</div>
            </button>
          </div>

          {/* Opacity slider */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Transparence maille</span>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={cubeOpacity}
              onChange={(e) => setCubeOpacity(parseFloat(e.target.value))}
              className="w-28 accent-sky-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
