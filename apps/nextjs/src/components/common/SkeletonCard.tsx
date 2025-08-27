import React from "react";

interface SkeletonCardProps {
  className?: string;
}

// Custom CSS for gradient animation
const gradientAnimation = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = "" }) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: gradientAnimation }} />
      <div
        className={`relative rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-sm ${className}`}
      >
        {/* Title skeleton */}
        <div className="mb-4 h-6 w-32 animate-shimmer rounded bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-[length:200%_100%]"></div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-48 animate-shimmer rounded bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-[length:200%_100%]"></div>
          <div className="h-4 w-40 animate-shimmer rounded bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-[length:200%_100%]"></div>
          <div className="h-4 w-36 animate-shimmer rounded bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-[length:200%_100%]"></div>
          <div className="h-4 w-44 animate-shimmer rounded bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-[length:200%_100%]"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="mt-4 h-12 w-full animate-shimmer rounded-xl bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-[length:200%_100%]"></div>
      </div>
    </>
  );
};

export const SkeletonCardGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
};
