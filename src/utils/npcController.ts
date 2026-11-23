import { NpcDef, NpcWaypoint, RectObstacle } from '../types/game';

export interface Point2D {
  x: number;
  y: number;
}

export interface LiveNpcState {
  x: number;
  y: number;
  facing: 'left' | 'right';
  isMoving: boolean;
  slotId: string;
  wpIndex: number;
  routeQueue: Point2D[];
  pauseUntil: number;
  destinationLabel?: string;
}

const GRID_MIN_X = 6;
const GRID_MAX_X = 94;
const GRID_MIN_Y = 20;
const GRID_MAX_Y = 90;
const CELL_SIZE = 2;
const COLS = Math.floor((GRID_MAX_X - GRID_MIN_X) / CELL_SIZE) + 1; // 45
const ROWS = Math.floor((GRID_MAX_Y - GRID_MIN_Y) / CELL_SIZE) + 1; // 36

export function isPointWalkable(
  x: number,
  y: number,
  obstacles?: RectObstacle[],
  padX = 1.8,
  padY = 1.5
): boolean {
  if (x < 5 || x > 95 || y < 18 || y > 92) return false;
  if (!obstacles || obstacles.length === 0) return true;
  for (const ob of obstacles) {
    if (
      x >= ob.xMin - padX &&
      x <= ob.xMax + padX &&
      y >= ob.yMin - padY &&
      y <= ob.yMax + padY
    ) {
      return false;
    }
  }
  return true;
}

function hasLineOfSight(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  obstacles?: RectObstacle[]
): boolean {
  const dist = Math.hypot(bx - ax, by - ay);
  if (dist < 0.5) return true;
  const steps = Math.ceil(dist / 1.15);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sx = ax + (bx - ax) * t;
    const sy = ay + (by - ay) * t;
    if (!isPointWalkable(sx, sy, obstacles, 1.7, 1.4)) {
      return false;
    }
  }
  return true;
}

function toGrid(x: number, y: number): { c: number; r: number } {
  const c = Math.max(0, Math.min(COLS - 1, Math.round((x - GRID_MIN_X) / CELL_SIZE)));
  const r = Math.max(0, Math.min(ROWS - 1, Math.round((y - GRID_MIN_Y) / CELL_SIZE)));
  return { c, r };
}

function toWorld(c: number, r: number): Point2D {
  return {
    x: GRID_MIN_X + c * CELL_SIZE,
    y: GRID_MIN_Y + r * CELL_SIZE,
  };
}

function findNearestWalkableCell(
  startC: number,
  startR: number,
  walkable: boolean[]
): { c: number; r: number } | null {
  const startIdx = startR * COLS + startC;
  if (walkable[startIdx]) return { c: startC, r: startR };

  const visited = new Uint8Array(COLS * ROWS);
  const queue: number[] = [startIdx];
  visited[startIdx] = 1;

  let head = 0;
  while (head < queue.length && head < 220) {
    const idx = queue[head++];
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dc === 0 && dr === 0) continue;
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
        const nIdx = nr * COLS + nc;
        if (visited[nIdx]) continue;
        if (walkable[nIdx]) return { c: nc, r: nr };
        visited[nIdx] = 1;
        queue.push(nIdx);
      }
    }
  }
  return null;
}

/**
 * Grid-based A* pathfinding with no-corner-cutting + line-of-sight string-pulling smoothing.
 */
