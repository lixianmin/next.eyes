'use client';

import { useEffect, useState } from 'react';

const Eyes = () => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const moveEyes = () => {
      // 随机生成-20到20之间的数值，用于眼球移动
      const x = Math.random() * 40 - 20;
      const y = Math.random() * 40 - 20;
      setEyePosition({ x, y });
    };

    // 每2秒改变一次眼睛位置
    const interval = setInterval(moveEyes, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-8">
      {/* 左眼 */}
      <div className="w-24 h-24 bg-white rounded-full border-4 border-gray-800 relative overflow-hidden">
        <div 
          className="w-12 h-12 bg-gray-800 rounded-full absolute transition-all duration-500 ease-in-out"
          style={{
            top: `calc(50% - 24px + ${eyePosition.y}px)`,
            left: `calc(50% - 24px + ${eyePosition.x}px)`,
          }}
        />
      </div>
      {/* 右眼 */}
      <div className="w-24 h-24 bg-white rounded-full border-4 border-gray-800 relative overflow-hidden">
        <div 
          className="w-12 h-12 bg-gray-800 rounded-full absolute transition-all duration-500 ease-in-out"
          style={{
            top: `calc(50% - 24px + ${eyePosition.y}px)`,
            left: `calc(50% - 24px + ${eyePosition.x}px)`,
          }}
        />
      </div>
    </div>
  );
};

export default Eyes;
