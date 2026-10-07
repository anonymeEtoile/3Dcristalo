import * as THREE from 'three';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export class SimpleOrbitController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  public target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Spherical coordinates
  private spherical: THREE.Spherical = new THREE.Spherical(5, Math.PI / 3, Math.PI / 4);
  private targetSpherical: THREE.Spherical = new THREE.Spherical(5, Math.PI / 3, Math.PI / 4);
  private currentTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private isPointerDown = false;
  private isPanning = false;
  private previousPointerPosition = { x: 0, y: 0 };

  public minDistance = 1.2;
  public maxDistance = 25.0;
  public dampingFactor = 0.12;
  public autoRotate = false;
  public autoRotateSpeed = 0.8;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Initialize spherical from current camera position
    const offset = new THREE.Vector3().subVectors(camera.position, this.target);
    this.spherical.setFromVector3(offset);
    this.targetSpherical.copy(this.spherical);

    this.bindEvents();
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.isPanning = e.button === 2 || e.shiftKey;
    this.previousPointerPosition = { x: e.clientX, y: e.clientY };
    this.domElement.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;

    const deltaX = e.clientX - this.previousPointerPosition.x;
    const deltaY = e.clientY - this.previousPointerPosition.y;

    if (this.isPanning) {
      // Pan camera & target in plane perpendicular to view
      const distance = this.camera.position.distanceTo(this.target);
      const factor = (distance * 0.0015);
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();

      this.camera.matrix.extractBasis(right, up, new THREE.Vector3());
      right.multiplyScalar(-deltaX * factor);
      up.multiplyScalar(deltaY * factor);

      this.target.add(right).add(up);
    } else {
      // Rotate
      const rotateSpeed = 0.006;
      this.targetSpherical.theta -= deltaX * rotateSpeed;
      this.targetSpherical.phi -= deltaY * rotateSpeed;

      // Restrict phi to avoid gimbal lock flip
      const epsilon = 0.01;
      this.targetSpherical.phi = Math.max(epsilon, Math.min(Math.PI - epsilon, this.targetSpherical.phi));
    }

    this.previousPointerPosition = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent) => {
    this.isPointerDown = false;
    this.isPanning = false;
    try {
      this.domElement.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = Math.pow(0.95, e.deltaY * 0.01);
    this.targetSpherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.targetSpherical.radius * zoomFactor)
    );
  };

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private bindEvents() {
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('pointercancel', this.onPointerUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  public unbindEvents() {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointercancel', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }

  public setViewPreset(preset: 'isometric' | 'top' | 'front' | 'side' | 'a3_111') {
    switch (preset) {
      case 'isometric':
        this.target.set(0, 0, 0);
        this.targetSpherical.radius = 5.2;
        this.targetSpherical.phi = Math.PI / 3.2;
        this.targetSpherical.theta = Math.PI / 4;
        break;
      case 'top': // Along Z (or Y depending on orientation)
        this.target.set(0, 0, 0);
        this.targetSpherical.radius = 4.8;
        this.targetSpherical.phi = 0.05;
        this.targetSpherical.theta = 0;
        break;
      case 'front':
        this.target.set(0, 0, 0);
        this.targetSpherical.radius = 4.8;
        this.targetSpherical.phi = Math.PI / 2;
        this.targetSpherical.theta = 0;
        break;
      case 'side':
        this.target.set(0, 0, 0);
        this.targetSpherical.radius = 4.8;
        this.targetSpherical.phi = Math.PI / 2;
        this.targetSpherical.theta = Math.PI / 2;
        break;
      case 'a3_111': // Looking exactly down [111] body diagonal (Exercice 2 Q2 MRT projection view!)
        this.target.set(0, 0, 0);
        this.targetSpherical.radius = 5.0;
        // Direction [1, 1, 1] normalized
        const diag = new THREE.Vector3(1, 1, 1).normalize();
        const sph = new THREE.Spherical().setFromVector3(diag);
        this.targetSpherical.phi = sph.phi;
        this.targetSpherical.theta = sph.theta;
        break;
    }
  }

  public update(delta: number = 0.016) {
    if (this.autoRotate && !this.isPointerDown) {
      this.targetSpherical.theta += this.autoRotateSpeed * delta;
    }

    // Damped interpolation
    this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * this.dampingFactor;
    this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * this.dampingFactor;
    this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * this.dampingFactor;

    this.currentTarget.lerp(this.target, this.dampingFactor);

    // Update camera position from spherical + target
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.currentTarget).add(offset);
    this.camera.lookAt(this.currentTarget);
  }
}
