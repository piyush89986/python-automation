import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl transition-all duration-200 ${
        hoverable ? 'hover:border-slate-700 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
