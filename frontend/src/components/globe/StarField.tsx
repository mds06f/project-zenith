/**
 * File: src/components/globe/StarField.tsx
 * Purpose: Ambient Three.js star/particle layer rendered behind the Cesium
 *          globe. Adds depth and slow parallax drift so the scene never feels
 *          static, independent of the globe's own star box.
 *
 * Responsibilities: own a tiny WebGL scene of ~1800 points; respect
 *   prefers-reduced-motion by freezing rotation.
 * Used by: app/page.tsx (fixed, full-bleed, pointer-events-none, z behind globe).
 * Future extensions: shooting-star bursts timed to meteor-shower events.
 */
'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function StarField() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const COUNT = 1800;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT * 3; i += 1) positions[i] = (Math.random() - 0.5) * 12;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xcdd6ff, size: 0.012, transparent: true, opacity: 0.85 });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let raf = 0;
    const animate = () => {
      if (!reduceMotion) {
        points.rotation.y += 0.0004;
        points.rotation.x += 0.0001;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
