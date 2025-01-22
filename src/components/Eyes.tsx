'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const Eyes = () => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [springPosition, setSpringPosition] = useState({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
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

  // Eye movement patterns for different moods and behaviors
  const eyePatterns = {
    casualGlance1: [
      { x: 0, y: 0, duration: 500 },    // center
      { x: 3, y: -4, duration: 300 },   // slight up-right
      { x: 0, y: 0, duration: 400 },    // center
      { x: -4, y: 2, duration: 300 },   // slight down-left
      { x: 0, y: 0, duration: 600 },    // center
    ],
    casualGlance2: [
      { x: 0, y: 0, duration: 400 },    // center
      { x: 5, y: 3, duration: 300 },    // slight down-right
      { x: 0, y: 0, duration: 500 },    // center
      { x: -3, y: -5, duration: 300 },  // slight up-left
      { x: 0, y: 0, duration: 450 },    // center
    ],
    curiousLook1: [
      { x: 0, y: 0, duration: 400 },     // center
      { x: 8, y: -6, duration: 400 },    // up-right
      { x: 8, y: 6, duration: 800 },     // down-right
      { x: 0, y: 0, duration: 500 },     // center
    ],
    curiousLook2: [
      { x: 0, y: 0, duration: 400 },     // center
      { x: -7, y: 0, duration: 600 },    // left
      { x: 7, y: 0, duration: 800 },     // right
      { x: 0, y: 0, duration: 500 },     // center
    ],
    scanning1: [
      { x: 0, y: 0, duration: 400 },     // center
      { x: -6, y: -6, duration: 400 },   // top-left
      { x: 6, y: -6, duration: 600 },    // top-right
      { x: 6, y: 6, duration: 400 },     // bottom-right
      { x: -6, y: 6, duration: 600 },    // bottom-left
      { x: 0, y: 0, duration: 500 },     // center
    ],
    playful1: [
      { x: 0, y: 0, duration: 300 },     // center
      { x: 8, y: -8, duration: 200 },    // quick top-right
      { x: -8, y: -8, duration: 200 },   // quick top-left
      { x: 0, y: 0, duration: 400 },     // center
      { x: 0, y: 8, duration: 200 },     // quick down
      { x: 0, y: 0, duration: 500 },     // center
    ]
  };

  // Function to get a random pattern
  const getRandomPattern = () => {
    const patterns = Object.keys(eyePatterns);
    const randomIndex = Math.floor(Math.random() * patterns.length);
    return eyePatterns[patterns[randomIndex]];
  };

  // Function to animate through a pattern
  const animatePattern = useCallback((pattern: typeof eyePatterns[keyof typeof eyePatterns]) => {
    let currentIndex = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (currentIndex >= pattern.length) {
        // Pattern complete, start a new random pattern if still in static mode
        if (eyeState === 'static' && currentMood !== 'sleepy') {
          const newPattern = getRandomPattern();
          animatePattern(newPattern);
        }
        return;
      }

      const currentPosition = pattern[currentIndex];
      if (elapsed >= currentPosition.duration) {
        // Move to next position
        setEyePosition({ x: currentPosition.x, y: currentPosition.y });
        currentIndex++;
        startTime = timestamp;
      }

      if (currentIndex < pattern.length) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [eyeState, currentMood]);

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

    // Show surprised or angry mood randomly when transitioning from static
    if (eyeState === 'static') {
      const suddenMood = Math.random() < 0.5 ? 'surprised' : 'angry';
      setCurrentMood(suddenMood);

      // Return to normal mood after animation
      setTimeout(() => {
        setCurrentMood('normal');
      }, 1000);
    }
  }, [eyeState]);

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

  // Start auto movement with new patterns
  const startAutoMove = useCallback(() => {
    if (autoMoveInterval.current) {
      clearInterval(autoMoveInterval.current);
    }

    // Start with a random pattern
    const initialPattern = getRandomPattern();
    animatePattern(initialPattern);
  }, [animatePattern]);

  const stopAutoMove = useCallback(() => {
    if (autoMoveInterval.current) {
      clearInterval(autoMoveInterval.current);
      autoMoveInterval.current = null;
    }
  }, []);

  // Mood changes for static state
  const startMoodChanges = useCallback(() => {
    if (moodChangeInterval.current) {
      clearTimeout(moodChangeInterval.current);
    }

    // Start with normal mood
    setCurrentMood('normal');

    // Schedule change to sleepy mood after 10-30 seconds
    const sleepyDelay = Math.random() * 20000 + 10000; // Random between 10s and 30s
    moodChangeInterval.current = setTimeout(() => {
      setCurrentMood('sleepy');
    }, sleepyDelay);
  }, []);

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

      // Update eye position for looking state with smoothing
      if (eyeState === 'looking') {
        // Reduce sensitivity by scaling down the input
        const sensitivityScale = 0.3; // Reduce movement sensitivity
        const smoothingFactor = 0.15; // Lower = smoother movement
        const maxSpeed = 2; // Maximum speed for position change

        // Calculate target position with reduced sensitivity
        const targetX = Math.max(Math.min((-x * sensitivityScale), MAX_MOVEMENT), -MAX_MOVEMENT);
        const targetY = Math.max(Math.min((y * sensitivityScale), MAX_MOVEMENT), -MAX_MOVEMENT);

        // Calculate velocity with smoothing
        velocityRef.current.x = (targetX - lastPosition.current.x) * smoothingFactor;
        velocityRef.current.y = (targetY - lastPosition.current.y) * smoothingFactor;

        // Clamp velocity
        velocityRef.current.x = Math.max(Math.min(velocityRef.current.x, maxSpeed), -maxSpeed);
        velocityRef.current.y = Math.max(Math.min(velocityRef.current.y, maxSpeed), -maxSpeed);

        // Update position with smoothed velocity
        const newX = lastPosition.current.x + velocityRef.current.x;
        const newY = lastPosition.current.y + velocityRef.current.y;

        // Clamp final position
        const clampedX = Math.max(Math.min(newX, MAX_MOVEMENT), -MAX_MOVEMENT);
        const clampedY = Math.max(Math.min(newY, MAX_MOVEMENT), -MAX_MOVEMENT);

        lastPosition.current = { x: clampedX, y: clampedY };
        setSpringPosition({ x: clampedX, y: clampedY });
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
        95% { transform: scaleY(0.5); }
      }
      @keyframes happyEyes {
        0%, 100% { transform: scaleY(0.7); }
        50% { transform: scaleY(0.6); }
      }
      @keyframes sleepyEyes {
        0%, 100% { transform: scaleY(0.6); }
        50% { transform: scaleY(0.4); }
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
