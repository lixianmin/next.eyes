'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const Eyes = () => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [springPosition, setSpringPosition] = useState({ x: 0, y: 0 });
  const [isDizzy, setIsDizzy] = useState(false);
  const [currentMood, setCurrentMood] = useState<'normal' | 'happy' | 'sleepy' | 'surprised' | 'angry'>('normal');
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [eyeState, setEyeState] = useState<'static' | 'looking' | 'dizzy'>('static');

  // Constants
  const STATIC_TIMEOUT = 1000;
  const DIZZY_DURATION = 800;
  const RETURN_SPEED = 0.9;
  const MAX_MOVEMENT = 12;
  const MOVEMENT_THRESHOLD = 0.5;  // 检测静止状态的阈值
  const SHAKE_THRESHOLD = 25;     // 检测摇晃状态的阈值

  // Refs for cleanup
  const lastMovementTime = useRef(Date.now());
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const moodChangeInterval = useRef<NodeJS.Timeout | null>(null);
  const autoMoveInterval = useRef<NodeJS.Timeout | null>(null);
  const dizzyTimeout = useRef<NodeJS.Timeout | null>(null);
  const springAnimationFrame = useRef<number | null>(null);
  const centerAnimationFrame = useRef<number | null>(null);

  // State machine transitions
  const transitionToStatic = useCallback(() => {
    setEyeState('static');
    startAutoMove();
    startMoodChanges();
  }, []);

  const transitionToLooking = useCallback(() => {
    setEyeState('looking');
    stopAutoMove();
    stopMoodChanges();
    setCurrentMood('normal');
  }, []);

  const transitionToDizzy = useCallback(() => {
    setEyeState('dizzy');
    stopAutoMove();
    stopMoodChanges();
    setIsDizzy(true);

    if (dizzyTimeout.current) {
      clearTimeout(dizzyTimeout.current);
    }

    dizzyTimeout.current = setTimeout(() => {
      setIsDizzy(false);
      returnToCenter();
      transitionToLooking();
    }, DIZZY_DURATION);
  }, []);

  // Auto movement for static state
  const movePatterns = [
    { x: 0, y: 0 },
    { x: 8, y: -5 },
    { x: -8, y: -5 },
    { x: 8, y: 5 },
    { x: -8, y: 5 },
  ];

  const startAutoMove = useCallback(() => {
    if (autoMoveInterval.current) {
      clearInterval(autoMoveInterval.current);
    }

    let patternIndex = 0;
    autoMoveInterval.current = setInterval(() => {
      setSpringPosition(movePatterns[patternIndex]);
      patternIndex = (patternIndex + 1) % movePatterns.length;
    }, 2000);
  }, []);

  const stopAutoMove = useCallback(() => {
    if (autoMoveInterval.current) {
      clearInterval(autoMoveInterval.current);
      autoMoveInterval.current = null;
    }
  }, []);

  // Mood changes for static state
  const startMoodChanges = useCallback(() => {
    const moods = ['normal', 'happy', 'sleepy', 'surprised', 'angry'];

    const changeMood = () => {
      const availableMoods = moods.filter(mood => mood !== currentMood);
      const newMood = availableMoods[Math.floor(Math.random() * availableMoods.length)] as typeof currentMood;
      setCurrentMood(newMood);

      const nextChange = Math.random() * 500 + 500; // Random between 500ms and 1000ms
      moodChangeInterval.current = setTimeout(changeMood, nextChange);
    };

    changeMood();
  }, [currentMood]);

  const stopMoodChanges = useCallback(() => {
    if (moodChangeInterval.current) {
      clearTimeout(moodChangeInterval.current);
      moodChangeInterval.current = null;
    }
  }, []);

  // Motion handling
  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      if (!event.acceleration) return;

      const { x = 0, y = 0, z = 0 } = event.acceleration;
      const deltaX = Math.abs(x - lastAcceleration.current.x);
      const deltaY = Math.abs(y - lastAcceleration.current.y);
      const deltaZ = Math.abs(z - lastAcceleration.current.z);
      const totalMovement = deltaX + deltaY + deltaZ;

      // Update last acceleration values
      lastAcceleration.current = { x, y, z };

      // State transitions based on movement
      if (totalMovement > SHAKE_THRESHOLD) {
        // Fast movement - transition to dizzy
        transitionToDizzy();
      } else if (totalMovement > MOVEMENT_THRESHOLD) {
        // Normal movement - transition to looking
        lastMovementTime.current = Date.now();
        if (eyeState !== 'dizzy') {
          transitionToLooking();
        }
      } else {
        // Check for static state
        const now = Date.now();
        if (now - lastMovementTime.current > STATIC_TIMEOUT && eyeState !== 'static' && eyeState !== 'dizzy') {
          transitionToStatic();
        }
      }

      // Update eye position for looking state
      if (eyeState === 'looking') {
        const newX = Math.max(Math.min(x * 2, MAX_MOVEMENT), -MAX_MOVEMENT);
        const newY = Math.max(Math.min(y * 2, MAX_MOVEMENT), -MAX_MOVEMENT);
        setSpringPosition({ x: newX, y: newY });
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    // Initial state check
    const now = Date.now();
    if (now - lastMovementTime.current > STATIC_TIMEOUT) {
      transitionToStatic();
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      stopAutoMove();
      stopMoodChanges();
      if (dizzyTimeout.current) clearTimeout(dizzyTimeout.current);
      if (springAnimationFrame.current) cancelAnimationFrame(springAnimationFrame.current);
      if (centerAnimationFrame.current) cancelAnimationFrame(centerAnimationFrame.current);
    };
  }, [eyeState, transitionToStatic, transitionToLooking, transitionToDizzy, stopAutoMove, stopMoodChanges]);

  // Return to center animation
  const returnToCenter = useCallback(() => {
    const animate = () => {
      setSpringPosition(prev => {
        const newX = prev.x * RETURN_SPEED;
        const newY = prev.y * RETURN_SPEED;

        if (Math.abs(newX) < 0.1 && Math.abs(newY) < 0.1) {
          centerAnimationFrame.current = null;
          return { x: 0, y: 0 };
        }

        centerAnimationFrame.current = requestAnimationFrame(animate);
        return { x: newX, y: newY };
      });
    };

    if (centerAnimationFrame.current) {
      cancelAnimationFrame(centerAnimationFrame.current);
    }
    centerAnimationFrame.current = requestAnimationFrame(animate);
  }, []);

  // Spring animation
  useEffect(() => {
    let lastTime = performance.now();

    const updateSpringAnimation = () => {
      if (centerAnimationFrame.current) return; // Don't update if returning to center

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Spring physics calculation
      const springForceX = -0.2 * springPosition.x;
      const springForceY = -0.2 * springPosition.y;

      // Update velocity with spring force and damping
      const springVelocityX = (springForceX + 0.9 * 0) * deltaTime;
      const springVelocityY = (springForceY + 0.9 * 0) * deltaTime;

      // Calculate new position
      const newX = springPosition.x + springVelocityX;
      const newY = springPosition.y + springVelocityY;

      // Constrain position within screen bounds
      setSpringPosition({
        x: Math.max(Math.min(newX, MAX_MOVEMENT), -MAX_MOVEMENT),
        y: Math.max(Math.min(newY, MAX_MOVEMENT), -MAX_MOVEMENT)
      });

      // Continue animation if movement is significant
      if (Math.abs(springVelocityX) > 0.01 || Math.abs(springVelocityY) > 0.01) {
        springAnimationFrame.current = requestAnimationFrame(updateSpringAnimation);
      } else {
        springAnimationFrame.current = null;
      }
    };

    springAnimationFrame.current = requestAnimationFrame(updateSpringAnimation);
    return () => {
      if (springAnimationFrame.current) cancelAnimationFrame(springAnimationFrame.current);
    };
  }, [springPosition]);

  // Request permission
  useEffect(() => {
    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
        // @ts-ignore
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          // @ts-ignore
          const permissionState = await DeviceOrientationEvent.requestPermission();
          setPermission(permissionState);
        } catch (err) {
          console.error('Error requesting device orientation permission:', err);
        }
      }
    };

    requestPermission();
  }, []);

  // Handle orientation
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!event.beta || !event.gamma) return;

      lastMovementTime.current = Date.now();
      stopAutoMove();

      const x = Math.min(Math.max((-event.gamma / 90) * 20, -20), 20);
      const y = Math.min(Math.max((-(event.beta - 60) / 180) * 20, -20), 20);

      setEyePosition({ x, y });
    };

    if (permission === 'granted') {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [permission]);

  // Add styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dizzyEyes {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(-10deg); }
        75% { transform: rotate(10deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes dizzyPupils {
        0% { transform: scale(1); }
        50% { transform: scale(0.9) rotate(180deg); }
        100% { transform: scale(1) rotate(360deg); }
      }
      @keyframes dizzySpiral {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes blinkEyes {
        0%, 90%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
      }
      @keyframes happyEyes {
        0%, 100% { transform: scaleY(0.7); }
        50% { transform: scaleY(0.6); }
      }
      @keyframes sleepyEyes {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(0.2); }
      }
      @keyframes surprisedEyes {
        0%, 100% { transform: scale(1.2); }
        50% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {permission === 'prompt' && (
        <button
          onClick={() => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
              DeviceOrientationEvent.requestPermission()
                .then((permissionState: PermissionState) => {
                  setPermission(permissionState);
                })
                .catch(console.error);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg mb-4"
        >
          允许访问设备方向
        </button>
      )}

      <div className="flex items-center justify-center gap-12 p-8">
        <div className="relative" style={{
          transform: `translate(${springPosition.x * 20}px, ${springPosition.y * 20}px)`,
          transition: 'transform 0.1s linear'
        }}>
          <div
            className={`w-14 h-[56px] bg-cyan-100 relative overflow-hidden transform transition-all duration-500 rounded-full
              ${currentMood === 'angry' ? '-rotate-[20deg] -translate-y-2' : ''}
              ${currentMood === 'happy' ? 'animate-[happyEyes_1s_ease-in-out_infinite]' : ''}
              ${currentMood === 'sleepy' ? 'animate-[sleepyEyes_2s_ease-in-out_infinite]' : ''}
              ${currentMood === 'surprised' ? 'animate-[surprisedEyes_0.5s_ease-in-out_infinite]' : ''}
              ${isDizzy ? 'animate-[dizzyEyes_0.8s_ease-in-out_infinite]' : ''}`}
            style={{
              clipPath: isDizzy
                ? 'circle(50% at 50% 50%)'
                : currentMood === 'happy'
                  ? 'ellipse(50% 40% at 50% 50%)'
                  : currentMood === 'sleepy'
                    ? 'ellipse(50% 30% at 50% 50%)'
                    : currentMood === 'surprised'
                      ? 'circle(55% at 50% 50%)'
                      : 'ellipse(50% 50% at 50% 50%)'
            }}>
            <div
              className={`absolute w-10 h-10 rounded-full bg-gradient-to-br from-cyan-50 to-white transition-all duration-50 ease-out
                ${isDizzy ? 'animate-[dizzyPupils_1.6s_linear_infinite]' : ''}
                ${currentMood === 'sleepy' ? 'opacity-50' : ''}
                ${currentMood === 'surprised' ? 'scale-110' : ''}`}
              style={{
                transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                background: isDizzy
                  ? 'conic-gradient(from 0deg, cyan, white, cyan)'
                  : 'linear-gradient(135deg, #e0ffff 0%, #ffffff 100%)'
              }}
            >
              <div className={`absolute w-6 h-6 rounded-full bg-black top-2 left-2
                ${isDizzy ? 'animate-[dizzySpiral_2s_linear_infinite]' : ''}`}>
                {isDizzy ? (
                  <div className="w-full h-full rounded-full border-2 border-cyan-50"
                    style={{
                      clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)',
                      animation: 'dizzySpiral 2s linear infinite'
                    }} />
                ) : (
                  <>
                    <div className="absolute w-3 h-3 rounded-full bg-cyan-50 -top-1 -right-1 opacity-80" />
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-50 bottom-1 left-1 opacity-60" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative" style={{
          transform: `translate(${springPosition.x * 20}px, ${springPosition.y * 20}px)`,
          transition: 'transform 0.1s linear'
        }}>
          <div
            className={`w-14 h-[56px] bg-cyan-100 relative overflow-hidden transform transition-all duration-500 rounded-full
              ${currentMood === 'angry' ? 'rotate-[20deg] -translate-y-2' : ''}
              ${currentMood === 'happy' ? 'animate-[happyEyes_1s_ease-in-out_infinite]' : ''}
              ${currentMood === 'sleepy' ? 'animate-[sleepyEyes_2s_ease-in-out_infinite]' : ''}
              ${currentMood === 'surprised' ? 'animate-[surprisedEyes_0.5s_ease-in-out_infinite]' : ''}
              ${isDizzy ? 'animate-[dizzyEyes_0.8s_ease-in-out_infinite]' : ''}`}
            style={{
              clipPath: isDizzy
                ? 'circle(50% at 50% 50%)'
                : currentMood === 'happy'
                  ? 'ellipse(50% 40% at 50% 50%)'
                  : currentMood === 'sleepy'
                    ? 'ellipse(50% 30% at 50% 50%)'
                    : currentMood === 'surprised'
                      ? 'circle(55% at 50% 50%)'
                      : 'ellipse(50% 50% at 50% 50%)'
            }}>
            <div
              className={`absolute w-10 h-10 rounded-full bg-gradient-to-br from-cyan-50 to-white transition-all duration-50 ease-out
                ${isDizzy ? 'animate-[dizzyPupils_1.6s_linear_infinite]' : ''}
                ${currentMood === 'sleepy' ? 'opacity-50' : ''}
                ${currentMood === 'surprised' ? 'scale-110' : ''}`}
              style={{
                transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                background: isDizzy
                  ? 'conic-gradient(from 0deg, cyan, white, cyan)'
                  : 'linear-gradient(135deg, #e0ffff 0%, #ffffff 100%)'
              }}
            >
              <div className={`absolute w-6 h-6 rounded-full bg-black top-2 left-2
                ${isDizzy ? 'animate-[dizzySpiral_2s_linear_infinite]' : ''}`}>
                {isDizzy ? (
                  <div className="w-full h-full rounded-full border-2 border-cyan-50"
                    style={{
                      clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)',
                      animation: 'dizzySpiral 2s linear infinite'
                    }} />
                ) : (
                  <>
                    <div className="absolute w-3 h-3 rounded-full bg-cyan-50 -top-1 -right-1 opacity-80" />
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-50 bottom-1 left-1 opacity-60" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Eyes;