export function findObstacleAwarePath(
  from: Point2D,
  to: Point2D,
  obstacles?: RectObstacle[]
): Point2D[] {
  if (Math.hypot(to.x - from.x, to.y - from.y) < 0.6) {
    return [{ x: to.x, y: to.y }];
  }

  // Fast direct route if clear line of sight
  if (
    isPointWalkable(to.x, to.y, obstacles, 1.5, 1.3) &&
    hasLineOfSight(from.x, from.y, to.x, to.y, obstacles)
  ) {
    return [{ x: to.x, y: to.y }];
  }

  const total = COLS * ROWS;
  const walkable = new Array<boolean>(total);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = toWorld(c, r);
      walkable[r * COLS + c] = isPointWalkable(p.x, p.y, obstacles, 1.75, 1.45);
    }
  }

  const rawStart = toGrid(from.x, from.y);
  const rawGoal = toGrid(to.x, to.y);
  const startCell = findNearestWalkableCell(rawStart.c, rawStart.r, walkable);
  const goalCell = findNearestWalkableCell(rawGoal.c, rawGoal.r, walkable);

  if (!startCell || !goalCell) {
    return [{ x: to.x, y: to.y }];
  }

  const startIdx = startCell.r * COLS + startCell.c;
  const goalIdx = goalCell.r * COLS + goalCell.c;
  if (startIdx === goalIdx) {
    return [{ x: to.x, y: to.y }];
  }

  const gScore = new Float32Array(total).fill(Infinity);
  const fScore = new Float32Array(total).fill(Infinity);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const openSet: number[] = [startIdx];
  const inOpen = new Uint8Array(total);
  inOpen[startIdx] = 1;

  const heuristic = (idx: number) => {
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
    const dx = Math.abs(c - goalCell.c);
    const dy = Math.abs(r - goalCell.r);
    return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy);
  };

  gScore[startIdx] = 0;
  fScore[startIdx] = heuristic(startIdx);

  let found = false;
  while (openSet.length > 0) {
    // Pick node with lowest fScore
    let bestPos = 0;
    let bestF = fScore[openSet[0]];
    for (let i = 1; i < openSet.length; i++) {
      const f = fScore[openSet[i]];
      if (f < bestF) {
        bestF = f;
        bestPos = i;
      }
    }

    const curr = openSet[bestPos];
    openSet.splice(bestPos, 1);
    inOpen[curr] = 0;

    if (curr === goalIdx) {
      found = true;
      break;
    }

    closed[curr] = 1;
    const cr = Math.floor(curr / COLS);
    const cc = curr % COLS;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dc === 0 && dr === 0) continue;
        const nc = cc + dc;
        const nr = cr + dr;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
        const nIdx = nr * COLS + nc;
        if (closed[nIdx] || !walkable[nIdx]) continue;

        // Prevent diagonal corner cutting across adjacent obstacles
        if (dc !== 0 && dr !== 0) {
          if (!walkable[cr * COLS + nc] || !walkable[nr * COLS + cc]) {
            continue;
          }
        }

        const stepCost = dc !== 0 && dr !== 0 ? 1.4142 : 1;
        const tentativeG = gScore[curr] + stepCost;
        if (tentativeG < gScore[nIdx]) {
          cameFrom[nIdx] = curr;
          gScore[nIdx] = tentativeG;
          fScore[nIdx] = tentativeG + heuristic(nIdx);
          if (!inOpen[nIdx]) {
            openSet.push(nIdx);
            inOpen[nIdx] = 1;
          }
        }
      }
    }
  }

  if (!found) {
    return [{ x: to.x, y: to.y }];
  }

  // Reconstruct raw grid path
  const rawPoints: Point2D[] = [];
  let trace = goalIdx;
  while (trace !== -1 && trace !== startIdx) {
    const tr = Math.floor(trace / COLS);
    const tc = trace % COLS;
    rawPoints.push(toWorld(tc, tr));
    trace = cameFrom[trace];
  }
  rawPoints.reverse();
  if (rawPoints.length > 0) {
    rawPoints[rawPoints.length - 1] = { x: to.x, y: to.y };
  } else {
    rawPoints.push({ x: to.x, y: to.y });
  }

  // String-pull smoothing so NPC walks sleek lines instead of grid steps
  const smoothed: Point2D[] = [];
  let anchor: Point2D = { x: from.x, y: from.y };
  let cursor = 0;
  while (cursor < rawPoints.length) {
    let furthest = cursor;
    for (let j = rawPoints.length - 1; j > cursor; j--) {
      if (hasLineOfSight(anchor.x, anchor.y, rawPoints[j].x, rawPoints[j].y, obstacles)) {
        furthest = j;
        break;
      }
    }
    const chosen = rawPoints[furthest];
    smoothed.push(chosen);
    anchor = chosen;
    cursor = furthest + 1;
  }

  return smoothed.length > 0 ? smoothed : [{ x: to.x, y: to.y }];
}

