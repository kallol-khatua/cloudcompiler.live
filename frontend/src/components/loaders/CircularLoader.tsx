import React from "react";

const CircularLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Rotating circle loader */}
        <div className="w-6 h-6 border-4 border-blue-300 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default CircularLoader;
