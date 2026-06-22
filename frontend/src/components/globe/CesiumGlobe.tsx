/**
 * Main interactive globe component.
 * Clicking a location updates the active observation point
 * and triggers a new celestial report.
 */
'use client';

import { useEffect, useRef } from 'react';
import { useLocationStore } from '@/store/location.store';
import { useUiStore } from '@/store/ui.store';
import { locationService } from '@/services/api/location.service';


const ISS_ALTITUDE_M = 421_000;

export default function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // viewer is held in a ref so React re-renders never recreate the scene.
  const viewerRef = useRef<unknown>(null);

  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPending = useLocationStore((s) => s.setPending);
  const setReportOpen = useUiStore((s) => s.setReportOpen);

  // ── One-time scene initialisation ──────────────────────────────────────────
  useEffect(() => {
    let disposed = false;

    (async () => {
      const Cesium = await import('cesium');
      // Tell Cesium where its copied static assets live.
      (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL =
        process.env.CESIUM_BASE_URL ?? '/cesium';

      const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
      if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;

      if (disposed || !containerRef.current) return;

      const viewer = new Cesium.Viewer(containerRef.current, {
        // Minimal chrome — this is a product surface, not the Cesium demo UI.
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        selectionIndicator: false,
        infoBox: false,
        // Fall back to bundled imagery when no ion token is configured.
        baseLayer: ionToken ? undefined : Cesium.ImageryLayer.fromWorldImagery({}),
      });
      viewerRef.current = viewer;

      const { scene } = viewer;
      scene.globe.enableLighting = true; // day/night terminator
      scene.globe.atmosphereLightIntensity = 8.0;
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = true;
      } // atmospheric scattering halo
      scene.fog.enabled = true;
      scene.backgroundColor = Cesium.Color.fromCssColorString('#05060A');
      viewer.creditDisplay.container.style.display = 'none';

      // Idle auto-rotation: nudge the camera westward each tick until the user
      // interacts. Cesium emits a clock tick we can hook for a steady cadence.
      let userInteracting = false;
      const stop = () => (userInteracting = true);
      scene.canvas.addEventListener('pointerdown', stop);
      viewer.clock.onTick.addEventListener(() => {
        if (!userInteracting) {
          viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.0006);
        }
      });

      // ── ISS orbital path + moving marker ───────────────────────────────────
      const positions: import('cesium').Cartesian3[] = [];
      for (let lon = -180; lon <= 180; lon += 4) {
        // A simple inclined great circle stands in for the real TLE-derived path.
        const lat = 51.6 * Math.sin(Cesium.Math.toRadians(lon * 2));
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, ISS_ALTITUDE_M));
      }
      viewer.entities.add({
        name: 'ISS orbit',
        polyline: {
          positions,
          width: 1.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25,
            color: Cesium.Color.fromCssColorString('#6E8BFF').withAlpha(0.8),
          }),
        },
      });
      viewer.entities.add({
        id: 'iss',
        name: 'ISS',
        position: Cesium.Cartesian3.fromDegrees(0, 0, ISS_ALTITUDE_M),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#4DE0C2'),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
          outlineWidth: 2,
        },
      });

      // ── Click-to-select ────────────────────────────────────────────────────
      const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction((click: { position: import('cesium').Cartesian2 }) => {
        const cartesian = scene.pickPosition(click.position) ??
          viewer.camera.pickEllipsoid(click.position, scene.globe.ellipsoid);
        if (!cartesian) return;
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        const coords = {
          lat: Cesium.Math.toDegrees(carto.latitude),
          lng: Cesium.Math.toDegrees(carto.longitude),
        };
        setPending(coords); // optimistic pin
        setReportOpen(true);
        void locationService.reverseGeocode(coords).then(setLocation);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })();

    return () => {
      disposed = true;
      const v = viewerRef.current as { destroy?: () => void; isDestroyed?: () => boolean } | null;
      if (v && v.isDestroyed && !v.isDestroyed()) v.destroy?.();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fly the camera whenever the active location changes ──────────────────────
  useEffect(() => {
    const viewer = viewerRef.current as import('cesium').Viewer | null;
    if (!viewer) return;
    (async () => {
      const Cesium = await import('cesium');
      const existingPin = viewer.entities.getById("active-pin");

      if (existingPin) {
        viewer.entities.remove(existingPin);
      }

      viewer.entities.add({
        id: "active-pin",
        position: Cesium.Cartesian3.fromDegrees(
          location.lng,
          location.lat
        ),
        point: {
          pixelSize: 12,
          color: Cesium.Color.CYAN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      });
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(location.lng, location.lat, 6_500_000),
        duration: 2.2,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      });
    })();
  }, [location.lat, location.lng]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label="Interactive 3D Earth" />;
}