export function resolveScheduleForTime(
  npc: NpcDef,
  minutesOfDay: number
): { slotId: string; waypoints: NpcWaypoint[] } {
  const m = ((Math.floor(minutesOfDay) % 1440) + 1440) % 1440;
  if (npc.dailySchedule && npc.dailySchedule.length > 0) {
    for (const slot of npc.dailySchedule) {
      const matches =
        slot.startMinutes <= slot.endMinutes
          ? m >= slot.startMinutes && m < slot.endMinutes
          : m >= slot.startMinutes || m < slot.endMinutes;
      if (matches && slot.waypoints.length > 0) {
        return { slotId: slot.id, waypoints: slot.waypoints };
      }
    }
  }

  if (npc.patrolPath && npc.patrolPath.length > 0) {
    return { slotId: 'patrol_default', waypoints: npc.patrolPath };
  }

  return {
    slotId: 'static',
    waypoints: [{ x: npc.x, y: npc.y, pauseSec: 4 }],
  };
}

export function initSceneNpcs(
  npcsInScene: NpcDef[],
  minutesOfDay: number,
  obstacles?: RectObstacle[],
  now = performance.now()
): Record<string, LiveNpcState> {
  const result: Record<string, LiveNpcState> = {};

  npcsInScene.forEach((npc, idx) => {
    const schedule = resolveScheduleForTime(npc, minutesOfDay);
    const waypoints = schedule.waypoints;
    const startWp = waypoints[0] ?? { x: npc.x, y: npc.y };
    const hasMultiple = waypoints.length >= 2;
    const nextIdx = hasMultiple ? 1 : 0;
    const nextWp = waypoints[nextIdx] ?? startWp;

    const routeQueue = hasMultiple
      ? findObstacleAwarePath({ x: startWp.x, y: startWp.y }, { x: nextWp.x, y: nextWp.y }, obstacles)
      : [];

    const firstStep = routeQueue[0] ?? nextWp;
    const initialFacing: 'left' | 'right' = firstStep.x < startWp.x ? 'left' : 'right';

    result[npc.id] = {
      x: startWp.x,
      y: startWp.y,
      facing: initialFacing,
      isMoving: false,
      slotId: schedule.slotId,
      wpIndex: nextIdx,
      routeQueue,
      pauseUntil: hasMultiple ? now + idx * 450 : 0,
      destinationLabel: nextWp.label,
    };
  });

  return result;
}

export interface StepSceneNpcsParams {
  now: number;
  dt: number;
  minutesOfDay: number;
  playerPos: Point2D;
  obstacles?: RectObstacle[];
}

