'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ModelViewerProps {
  modelPath: string;
  className?: string;
  autoRotate?: boolean;
}

export default function ModelViewer({ modelPath, className = '', autoRotate = true }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any existing content
    containerRef.current.innerHTML = '';
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 1;
    
    // Create renderer with proper settings for transparency
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Append renderer to container
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.pointerEvents = 'none';
    
    // Set up lighting for better visibility
    // Main ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    // Directional lights from multiple angles for better illumination
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);
    
    const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);
    
    const leftLight = new THREE.DirectionalLight(0xffffff, 0.8);
    leftLight.position.set(-5, 0, 0);
    scene.add(leftLight);
    
    // Add a point light for highlights
    const pointLight = new THREE.PointLight(0xffffff, 1.0, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);
    
    // Set up OrbitControls - IMPORTANT: must be attached to the renderer's DOM element
    const controls = new OrbitControls(camera, renderer.domElement);
    
    // Configure controls for optimal interaction
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // These properties exist in OrbitControls but are missing from type definitions
    // @ts-ignore - Enable screen space panning
    controls.screenSpacePanning = false;
    // @ts-ignore - Set maximum polar angle
    controls.maxPolarAngle = Math.PI / 1.5;
    // @ts-ignore - Set minimum polar angle
    controls.minPolarAngle = Math.PI / 4;
    
    // Set auto-rotation if enabled
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 3.0;
    
    // Ensure rotation is enabled
    // @ts-ignore - Enable rotation
    controls.enableRotate = true;
    // @ts-ignore - Set rotation speed
    controls.rotateSpeed = 1.0;
    
    // Disable zoom for simplicity
    // @ts-ignore - Disable zoom
    controls.enableZoom = false;
    
    // Add visual cues for interaction
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('mousedown', () => {
      renderer.domElement.style.cursor = 'grabbing';
    });
    renderer.domElement.addEventListener('mouseup', () => {
      renderer.domElement.style.cursor = 'grab';
    });
    
    // Add a helper tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Click and drag to rotate';
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '10px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.backgroundColor = 'rgba(0,0,0,0.6)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s';
    tooltip.style.pointerEvents = 'none';
    containerRef.current.appendChild(tooltip);
    
    containerRef.current.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
    });
    containerRef.current.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
    
    // Load the 3D model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        // Center the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Position model at center
        gltf.scene.position.x = -center.x;
        gltf.scene.position.y = -center.y;
        gltf.scene.position.z = -center.z;
        
        // Scale model appropriately
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        gltf.scene.scale.set(scale, scale, scale);
        
        // Add model to scene
        scene.add(gltf.scene);
        
        // Optional: Adjust camera to better frame the model
        camera.lookAt(0, 0, 0);
      },
      (xhr) => {
        // Loading progress
        const percent = Math.floor((xhr.loaded / xhr.total) * 100);
        console.log(`Model loading: ${percent}%`);
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Update controls
      controls.update();
      
      // Render scene
      renderer.render(scene, camera);
    }
    
    // Start animation loop
    animate();
    
    // Handle window resize
    function handleResize() {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      // @ts-ignore - Dispose controls
      controls.dispose();
      renderer.dispose();
      
      // Remove all event listeners
      if (containerRef.current) {
        const element = renderer.domElement;
        element.removeEventListener('mousedown', () => {});
        element.removeEventListener('mouseup', () => {});
        containerRef.current.removeEventListener('mouseenter', () => {});
        containerRef.current.removeEventListener('mouseleave', () => {});
        
        // Remove DOM elements
        if (containerRef.current.contains(tooltip)) {
          containerRef.current.removeChild(tooltip);
        }
        if (containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, [modelPath, autoRotate]);
  
  return (
    <div 
      ref={containerRef} 
      className={`${className} relative w-full h-full`}
      style={{ touchAction: 'none', pointerEvents: 'none' }} // Keep decorative 3D canvas from blocking nearby UI
    />
  );
}
