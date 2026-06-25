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
  // Globe-click race guard: monotonic id of the latest click + the in-flight
  // reverse-geocode controller, so only the newest selection ever commits.
  const clickSeqRef = useRef(0);
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);

  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPending = useLocationStore((s) => s.setPending);
  const setReportOpen = useUiStore((s) => s.setReportOpen);

  // ── One-time scene initialisation ──────────────────────────────────────────
  useEffect(() => {
    let disposed = false;
    let issTimer: ReturnType<typeof setTimeout> | undefined;
    let issAbort: AbortController | null = null;

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

      // ── Real ISS position ──────────────────────────────────────────────────
      // When a live gateway is configured, poll the backend's satellite.js
      // propagation (/api/satellite/position) and move the marker to the real
      // sub-satellite point. Without a gateway the marker stays at its decorative
      // start position (mock mode).
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const live = process.env.NEXT_PUBLIC_DATA_SOURCE === 'live' && !!apiBase;
      if (live) {
        const POLL_MS = 5000;          // gap *between* completed polls
        const POLL_TIMEOUT_MS = 8000;  // drop a stalled request instead of stacking

        // Self-scheduling poll: the next run is queued only after the current one
        // settles, so a single in-flight request exists at any time. setInterval
        // (the previous approach) fired regardless of completion, so on an
        // unstable network slow requests overlapped and fanned out into concurrent
        // retries that cascaded as the connection degraded.
        const pollIss = async () => {
          if (disposed) return;
          // Don't poll a hidden tab — prevents a backlog firing on refocus.
          if (typeof document !== 'undefined' && document.hidden) {
            issTimer = setTimeout(pollIss, POLL_MS);
            return;
          }
          issAbort = new AbortController();
          const to = setTimeout(() => issAbort?.abort(), POLL_TIMEOUT_MS);
          try {
            const res = await fetch(`${apiBase}/api/satellite/position`, {
              headers: { Accept: 'application/json' },
              signal: issAbort.signal,
            });
            if (res.ok) {
              const d = (await res.json()) as { latitude?: number; longitude?: number; altitude?: number };
              if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
                const iss = viewer.entities.getById('iss');
                if (iss) {
                  iss.position = new Cesium.ConstantPositionProperty(
                    Cesium.Cartesian3.fromDegrees(d.longitude, d.latitude, (d.altitude ?? 421) * 1000)
                  );
                }
              }
            }
          } catch {
            /* aborts (timeout/unmount) + transient failures: keep last good
               position, stay silent so cancellations don't spam the console */
          } finally {
            clearTimeout(to);
            issAbort = null;
            if (!disposed) issTimer = setTimeout(pollIss, POLL_MS);
          }
        };
        void pollIss();
      }

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

        // A newer click cancels the older reverse-geocode and invalidates its
        // sequence id, so a slow earlier response can never overwrite the newer
        // selection (the stale-state race when clicking A then B quickly).
        const seq = ++clickSeqRef.current;
        reverseGeocodeAbortRef.current?.abort();
        const controller = new AbortController();
        reverseGeocodeAbortRef.current = controller;
        void locationService
          .reverseGeocode(coords, controller.signal)
          .then((loc) => {
            if (seq === clickSeqRef.current) setLocation(loc);
          })
          .catch(() => {
            /* superseded / aborted click — intentional, ignore */
          });
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })();

    return () => {
      disposed = true;
      if (issTimer) clearTimeout(issTimer);
      issAbort?.abort();
      reverseGeocodeAbortRef.current?.abort();
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
