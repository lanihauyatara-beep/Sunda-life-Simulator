import { useEffect, useRef, useState } from 'react';

export interface GamepadActionEvent {
  A: boolean; // Cross / Confirm / Interact
  B: boolean; // Circle / Back / Cancel
  X: boolean; // Square / HP or Toggle Warung
  Y: boolean; // Triangle / Map
  LB: boolean;
  RB: boolean;
  START: boolean;
  DPAD_UP: boolean;
  DPAD_DOWN: boolean;
  DPAD_LEFT: boolean;
  DPAD_RIGHT: boolean;
}

export interface GamepadInputState {
  connected: boolean;
  controllerName: string;
  moveX: number; // -1..1
  moveY: number; // -1..1
}

interface UseGamepadOptions {
  enabled?: boolean;
  onButtonPress?: (btn: keyof GamepadActionEvent) => void;
}

/**
 * Full ASUS ROG Ally / Xbox Standard Gamepad API + Keyboard Bridge
 * Polls navigator.getGamepads() at 60fps for zero-latency movement and discrete UI actions.
 */
export function useGamepad(options: UseGamepadOptions = {}) {
  const { enabled = true, onButtonPress } = options;
  const [status, setStatus] = useState<GamepadInputState>({
    connected: false,
    controllerName: '',
    moveX: 0,
    moveY: 0,
  });

  const moveVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysPressedRef = useRef<Set<string>>(new Set());
  const prevButtonsRef = useRef<Record<number, boolean>>({});
  const lastDpadRepeatRef = useRef<Record<string, number>>({});
  const onButtonPressRef = useRef(onButtonPress);
  onButtonPressRef.current = onButtonPress;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return;
      const key = e.key.toLowerCase();
      keysPressedRef.current.add(key);

      if (e.repeat) {
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
          const map: Record<string, keyof GamepadActionEvent> = {
            arrowup: 'DPAD_UP',
            arrowdown: 'DPAD_DOWN',
            arrowleft: 'DPAD_LEFT',
            arrowright: 'DPAD_RIGHT',
          };
          onButtonPressRef.current?.(map[key]);
        }
        return;
      }

      const activeTag = document.activeElement?.tagName;
      const isTextInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if (key === 'enter' || key === 'e' || key === ' ') {
        if (!isTextInput && (key === ' ' || key === 'enter')) {
          e.preventDefault();
        }
        if (!isTextInput || key === 'enter') {
          onButtonPressRef.current?.('A');
        }
      } else if (key === 'escape' || key === 'backspace') {
        if (!isTextInput) {
          onButtonPressRef.current?.('B');
        }
      } else if (key === 'h' || key === 'x') {
        onButtonPressRef.current?.('X');
      } else if (key === 'm' || key === 'tab') {
        if (key === 'tab') e.preventDefault();
        onButtonPressRef.current?.('Y');
      } else if (key === 'p') {
        onButtonPressRef.current?.('START');
      } else if (key === 'q') {
        onButtonPressRef.current?.('LB');
      } else if (key === 'r') {
        onButtonPressRef.current?.('RB');
      } else if (key === 'arrowup') {
        e.preventDefault();
        onButtonPressRef.current?.('DPAD_UP');
      } else if (key === 'arrowdown') {
        e.preventDefault();
        onButtonPressRef.current?.('DPAD_DOWN');
      } else if (key === 'arrowleft') {
        e.preventDefault();
        onButtonPressRef.current?.('DPAD_LEFT');
      } else if (key === 'arrowright') {
        e.preventDefault();
        onButtonPressRef.current?.('DPAD_RIGHT');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  useEffect(() => {
    let rafId = 0;

    const onConnect = (e: GamepadEvent) => {
      setStatus((prev) => ({
        ...prev,
        connected: true,
        controllerName: e.gamepad.id || 'ROG Ally Controller',
      }));
    };
    const onDisconnect = () => {
      setStatus((prev) => ({
        ...prev,
        connected: false,
        controllerName: '',
      }));
    };

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    const poll = () => {
      let gpX = 0;
      let gpY = 0;
      let hasGp = false;
      let gpName = '';

      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const pads = navigator.getGamepads();
        for (const pad of pads) {
          if (!pad || !pad.connected) continue;
          hasGp = true;
          gpName = pad.id;

          // Left analog stick (axes 0, 1) with deadzone
          const ax0 = pad.axes[0] ?? 0;
          const ax1 = pad.axes[1] ?? 0;
          const deadzone = 0.22;
          if (Math.abs(ax0) > deadzone) gpX = ax0;
          if (Math.abs(ax1) > deadzone) gpY = ax1;

          // D-Pad digital fallback for movement (buttons 12,13,14,15)
          const up = pad.buttons[12]?.pressed;
          const down = pad.buttons[13]?.pressed;
          const left = pad.buttons[14]?.pressed;
          const right = pad.buttons[15]?.pressed;
          if (left) gpX = -1;
          if (right) gpX = 1;
          if (up) gpY = -1;
          if (down) gpY = 1;

          // Discrete button presses
          const buttonMap: [number, keyof GamepadActionEvent][] = [
            [0, 'A'],
            [1, 'B'],
            [2, 'X'],
            [3, 'Y'],
            [4, 'LB'],
            [5, 'RB'],
            [9, 'START'],
          ];

          for (const [idx, action] of buttonMap) {
            const pressed = Boolean(pad.buttons[idx]?.pressed);
            const wasPressed = Boolean(prevButtonsRef.current[idx]);
            if (pressed && !wasPressed && enabled) {
              onButtonPressRef.current?.(action);
            }
            prevButtonsRef.current[idx] = pressed;
          }

          // D-pad & Left stick menu navigation with repeat cooldown
          const now = performance.now();
          const navDirs: [boolean, keyof GamepadActionEvent][] = [
            [Boolean(up || ax1 < -0.65), 'DPAD_UP'],
            [Boolean(down || ax1 > 0.65), 'DPAD_DOWN'],
            [Boolean(left || ax0 < -0.65), 'DPAD_LEFT'],
            [Boolean(right || ax0 > 0.65), 'DPAD_RIGHT'],
          ];

          for (const [isActive, navAction] of navDirs) {
            if (isActive && enabled) {
              const last = lastDpadRepeatRef.current[navAction] ?? 0;
              if (now - last > 210) {
                lastDpadRepeatRef.current[navAction] = now;
                onButtonPressRef.current?.(navAction);
              }
            } else if (!isActive) {
              lastDpadRepeatRef.current[navAction] = 0;
            }
          }

          break;
        }
      }

      // Keyboard WASD + Arrow movement merge
      const keys = keysPressedRef.current;
      let kbX = 0;
      let kbY = 0;
      if (keys.has('a') || keys.has('arrowleft')) kbX -= 1;
      if (keys.has('d') || keys.has('arrowright')) kbX += 1;
      if (keys.has('w') || keys.has('arrowup')) kbY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) kbY += 1;

      const finalX = Math.abs(gpX) > 0.05 ? gpX : kbX;
      const finalY = Math.abs(gpY) > 0.05 ? gpY : kbY;

      moveVecRef.current = { x: finalX, y: finalY };

      setStatus((prev) => {
        if (
          prev.connected === hasGp &&
          prev.controllerName === gpName &&
          Math.abs(prev.moveX - finalX) < 0.05 &&
          Math.abs(prev.moveY - finalY) < 0.05
        ) {
          return prev;
        }
        return {
          connected: hasGp,
          controllerName: gpName,
          moveX: finalX,
          moveY: finalY,
        };
      });

      rafId = requestAnimationFrame(poll);
    };

    rafId = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, [enabled]);

  return {
    status,
    moveVecRef,
  };
}

export function emitUiGamepadAction(btn: keyof GamepadActionEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<keyof GamepadActionEvent>('sunda-ui-gamepad', { detail: btn }));
}

export function useUiGamepadAction(handler: (btn: keyof GamepadActionEvent) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<keyof GamepadActionEvent>;
      handlerRef.current(custom.detail);
    };
    window.addEventListener('sunda-ui-gamepad', listener);
    return () => window.removeEventListener('sunda-ui-gamepad', listener);
  }, []);
}

