import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, AlertTriangle, Navigation } from 'lucide-react';
import {
  Hotspot,
  MovingVehicle,
  NpcDef,
  RectObstacle,
  RoadPathDef,
  SceneDef,
  SceneId,
  VehicleType,
  WeatherCondition,
} from '../types/game';
import { VEHICLE_INFO } from '../data/gameData';
import { initSceneNpcs, LiveNpcState, stepSceneNpcs } from '../utils/npcController';
import { CharacterSprite } from './CharacterAvatar';
import { VehicleSprite } from './VehicleSprite';

// Posisi lampu jalan, teras warung, dan jendela rumah yang menyala otomatis mulai jam 18.30 WIB
const SCENE_LIGHT_POINTS: Partial<Record<SceneId, { x: number; y: number; radius: number }[]>> = {
  kampung_warung: [
    { x: 24, y: 42, radius: 130 }, // Teras Warung Arga
    { x: 47, y: 34, radius: 115 }, // Lampu Warung Asih
    { x: 79, y: 26, radius: 140 }, // Lentera Masjid Al-Ikhlas
    { x: 35, y: 74, radius: 120 }, // Lampu Tiang Jalan 1
    { x: 64, y: 50, radius: 115 }, // Lampu Tiang Jalan 2
  ],
  kompleks_warga: [
    { x: 11, y: 50, radius: 105 }, // Pos Ronda
    { x: 24, y: 34, radius: 120 }, // Rumah Pak RT
    { x: 48, y: 24, radius: 130 }, // Rumah Arga
    { x: 84, y: 46, radius: 115 }, // Imah Warga kanan
    { x: 56, y: 74, radius: 115 }, // Imah Warga bawah
  ],
  sawah_lisung: [
    { x: 18, y: 28, radius: 120 }, // Obor / Lampu Saung Lisung
    { x: 48, y: 50, radius: 105 }, // Lentera Jembatan Sawah
  ],
  bumi_ageung: [
    { x: 25, y: 31, radius: 130 }, // Lampu Bale Patemon
    { x: 66, y: 28, radius: 145 }, // Lampu Bumi Ageung
  ],
  sekolah: [
    { x: 18, y: 36, radius: 115 }, // Lampu Kelas Kiri
    { x: 56, y: 18, radius: 135 }, // Lampu Gerbang Sekolah
    { x: 82, y: 50, radius: 115 }, // Lampu Kelas Kanan
  ],
  hutan_tutupan: [
    { x: 24, y: 42, radius: 110 }, // Lentera Pos Rimba
  ],
  area_air: [
    { x: 76, y: 34, radius: 120 }, // Lentera Saung Pancuran
  ],
  pasar: [
    { x: 16, y: 42, radius: 120 }, // Lampu Halte Pasar
    { x: 76, y: 26, radius: 145 }, // Lampu Kios Grosir 1
    { x: 84, y: 46, radius: 135 }, // Lampu Kios Grosir 2
  ],
};

const RAIN_DROPS = Array.from({ length: 34 }, (_, idx) => ({
  id: idx,
  leftPct: ((idx * 29) % 100) + (idx % 3) * 0.4,
  delaySec: -((idx * 0.17) % 1.4),
  durationSec: 0.58 + (idx % 5) * 0.08,
  heightPx: 14 + (idx % 4) * 5,
}));

interface GameWorldCanvasProps {
  scene: SceneDef;
  minutesOfDay: number;
  weather: WeatherCondition;
  playerPos: { x: number; y: number };
  facing: 'left' | 'right';
  isInjured: boolean;
  npcsInScene: NpcDef[];
  greetedNpcsToday: string[];
  moveVecRef: React.MutableRefObject<{ x: number; y: number }>;
  isPaused: boolean;
  batterySaver?: boolean;
  onUpdatePlayerPos: (pos: { x: number; y: number }, facing: 'left' | 'right') => void;
  onTriggerHotspot: (hotspot: Hotspot) => void;
  onTalkNpc: (npc: NpcDef) => void;
  onChangeScene: (scene: SceneId) => void;
  onVehicleCollision: (vehicleType: VehicleType) => void;
  onNearestActionChange: (action: { label: string; execute: () => void } | null) => void;
}

function getRoadTotalLength(points: { x: number; y: number }[], aspect: number): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += Math.hypot((points[i + 1].x - points[i].x) * aspect, points[i + 1].y - points[i].y);
  }
  return total || 1;
}

