import React, { useMemo } from 'react';

export default function SakuraPetals() {
  const petals = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.5 + Math.random() * 5) % 98}%`,
      animationDuration: `${7 + (i % 7) * 2}s`,
      animationDelay: `${(i * 0.7) % 6}s`,
      width: `${12 + (i % 8) * 2}px`,
      height: `${14 + (i % 9) * 2}px`,
    }));
  }, []);

  return (
    <div className="sakura-container" aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
