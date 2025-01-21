'use client';

import { useEffect, useState } from 'react';

const Eyes = () => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [permission, setPermission] = useState<PermissionState>('prompt');

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

      // beta 是前后倾斜角度 (-180 到 180)
      // gamma 是左右倾斜角度 (-90 到 90)
      const x = Math.min(Math.max((event.gamma / 90) * 20, -20), 20);
      const y = Math.min(Math.max((event.beta - 60) / 180 * 20, -20), 20);

      setEyePosition({ x, y });
    };

    // 添加事件监听器
    if (permission === 'granted') {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    // 清理函数
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
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
        <div className="w-36 h-36 bg-white rounded-full border-6 border-gray-800 relative overflow-hidden shadow-lg">
          <div
            className="w-[28px] h-[28px] bg-gray-800 rounded-full absolute transition-all duration-50 ease-out"
            style={{
              top: `calc(50% - 36px + ${eyePosition.y * 1.5}px)`,
              left: `calc(50% - 36px + ${eyePosition.x * 1.5}px)`,
            }}
          >
            {/* 眼睛高光 - 大光点 */}
            <div className="absolute w-[10px] h-[10px] bg-white rounded-full top-[4px] right-[4px]" />
            {/* 眼睛高光 - 小光点 */}
            <div className="absolute w-[6px] h-[6px] bg-white rounded-full top-[16px] right-[16px]" />
          </div>
        </div>
        {/* 右眼 */}
        <div className="w-36 h-36 bg-white rounded-full border-6 border-gray-800 relative overflow-hidden shadow-lg">
          <div
            className="w-[28px] h-[28px] bg-gray-800 rounded-full absolute transition-all duration-50 ease-out"
            style={{
              top: `calc(50% - 36px + ${eyePosition.y * 1.5}px)`,
              left: `calc(50% - 36px + ${eyePosition.x * 1.5}px)`,
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