function sampleRoadPolyline(
  roadPath: RoadPathDef,
  progress: number,
  travelDir: 1 | -1,
  aspect = 16 / 9
): { x: number; y: number; facingDir: 1 | -1; angleDeg: number } {
  const pts = roadPath.points;
  if (pts.length < 2) {
    const p = pts[0] ?? { x: 50, y: 50 };
    return { x: p.x, y: p.y, facingDir: travelDir, angleDeg: 0 };
  }

  const segLengths: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot((pts[i + 1].x - pts[i].x) * aspect, pts[i + 1].y - pts[i].y);
    segLengths.push(l);
    totalLen += l;
  }

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetDist = clampedProgress * totalLen;
  let segIdx = 0;
  let localT = 0;

  if (targetDist <= 0) {
    segIdx = 0;
    localT = 0;
  } else if (targetDist >= totalLen) {
    segIdx = pts.length - 2;
    localT = 1;
  } else {
    let acc = 0;
    for (let i = 0; i < segLengths.length; i++) {
      const segLen = segLengths[i];
      if (acc + segLen >= targetDist || i === segLengths.length - 1) {
        segIdx = i;
        localT = segLen > 0 ? (targetDist - acc) / segLen : 0;
        break;
      }
      acc += segLen;
    }
  }

  const a = pts[segIdx];
  const b = pts[segIdx + 1];
  const baseX = a.x + (b.x - a.x) * localT;
  const baseY = a.y + (b.y - a.y) * localT;

  // Smooth tangent blend near segment joints so vehicles glide seamlessly around curves
  const currDx = (b.x - a.x) * aspect;
  const currDy = b.y - a.y;
  const currLen = Math.hypot(currDx, currDy) || 1;
  let tx = currDx / currLen;
  let ty = currDy / currLen;

  if (localT < 0.25 && segIdx > 0) {
    const prevA = pts[segIdx - 1];
    const pDx = (a.x - prevA.x) * aspect;
    const pDy = a.y - prevA.y;
    const pLen = Math.hypot(pDx, pDy) || 1;
    const w = (0.25 - localT) / 0.5; // up to 0.5 blend at joint
    tx = tx * (1 - w) + (pDx / pLen) * w;
    ty = ty * (1 - w) + (pDy / pLen) * w;
  } else if (localT > 0.75 && segIdx < pts.length - 2) {
    const nextB = pts[segIdx + 2];
    const nDx = (nextB.x - b.x) * aspect;
    const nDy = nextB.y - b.y;
    const nLen = Math.hypot(nDx, nDy) || 1;
    const w = (localT - 0.75) / 0.5;
    tx = tx * (1 - w) + (nDx / nLen) * w;
    ty = ty * (1 - w) + (nDy / nLen) * w;
  }

  const tLen = Math.hypot(tx, ty) || 1;
  // Screen-space travel unit vector
  const vx = (tx / tLen) * travelDir;
  const vy = (ty / tLen) * travelDir;

  // Indonesian left-hand lane offset in screen pixels, converted back to % coords
  const leftNormalPxX = vy;
  const leftNormalPxY = -vx;
  const laneDist = roadPath.laneOffset;

  const x = baseX + (leftNormalPxX * laneDist) / aspect;
  const y = baseY + leftNormalPxY * laneDist;

  const facingDir: 1 | -1 = vx >= 0 ? 1 : -1;
  const rawAngle =
    facingDir === 1
      ? (Math.atan2(vy, vx) * 180) / Math.PI
      : (Math.atan2(-vy, -vx) * 180) / Math.PI;
  const angleDeg = Math.max(-24, Math.min(24, rawAngle));

  return { x, y, facingDir, angleDeg };
}

function distancePointToRoad(x: number, y: number, points: { x: number; y: number }[]): number {
  let minD = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const ax = points[i].x;
    const ay = points[i].y;
    const bx = points[i + 1].x;
    const by = points[i + 1].y;
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lenSq)) : 0;
    const px = ax + t * dx;
    const py = ay + t * dy;
    minD = Math.min(minD, Math.hypot(x - px, y - py));
  }
  return minD;
}

function isPositionBlocked(x: number, y: number, obstacles?: RectObstacle[]): boolean {
  if (!obstacles || obstacles.length === 0) return false;
  const padX = 1.6;
  const padY = 1.4;
  for (const ob of obstacles) {
    if (
      x >= ob.xMin - padX &&
      x <= ob.xMax + padX &&
      y >= ob.yMin - padY &&
      y <= ob.yMax + padY
    ) {
      return true;
    }
  }
  return false;
}

