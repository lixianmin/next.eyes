'use client';

import { useEffect, useState, useRef } from 'react';

const Eyes = () => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const lastMovementTime = useRef(Date.now());
  const autoMoveInterval = useRef<NodeJS.Timeout | null>(null);

  // 自动移动眼睛的函数
  const startAutoMove = () => {
    if (autoMoveInterval.current) return;

    const movePattern = [
      { x: 0, y: 0 },     // 中心
      { x: 35, y: 0 },    // 右
      { x: 0, y: -35 },   // 上
      { x: -35, y: 0 },   // 左
      { x: 0, y: 35 },    // 下
      { x: 25, y: 25 },   // 右下
      { x: -25, y: -25 }, // 左上
      { x: 25, y: -25 },  // 右上
      { x: -25, y: 25 },  // 左下
    ];

    let patternIndex = 0;

    autoMoveInterval.current = setInterval(() => {
      setEyePosition(movePattern[patternIndex]);
      patternIndex = (patternIndex + 1) % movePattern.length;
    }, 1000);
  };

  const stopAutoMove = () => {
    if (autoMoveInterval.current) {
      clearInterval(autoMoveInterval.current);
      autoMoveInterval.current = null;
    }
  };

  useEffect(() => {
    // 检查和请求设备方向权限
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

    // 处理设备方向变化
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!event.beta || !event.gamma) return;

      // 更新最后移动时间
      lastMovementTime.current = Date.now();
      stopAutoMove();

      // 扩大移动范围到40像素（眼框的大部分区域）
      // gamma 是左右倾斜角度 (-90 到 90)
      const x = Math.min(Math.max((-event.gamma / 90) * 40, -40), 40);

      // beta 是前后倾斜角度 (-180 到 180)
      const y = Math.min(Math.max((-(event.beta - 60) / 180) * 40, -40), 40);

      setEyePosition({ x, y });
    };

    // 检查设备是否静止的定时器
    const checkStillness = setInterval(() => {
      const now = Date.now();
      if (now - lastMovementTime.current > 2000) { // 2秒无移动则认为静止
        startAutoMove();
      }
    }, 2000);

    // 添加事件监听器
    if (permission === 'granted') {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      // 如果没有权限，直接开始自动移动
      startAutoMove();
    }

    // 清理函数
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      clearInterval(checkStillness);
      stopAutoMove();
    };
  }, [permission]);

  return (
    <div className="flex flex-col items-center gap-4">
      {permission === 'prompt' && (
        <button
          onClick={() => {
            // @ts-ignore
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
              // @ts-ignore
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

      <div className="flex items-center justify-center gap-12">
        {/* 左眼 */}
        <div className="w-36 h-36 bg-white rounded-full border-[3px] border-black relative overflow-hidden shadow-lg">
          <div
            className="w-[28px] h-[28px] bg-gray-800 rounded-full absolute transition-all duration-50 ease-out"
            style={{
              top: `calc(50% - 14px + ${eyePosition.y}px)`,
              left: `calc(50% - 14px + ${eyePosition.x}px)`,
            }}
          >
            {/* 眼睛高光 - 大光点 */}
            <div className="absolute w-[10px] h-[10px] bg-white rounded-full top-[4px] right-[4px]" />
            {/* 眼睛高光 - 小光点 */}
            <div className="absolute w-[6px] h-[6px] bg-white rounded-full top-[16px] right-[16px]" />
          </div>
        </div>
        {/* 右眼 */}
        <div className="w-36 h-36 bg-white rounded-full border-[3px] border-black relative overflow-hidden shadow-lg">
          <div
            className="w-[28px] h-[28px] bg-gray-800 rounded-full absolute transition-all duration-50 ease-out"
            style={{
              top: `calc(50% - 14px + ${eyePosition.y}px)`,
              left: `calc(50% - 14px + ${eyePosition.x}px)`,
            }}
          >
            {/* 眼睛高光 - 大光点 */}
            <div className="absolute w-[10px] h-[10px] bg-white rounded-full top-[4px] right-[4px]" />
            {/* 眼睛高光 - 小光点 */}
            <div className="absolute w-[6px] h-[6px] bg-white rounded-full top-[16px] right-[16px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Eyes;
