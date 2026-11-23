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
} from '../types/game';
import { VEHICLE_INFO } from '../data/gameData';
import { CharacterSprite } from './CharacterAvatar';
import { VehicleSprite } from './VehicleSprite';

interface GameWorldCanvasProps {
  scene: SceneDef;
  minutesOfDay: number;
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

  // Main 60fps movement + solid obstacle collision + road-following traffic loop
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
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, batterySaver, isInjured, scene.id, scene.hasRoad, scene.roadPath, scene.allowedVehicles, scene.obstacles, moveVecRef]);

  // Compute nearest interactive NPC or Hotspot from renderPos
  const nearestNpc = npcsInScene
    .map((n) => ({ npc: n, dist: Math.hypot(n.x - renderPos.x, n.y - renderPos.y) }))
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

  // Dynamic Time-of-Day atmospheric tint
  const hour = minutesOfDay / 60;
  let timeOverlay = 'bg-transparent';
  if (hour >= 18.2 || hour < 4.5) {
    timeOverlay = 'bg-slate-950/45 mix-blend-multiply';
  } else if (hour >= 16.5 && hour < 18.2) {
    timeOverlay = 'bg-amber-600/20 mix-blend-soft-light';
  } else if (hour >= 4.5 && hour < 6.5) {
    timeOverlay = 'bg-indigo-900/20 mix-blend-soft-light';
  }

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
      {/* Background Isometric Diorama */}
      <img
        src={scene.bgImage}
        alt={scene.name}
        referrerPolicy="no-referrer"
        style={{ objectPosition: scene.bgPosition ?? '50% 50%' }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
      />

      {/* Atmospheric Time of Day Layer */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${timeOverlay}`} />

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
        return (
          <button
            key={npc.id}
            onClick={(e) => {
              e.stopPropagation();
              onTalkNpc(npc);
            }}
            style={{ left: `${npc.x}%`, top: `${npc.y}%`, zIndex: Math.round(npc.y) }}
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