export const GameWorldCanvas: React.FC<GameWorldCanvasProps> = ({
  scene,
  minutesOfDay,
  weather,
  playerPos,
  facing,
  isInjured,
  npcsInScene,
  greetedNpcsToday,
  moveVecRef,
  isPaused,
  batterySaver = false,
  onUpdatePlayerPos,
  onTriggerHotspot,
  onTalkNpc,
  onChangeScene,
  onVehicleCollision,
  onNearestActionChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef(playerPos);
  const facingRef = useRef(facing);
  const [renderPos, setRenderPos] = useState(playerPos);
  const [renderFacing, setRenderFacing] = useState(facing);
  const [isMoving, setIsMoving] = useState(false);

  const vehiclesRef = useRef<MovingVehicle[]>([]);
  const vehicleWaitUntilRef = useRef<Record<string, number>>({});
  const [vehicles, setVehicles] = useState<MovingVehicle[]>([]);
  const clickTargetRef = useRef<{ x: number; y: number } | null>(null);
  const [clickTarget, setClickTarget] = useState<{ x: number; y: number } | null>(null);
  const stuckFramesRef = useRef(0);

  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyActiveRef = useRef(false);
  const joyVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const collisionCooldownRef = useRef(0);
  const lastParentSyncRef = useRef(0);
  const lastSceneIdRef = useRef(scene.id);

  const liveNpcsRef = useRef<Record<string, LiveNpcState>>({});
  const lastNpcSyncRef = useRef(0);
  const [liveNpcs, setLiveNpcs] = useState<Record<string, LiveNpcState>>({});
  const minutesOfDayRef = useRef(minutesOfDay);
  minutesOfDayRef.current = minutesOfDay;

  // Stable callback refs so RAF loop never tears down
  const onUpdatePlayerPosRef = useRef(onUpdatePlayerPos);
  onUpdatePlayerPosRef.current = onUpdatePlayerPos;
  const onVehicleCollisionRef = useRef(onVehicleCollision);
  onVehicleCollisionRef.current = onVehicleCollision;
  const onNearestActionChangeRef = useRef(onNearestActionChange);
  onNearestActionChangeRef.current = onNearestActionChange;
  const onTalkNpcRef = useRef(onTalkNpc);
  onTalkNpcRef.current = onTalkNpc;
  const onTriggerHotspotRef = useRef(onTriggerHotspot);
  onTriggerHotspotRef.current = onTriggerHotspot;

  // Sync incoming playerPos ONLY when scene changes or teleported far from local posRef
  useEffect(() => {
    const distFromLocal = Math.hypot(playerPos.x - posRef.current.x, playerPos.y - posRef.current.y);
    if (lastSceneIdRef.current !== scene.id || distFromLocal > 8) {
      lastSceneIdRef.current = scene.id;
      posRef.current = playerPos;
      facingRef.current = facing;
      setRenderPos(playerPos);
      setRenderFacing(facing);
      clickTargetRef.current = null;
      setClickTarget(null);
      stuckFramesRef.current = 0;
    }
  }, [scene.id, playerPos, facing]);

  // Spawn sparse, calm village traffic (max 2 vehicles, 1 initially visible + 1 staggered off-screen)
  useEffect(() => {
    if (!scene.hasRoad || !scene.roadPath || !scene.allowedVehicles?.length) {
      vehiclesRef.current = [];
      vehicleWaitUntilRef.current = {};
      setVehicles([]);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    const aspect = rect && rect.height > 0 ? rect.width / rect.height : 16 / 9;
    const allowed = scene.allowedVehicles;
    const roadLen = getRoadTotalLength(scene.roadPath.points, aspect);
    const now = performance.now();

    // Only 2 opposing traffic slots with staggered timing so the road is never crowded
    const configs: { prog: number; dir: 1 | -1; delayMs: number }[] = [
      { prog: 0.25, dir: 1, delayMs: 0 },
      { prog: 0.99, dir: -1, delayMs: 2800 },
    ];

    const waitMap: Record<string, number> = {};
    const initial: MovingVehicle[] = configs.map((cfg, i) => {
      const vType = allowed[(i + Math.floor(Math.random() * allowed.length)) % allowed.length];
      const info = VEHICLE_INFO[vType];
      const linearSpd =
        info.speedRange[0] + Math.random() * (info.speedRange[1] - info.speedRange[0]);
      const progSpeed = linearSpd / Math.max(80, roadLen);
      const sampled = sampleRoadPolyline(scene.roadPath!, cfg.prog, cfg.dir, aspect);
      const uid = `${scene.id}_v_${i}_${Date.now()}`;
      if (cfg.delayMs > 0) {
        waitMap[uid] = now + cfg.delayMs;
      }
      return {
        uid,
        type: vType,
        progress: cfg.prog,
        x: sampled.x,
        y: sampled.y,
        angleDeg: sampled.angleDeg,
        direction: cfg.dir,
        speed: progSpeed,
        medicalCost: info.medicalCost,
      };
    });

    vehicleWaitUntilRef.current = waitMap;
    vehiclesRef.current = initial;
    setVehicles(initial);
  }, [scene.id, scene.hasRoad, scene.roadPath, scene.allowedVehicles]);

  // Initialize A* pathfinding & daily schedule state for NPCs in the active scene
  useEffect(() => {
    const now = performance.now();
    const initialNpcs = initSceneNpcs(npcsInScene, minutesOfDayRef.current, scene.obstacles, now);
    liveNpcsRef.current = initialNpcs;
    lastNpcSyncRef.current = now;
    setLiveNpcs(initialNpcs);
  }, [scene.id, scene.obstacles, npcsInScene]);

  // Main 60fps movement + solid obstacle collision + road-following traffic + NPC pathfinding loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      if (batterySaver && now - lastTime < 31) {
        rafId = requestAnimationFrame(step);
        return;
      }
      const dt = Math.min(0.06, (now - lastTime) / 1000);
      lastTime = now;

      if (!isPaused) {
        // 1. Player movement (Gamepad/Keyboard + Virtual Joystick + Click-to-walk)
        let dx = moveVecRef.current.x + joyVecRef.current.x;
        let dy = moveVecRef.current.y + joyVecRef.current.y;
        const usingClickWalk =
          Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && clickTargetRef.current !== null;

        if (usingClickWalk && clickTargetRef.current) {
          const tx = clickTargetRef.current.x - posRef.current.x;
          const ty = clickTargetRef.current.y - posRef.current.y;
          const dist = Math.hypot(tx, ty);
          if (dist < 1.8) {
            clickTargetRef.current = null;
            setClickTarget(null);
            stuckFramesRef.current = 0;
          } else {
            dx = tx / dist;
            dy = ty / dist;
          }
        } else if ((Math.abs(dx) >= 0.05 || Math.abs(dy) >= 0.05) && clickTargetRef.current) {
          clickTargetRef.current = null;
          setClickTarget(null);
          stuckFramesRef.current = 0;
        }

        const mag = Math.hypot(dx, dy);
        if (mag > 0.08) {
          const speed = isInjured ? 17 : 26;
          const nx = dx / Math.max(1, mag);
          const ny = dy / Math.max(1, mag);

          const candX = Math.max(5, Math.min(95, posRef.current.x + nx * speed * dt));
          const candY = Math.max(18, Math.min(92, posRef.current.y + ny * speed * dt));

          // Axis-separated solid obstacle collision so Arga slides along walls without clipping inside buildings
          const currBlocked = isPositionBlocked(posRef.current.x, posRef.current.y, scene.obstacles);
          let nextX = posRef.current.x;
          let nextY = posRef.current.y;

          if (currBlocked || !isPositionBlocked(candX, nextY, scene.obstacles)) {
            nextX = candX;
          }
          if (currBlocked || !isPositionBlocked(nextX, candY, scene.obstacles)) {
            nextY = candY;
          }

          const movedDist = Math.hypot(nextX - posRef.current.x, nextY - posRef.current.y);
          const nextFacing = nx < -0.1 ? 'left' : nx > 0.1 ? 'right' : facingRef.current;

          if (movedDist > 0.005) {
            posRef.current = { x: nextX, y: nextY };
            facingRef.current = nextFacing;
            setRenderPos(posRef.current);
            setRenderFacing(nextFacing);
            setIsMoving(true);
            stuckFramesRef.current = 0;

            if (now - lastParentSyncRef.current > 120) {
              lastParentSyncRef.current = now;
              onUpdatePlayerPosRef.current(posRef.current, nextFacing);
            }
          } else {
            facingRef.current = nextFacing;
            setRenderFacing(nextFacing);
            setIsMoving((prev) => (prev ? false : prev));
            if (usingClickWalk) {
              stuckFramesRef.current += 1;
              if (stuckFramesRef.current > 12) {
                clickTargetRef.current = null;
                setClickTarget(null);
                stuckFramesRef.current = 0;
              }
            }
          }
        } else {
          setIsMoving((prev) => (prev ? false : prev));
        }

        // 2. Road-following vehicles with natural calm gaps & collision detection
        if (
          scene.hasRoad &&
          scene.roadPath &&
          scene.allowedVehicles?.length &&
          vehiclesRef.current.length > 0
        ) {
          const rect = containerRef.current?.getBoundingClientRect();
          const aspect = rect && rect.height > 0 ? rect.width / rect.height : 16 / 9;
          const allowed = scene.allowedVehicles;
          const roadPath = scene.roadPath;
          const roadLen = getRoadTotalLength(roadPath.points, aspect);
          let hitVehicle: VehicleType | null = null;

          const nextVehicles = vehiclesRef.current.map((v) => {
            const waitUntil = vehicleWaitUntilRef.current[v.uid] ?? 0;
            if (now < waitUntil) {
              return v;
            }

            let nextProg = v.progress + v.direction * v.speed * dt;
            let nextType = v.type;
            let nextSpeed = v.speed;
            let nextCost = v.medicalCost;

            if (nextProg > 1.0 || nextProg < 0.0) {
              // Pause naturally before next vehicle enters so village road isn't crowded
              vehicleWaitUntilRef.current[v.uid] = now + 2600 + Math.random() * 3400;
              nextType = allowed[Math.floor(Math.random() * allowed.length)];
              const info = VEHICLE_INFO[nextType];
              const linearSpd =
                info.speedRange[0] + Math.random() * (info.speedRange[1] - info.speedRange[0]);
              nextSpeed = linearSpd / Math.max(80, roadLen);
              nextCost = info.medicalCost;
              nextProg = v.direction === 1 ? 0.0 : 1.0;
            }

            const sampled = sampleRoadPolyline(roadPath, nextProg, v.direction, aspect);

            // Check collision only while vehicle is clearly visible inside the road
            if (nextProg >= 0.04 && nextProg <= 0.96) {
              const distX = Math.abs(sampled.x - posRef.current.x);
              const distY = Math.abs(sampled.y - posRef.current.y);
              if (distX < 4.8 && distY < 4.8 && now > collisionCooldownRef.current) {
                collisionCooldownRef.current = now + 5000;
                hitVehicle = nextType;
              }
            }

            return {
              ...v,
              progress: nextProg,
              x: sampled.x,
              y: sampled.y,
              angleDeg: sampled.angleDeg,
              type: nextType,
              speed: nextSpeed,
              medicalCost: nextCost,
            };
          });

          vehiclesRef.current = nextVehicles;
          setVehicles(nextVehicles);

          if (hitVehicle) {
            onVehicleCollisionRef.current(hitVehicle);
          }
        }

        // 3. Dedicated NPC controller with A* pathfinding & time-of-day routines
        if (npcsInScene.length > 0) {
          const { nextMap, anyChanged, visualChanged } = stepSceneNpcs(
            liveNpcsRef.current,
            npcsInScene,
            {
              now,
              dt,
              minutesOfDay: minutesOfDayRef.current,
              playerPos: posRef.current,
              obstacles: scene.obstacles,
            }
          );

          liveNpcsRef.current = nextMap;
          if (anyChanged && (visualChanged || now - lastNpcSyncRef.current >= 32)) {
            lastNpcSyncRef.current = now;
            setLiveNpcs(nextMap);
          }
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, batterySaver, isInjured, scene.id, scene.hasRoad, scene.roadPath, scene.allowedVehicles, scene.obstacles, npcsInScene, moveVecRef]);

  // Compute nearest interactive NPC or Hotspot from renderPos & live NPC coordinates
  const nearestNpc = npcsInScene
    .map((n) => {
      const live = liveNpcs[n.id];
      const nx = live?.x ?? n.x;
      const ny = live?.y ?? n.y;
      return { npc: n, dist: Math.hypot(nx - renderPos.x, ny - renderPos.y) };
    })
    .filter((item) => item.dist < 15)
    .sort((a, b) => a.dist - b.dist)[0]?.npc;

  const nearestHotspot = scene.hotspots
    .map((h) => ({ hs: h, dist: Math.hypot(h.x - renderPos.x, h.y - renderPos.y) }))
    .filter((item) => item.dist < 16)
    .sort((a, b) => a.dist - b.dist)[0]?.hs;

  const nearestKey = nearestNpc
    ? `npc:${nearestNpc.id}`
    : nearestHotspot
    ? `hs:${nearestHotspot.id}`
    : 'none';

  useEffect(() => {
    if (nearestNpc) {
      onNearestActionChangeRef.current({
        label: `Sapa ${nearestNpc.name}`,
        execute: () => onTalkNpcRef.current(nearestNpc),
      });
    } else if (nearestHotspot) {
      onNearestActionChangeRef.current({
        label: nearestHotspot.label,
        execute: () => onTriggerHotspotRef.current(nearestHotspot),
      });
    } else {
      onNearestActionChangeRef.current(null);
    }
  }, [nearestKey, scene.id]);

  // Dynamic Time-of-Day + Weather lighting:
  // - 10.00-15.30 (jam 12 terik): cerah menyala hangat (atau mendung saat musim hujan)
  // - 17.45-18.29 (jam 18.00 agak gelap): senja temaram, lampu mulai bersiap
  // - >= 18.30 - 04.59 (jam 18.30 gelap & lampu sudah menyala): malam gelap + lampu jalan/rumah menyala hangat
  const hour = minutesOfDay / 60;
  const isRainyNow = !scene.isIndoor && (weather === 'hujan' || weather === 'gerimis');
  const isCloudyNow = !scene.isIndoor && weather === 'mendung';
  const isTerikDay = !scene.isIndoor && weather === 'terik' && hour >= 9.5 && hour < 15.8;

  let backdropBrightness = 1;
  let backdropSaturate = 1;
  let timeTintStyle: React.CSSProperties = { background: 'transparent' };

  if (hour >= 18.5 || hour < 4.75) {
    // >= 18.30 WIB: Malam gelap dan lampu kampung mulai menyala terang
    backdropBrightness = 0.48;
    backdropSaturate = 0.85;
    timeTintStyle = {
      background:
        'linear-gradient(180deg, rgba(2,6,23,0.68) 0%, rgba(15,23,42,0.52) 55%, rgba(2,6,23,0.62) 100%)',
    };
  } else if (hour >= 18.3 && hour < 18.5) {
    // 18.18 - 18.29 WIB: Transisi cepat ke gelap
    backdropBrightness = 0.6;
    backdropSaturate = 0.9;
    timeTintStyle = {
      background:
        'linear-gradient(180deg, rgba(15,23,42,0.56) 0%, rgba(49,46,129,0.34) 50%, rgba(15,23,42,0.48) 100%)',
    };
  } else if (hour >= 17.65 && hour < 18.3) {
    // Sekitar jam 18.00 WIB: Agak gelap / senja Maghrib
    backdropBrightness = 0.74;
    backdropSaturate = 0.98;
    timeTintStyle = {
      background:
        'linear-gradient(180deg, rgba(30,27,75,0.44) 0%, rgba(180,83,9,0.24) 55%, rgba(15,23,42,0.36) 100%)',
    };
  } else if (hour >= 16.0 && hour < 17.65) {
    // Sore keemasan menjelang senja
    backdropBrightness = isRainyNow ? 0.78 : 0.93;
    backdropSaturate = isRainyNow ? 0.86 : 1.06;
    timeTintStyle = isRainyNow
      ? { background: 'rgba(15,23,42,0.28)' }
      : {
          background:
            'linear-gradient(180deg, rgba(245,158,11,0.16) 0%, rgba(217,119,6,0.08) 100%)',
        };
  } else if (hour >= 4.75 && hour < 6.25) {
    // Subuh / fajar menyingsing
    backdropBrightness = 0.78;
    backdropSaturate = 0.92;
    timeTintStyle = {
      background:
        'linear-gradient(180deg, rgba(30,41,59,0.38) 0%, rgba(251,191,36,0.12) 100%)',
    };
  } else {
    // Pagi - Siang (termasuk jam 12 siang)
    if (isRainyNow) {
      backdropBrightness = weather === 'hujan' ? 0.76 : 0.85;
      backdropSaturate = 0.8;
      timeTintStyle = {
        background:
          weather === 'hujan'
            ? 'linear-gradient(180deg, rgba(15,23,42,0.42) 0%, rgba(30,58,138,0.24) 100%)'
            : 'linear-gradient(180deg, rgba(30,41,59,0.28) 0%, rgba(51,65,85,0.16) 100%)',
      };
    } else if (isCloudyNow) {
      backdropBrightness = 0.9;
      backdropSaturate = 0.88;
      timeTintStyle = { background: 'rgba(51,65,85,0.20)' };
    } else if (isTerikDay) {
      backdropBrightness = 1.09;
      backdropSaturate = 1.1;
      timeTintStyle = {
        background:
          'radial-gradient(circle at 86% 10%, rgba(254,240,138,0.34) 0%, rgba(251,191,36,0.12) 34%, transparent 70%)',
      };
    }
  }

  // Lampu jalan & rumah menyala penuh saat >= 18.30 (18.5 jam), redup transisi saat 18.24-18.30
  const lightsOpacity =
    hour >= 18.5 || hour < 5.1
      ? 1
      : hour >= 18.3
      ? 0.55
      : hour >= 5.1 && hour < 5.6
      ? 0.4
      : 0;
  const lightPoints = !scene.isIndoor && lightsOpacity > 0 ? SCENE_LIGHT_POINTS[scene.id] ?? [] : [];
  const rainDropsCount =
    weather === 'hujan'
      ? batterySaver
        ? 16
        : 34
      : weather === 'gerimis'
      ? batterySaver
        ? 8
        : 16
      : 0;

  const nearRoad =
    scene.hasRoad &&
    scene.roadPath &&
    distancePointToRoad(renderPos.x, renderPos.y, scene.roadPath.points) < 9.5;

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const target = {
      x: Math.max(5, Math.min(95, px)),
      y: Math.max(18, Math.min(92, py)),
    };
    stuckFramesRef.current = 0;
    clickTargetRef.current = target;
    setClickTarget(target);
  };

  // Virtual Joystick Touch/Mouse handlers
  const handleJoyPointer = (clientX: number, clientY: number, el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 12;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    setJoyKnob({ x: kx, y: ky });
    joyVecRef.current = { x: kx / maxR, y: ky / maxR };
  };

  const rect = containerRef.current?.getBoundingClientRect();
  const currentAspect = rect && rect.height > 0 ? rect.width / rect.height : 16 / 9;

  return (
    <div
      ref={containerRef}
      onClick={handleStageClick}
      className="relative isolate z-0 w-full h-full overflow-hidden bg-slate-950 cursor-crosshair select-none"
    >
      {/* Background Isometric Diorama with dynamic brightness/saturation for Terik / Senja / Malam */}
      <img
        src={scene.bgImage}
        alt={scene.name}
        referrerPolicy="no-referrer"
        style={{
          objectPosition: scene.bgPosition ?? '50% 50%',
          filter: `brightness(${backdropBrightness}) saturate(${backdropSaturate})`,
        }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-1000"
      />

      {/* Atmospheric Time-of-Day & Weather Tint Layer */}
      <div
        style={timeTintStyle}
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
      />

      {/* Village Street & House Lamps (Automatically illuminate starting 18.30 WIB until dawn) */}
      {lightPoints.length > 0 && (
        <div
          style={{ opacity: lightsOpacity }}
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        >
          {lightPoints.map((lp, idx) => (
            <div
              key={idx}
              style={{
                left: `${lp.x}%`,
                top: `${lp.y}%`,
                width: `${lp.radius * 2}px`,
                height: `${lp.radius * 2}px`,
                background:
                  'radial-gradient(circle, rgba(253,224,71,0.52) 0%, rgba(245,158,11,0.22) 38%, rgba(217,119,6,0) 72%)',
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_14px_4px_rgba(251,191,36,0.95)]" />
            </div>
          ))}
        </div>
      )}

      {/* Animated Rain Streaks during Rainy Spells (non-continuous rain in Musim Hujan) */}
      {rainDropsCount > 0 && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {RAIN_DROPS.slice(0, rainDropsCount).map((drop) => (
            <span
              key={drop.id}
              style={{
                left: `${drop.leftPct}%`,
                top: '-10%',
                height: `${drop.heightPx}px`,
                animationDelay: `${drop.delaySec}s`,
                animationDuration: `${drop.durationSec}s`,
              }}
              className={`sunda-rain-drop absolute w-[1.5px] rounded-full ${
                weather === 'hujan' ? 'bg-sky-200/75' : 'bg-sky-200/45'
              }`}
            />
          ))}
        </div>
      )}

      {/* Road Warning indicator when Arga is close to active traffic */}
      {!isPaused && nearRoad && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-lg bg-amber-950/90 border border-amber-400 text-amber-200 text-xs font-bold flex items-center gap-2 shadow-lg pointer-events-none">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Hati-hati menyeberang! Waspada Angkot, Motor, Mobil, Delman, Becak & Pedati.</span>
        </div>
      )}

      {/* Scene Hotspots (Interactive Buildings & Activities) */}
      {!isPaused && scene.hotspots.map((hs) => {
        const isNear = nearestHotspot?.id === hs.id;
        return (
          <button
            key={hs.id}
            onClick={(e) => {
              e.stopPropagation();
              onTriggerHotspot(hs);
            }}
            style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 group transition-transform ${
              isNear ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div
              className={`px-3 py-1.5 rounded-lg border-2 shadow-xl backdrop-blur-sm transition-colors flex flex-col items-center ${
                isNear
                  ? 'bg-amber-400 text-slate-950 border-white'
                  : 'bg-slate-950/85 text-amber-100 border-amber-400/75 hover:bg-slate-900'
              }`}
            >
              <span className="text-xs font-bold whitespace-nowrap">{hs.label}</span>
              {hs.subtitle && (
                <span className={`text-[10px] whitespace-nowrap ${isNear ? 'text-amber-950 font-semibold' : 'text-slate-300'}`}>
                  {hs.subtitle}
                </span>
              )}
            </div>
            <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950 mx-auto mt-1 shadow" />
          </button>
        );
      })}

      {/* Neighbor Zone Navigation Arrows */}
      {!isPaused && scene.neighbors.map((nb) => {
        const posClass =
          nb.direction === 'Kiri'
            ? 'left-2 sm:left-4 top-1/2 -translate-y-1/2'
            : nb.direction === 'Kanan'
            ? 'right-2 sm:right-4 top-1/2 -translate-y-1/2'
            : nb.direction === 'Atas'
            ? 'top-14 sm:top-24 left-1/2 -translate-x-1/2'
            : 'bottom-14 sm:bottom-20 left-1/2 -translate-x-1/2';

        return (
          <button
            key={nb.scene}
            onClick={(e) => {
              e.stopPropagation();
              onChangeScene(nb.scene);
            }}
            className={`absolute ${posClass} z-20 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-950/85 hover:bg-amber-400 hover:text-slate-950 text-amber-200 border border-amber-400/70 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-xl transition-colors`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{nb.label}</span>
          </button>
        );
      })}

      {/* Wandering / Standing Sundanese NPCs */}
      {npcsInScene.map((npc) => {
        const greeted = greetedNpcsToday.includes(npc.id);
        const isNear = nearestNpc?.id === npc.id;
        const live = liveNpcs[npc.id];
        const nx = live?.x ?? npc.x;
        const ny = live?.y ?? npc.y;
        const npcFacing = live?.facing ?? 'right';
        const npcMoving = !isPaused && Boolean(live?.isMoving);
        return (
          <button
            key={npc.id}
            title={
              live?.destinationLabel
                ? `${npc.name} (${npcMoving ? 'Menuju' : 'Di'} ${live.destinationLabel})`
                : npc.name
            }
            onClick={(e) => {
              e.stopPropagation();
              onTalkNpc(npc);
            }}
            style={{ left: `${nx}%`, top: `${ny}%`, zIndex: Math.round(ny) }}
            className="absolute -translate-x-1/2 -translate-y-3/4 group cursor-pointer"
          >
            {!isPaused && (
              <div
                className={`mx-auto mb-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border transition-transform ${
                  isNear
                    ? 'bg-amber-400 text-slate-950 border-white scale-110'
                    : greeted
                    ? 'bg-slate-800/90 text-slate-300 border-slate-600'
                    : 'bg-emerald-500 text-white border-emerald-200 animate-float-slow'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
              </div>
            )}
            <CharacterSprite
              name={npc.name}
              shirtColor={npc.shirtColor}
              accentColor={npc.accentColor}
              hatType={npc.hatType}
              facing={npcFacing}
              moveDir={live?.moveDir}
              motionState={isPaused ? 'idle' : live?.motionState}
              walkCadenceSec={live?.walkCadenceSec}
              isMoving={npcMoving}
            />
          </button>
        );
      })}

      {/* Player Character: Arga */}
      <div
        style={{ left: `${renderPos.x}%`, top: `${renderPos.y}%`, zIndex: Math.round(renderPos.y) + 1 }}
        className="absolute -translate-x-1/2 -translate-y-3/4 pointer-events-none"
      >
        <CharacterSprite
          name="Arga"
          shirtColor="#dc2626"
          accentColor="#f8fafc"
          hatType="none"
          isArga
          isInjured={isInjured}
          facing={renderFacing}
          isMoving={isMoving}
        />
      </div>

      {/* Moving Traffic Vehicles aligned strictly to road with wheel anchor, depth scaling & edge fade */}
      {vehicles
        .filter((v) => v.progress >= 0.01 && v.progress <= 0.99)
        .map((v) => {
          const sampledDir =
            scene.roadPath &&
            sampleRoadPolyline(scene.roadPath, v.progress, v.direction, currentAspect).facingDir;
          const depthScale = Math.max(0.72, Math.min(1.02, 0.7 + 0.34 * (v.y / 100)));
          const opacity = Math.max(0, Math.min(1, v.progress / 0.08, (1 - v.progress) / 0.08));
          return (
            <div
              key={v.uid}
              style={{
                left: `${v.x}%`,
                top: `${v.y}%`,
                zIndex: Math.round(v.y) + 2,
                opacity,
                transform: `translate(-50%, -82%) scale(${depthScale})`,
              }}
              className="absolute pointer-events-none"
            >
              <VehicleSprite
                type={v.type}
                direction={sampledDir ?? v.direction}
                angleDeg={v.angleDeg}
              />
            </div>
          );
        })}

      {/* Click-to-walk destination indicator */}
      {clickTarget && (
        <div
          style={{ left: `${clickTarget.x}%`, top: `${clickTarget.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-amber-300 bg-amber-400/30 pointer-events-none animate-ping"
        />
      )}

      {/* Bottom-left Virtual Analog Joystick (Touch / Mouse drag fallback alongside ROG Ally stick) */}
      {!isPaused && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            joyActiveRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            handleJoyPointer(e.clientX, e.clientY, e.currentTarget);
          }}
          onPointerMove={(e) => {
            if (!joyActiveRef.current) return;
            handleJoyPointer(e.clientX, e.clientY, e.currentTarget);
          }}
          onPointerUp={() => {
            joyActiveRef.current = false;
            setJoyKnob({ x: 0, y: 0 });
            joyVecRef.current = { x: 0, y: 0 };
          }}
          onPointerCancel={() => {
            joyActiveRef.current = false;
            setJoyKnob({ x: 0, y: 0 });
            joyVecRef.current = { x: 0, y: 0 };
          }}
          className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 z-30 w-20 h-20 sm:w-28 sm:h-28 [@media(max-height:520px)]:w-20 [@media(max-height:520px)]:h-20 rounded-full bg-slate-950/45 border-2 border-white/35 backdrop-blur-sm flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
        >
          <div
            style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
            className="w-8 h-8 sm:w-11 sm:h-11 [@media(max-height:520px)]:w-8 [@media(max-height:520px)]:h-8 rounded-full bg-amber-100/90 border-2 border-amber-400 shadow-lg pointer-events-none"
          />
        </div>
      )}
    </div>
  );
};
