import React from 'react';

const LoadingSpinner: React.FC<{ message?: string; size?: 'lg' | 'sm' }> = ({ message, size = 'lg' }) => {
  if (size === 'sm') {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white/80"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-full my-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white/80 mb-4"></div>
      <p className="text-lg text-white/90">{message || "정보를 불러오는 중..."}</p>
    </div>
  );
};

export default LoadingSpinner;