export function stepSceneNpcs(
  prevMap: Record<string, LiveNpcState>,
  npcsInScene: NpcDef[],
  { now, dt, minutesOfDay, playerPos, obstacles }: StepSceneNpcsParams
): { nextMap: Record<string, LiveNpcState>; anyChanged: boolean; visualChanged: boolean } {
  const nextMap: Record<string, LiveNpcState> = {};
  let anyChanged = false;
  let visualChanged = false;

  for (const npc of npcsInScene) {
    const schedule = resolveScheduleForTime(npc, minutesOfDay);
    const waypoints = schedule.waypoints;
    const curr: LiveNpcState = prevMap[npc.id] ?? {
      x: npc.x,
      y: npc.y,
      facing: 'right',
      isMoving: false,
      slotId: schedule.slotId,
      wpIndex: waypoints.length >= 2 ? 1 : 0,
      routeQueue: [],
      pauseUntil: 0,
      destinationLabel: waypoints[0]?.label,
    };

    const distToPlayer = Math.hypot(curr.x - playerPos.x, curr.y - playerPos.y);

    // 1. Polite pause when player Arga comes close for conversation
    if (distToPlayer < 10.5) {
      const dxPlayer = playerPos.x - curr.x;
      const faceToPlayer: 'left' | 'right' =
        Math.abs(dxPlayer) > 0.6 ? (dxPlayer < 0 ? 'left' : 'right') : curr.facing;
      if (curr.isMoving || curr.facing !== faceToPlayer) {
        anyChanged = true;
        visualChanged = true;
      }
      nextMap[npc.id] = {
        ...curr,
        isMoving: false,
        facing: faceToPlayer,
      };
      continue;
    }

    // 2. If daily schedule window changed (e.g., prayer time or evening), smoothly replan A* route
    if (curr.slotId !== schedule.slotId && waypoints.length > 0) {
      const targetWp = waypoints[0];
      const newRoute = findObstacleAwarePath(
        { x: curr.x, y: curr.y },
        { x: targetWp.x, y: targetWp.y },
        obstacles
      );
      anyChanged = true;
      visualChanged = true;
      nextMap[npc.id] = {
        ...curr,
        slotId: schedule.slotId,
        wpIndex: 0,
        routeQueue: newRoute,
        pauseUntil: 0,
        destinationLabel: targetWp.label,
      };
      continue;
    }

    // 3. Pause naturally at landmark before dispatching next path
    if (now < curr.pauseUntil) {
      if (curr.isMoving) {
        anyChanged = true;
        visualChanged = true;
      }
      nextMap[npc.id] = { ...curr, isMoving: false };
      continue;
    }

    // 4. If routeQueue is empty, select next landmark in active schedule & run A*
    let routeQueue = curr.routeQueue;
    let wpIndex = curr.wpIndex;
    let destinationLabel = curr.destinationLabel;

    if (routeQueue.length === 0) {
      if (waypoints.length >= 2) {
        wpIndex = (wpIndex + 1) % waypoints.length;
        const targetWp = waypoints[wpIndex];
        routeQueue = findObstacleAwarePath(
          { x: curr.x, y: curr.y },
          { x: targetWp.x, y: targetWp.y },
          obstacles
        );
        destinationLabel = targetWp.label;
        anyChanged = true;
      } else {
        const homeWp = waypoints[0] ?? { x: npc.x, y: npc.y };
        const distHome = Math.hypot(homeWp.x - curr.x, homeWp.y - curr.y);
        if (distHome > 1.2) {
          routeQueue = findObstacleAwarePath(
            { x: curr.x, y: curr.y },
            { x: homeWp.x, y: homeWp.y },
            obstacles
          );
          destinationLabel = homeWp.label;
          anyChanged = true;
        } else {
          if (curr.isMoving) {
            anyChanged = true;
            visualChanged = true;
          }
          nextMap[npc.id] = { ...curr, isMoving: false };
          continue;
        }
      }
    }

    // 5. Walk smoothly along the A* smoothed routeQueue
    const nextNode = routeQueue[0];
    if (!nextNode) {
      nextMap[npc.id] = { ...curr, isMoving: false, wpIndex, destinationLabel };
      continue;
    }

    const dx = nextNode.x - curr.x;
    const dy = nextNode.y - curr.y;
    const dist = Math.hypot(dx, dy);
    const speed = npc.walkSpeed ?? 6.2;
    const stepDist = speed * dt;

    if (dist <= Math.max(0.45, stepDist)) {
      const remainingQueue = routeQueue.slice(1);
      const arrivedAtLandmark = remainingQueue.length === 0;
      const targetWp = waypoints[wpIndex % waypoints.length];
      const pauseMs = arrivedAtLandmark ? (targetWp?.pauseSec ?? 3.2) * 1000 : 0;

      anyChanged = true;
      if (arrivedAtLandmark) {
        visualChanged = true;
      }

      nextMap[npc.id] = {
        ...curr,
        x: nextNode.x,
        y: nextNode.y,
        isMoving: !arrivedAtLandmark,
        wpIndex,
        routeQueue: remainingQueue,
        pauseUntil: arrivedAtLandmark ? now + pauseMs : 0,
        destinationLabel,
      };
    } else {
      const nx = curr.x + (dx / dist) * stepDist;
      const ny = curr.y + (dy / dist) * stepDist;
      const nextFacing: 'left' | 'right' =
        dx < -0.04 ? 'left' : dx > 0.04 ? 'right' : curr.facing;

      anyChanged = true;
      if (!curr.isMoving || curr.facing !== nextFacing) {
        visualChanged = true;
      }

      nextMap[npc.id] = {
        ...curr,
        x: nx,
        y: ny,
        facing: nextFacing,
        isMoving: true,
        wpIndex,
        routeQueue,
        destinationLabel,
      };
    }
  }

  return { nextMap, anyChanged, visualChanged };
}
