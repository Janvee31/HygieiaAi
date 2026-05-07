declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import { Object3D, Scene } from 'three';
  
  export class GLTFLoader {
    constructor();
    load(
      url: string,
      onLoad: (gltf: { scene: Object3D }) => void,
      onProgress?: (event: { loaded: number; total: number }) => void,
      onError?: (error: Error) => void
    ): void;
  }
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, WebGLRenderer } from 'three';
  
  export class OrbitControls {
    constructor(camera: Camera, domElement: HTMLElement);
    enableDamping: boolean;
    dampingFactor: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    update(): void;
  }
}
