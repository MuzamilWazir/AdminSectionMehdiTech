import React from "react";
interface LoaderProps {
  message?: string;
}
const Loading = ({ message }: LoaderProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 h-32 `}
    >
      {/* Animated Logo */}
      <div className="relative">
        <img
          src="logo-first-character.png"
          alt="Logo"
          width={70}
          height={70}
          className="animate-bounce"
        />
        {/* Glow effect */}
        <div className="absolute inset-0 -z-10 blur-xl opacity-30 bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse"></div>
      </div>
      {/* Animated Dots */}
      <div className="flex space-x-3 justify-center items-center">
        {/* First Dot: Mostly Dark Blue */}
        <div
          className="w-2 h-2 rounded-full animate-bounce bg-gradient-to-br from-blue-900 to-blue-700 shadow-md shadow-blue-900/20"
          style={{ animationDuration: "1.2s" }}
        ></div>

        {/* Middle Dot: Transition (Blue to Purple) */}
        <div
          className="w-2 h-2 rounded-full animate-bounce bg-gradient-to-br from-blue-800 via-purple-600 to-pink-600 shadow-md shadow-purple-500/30"
          style={{
            animationDelay: "0.2s",
            animationDuration: "1.2s",
          }}
        ></div>

        {/* Last Dot: Deep Pink / Purple */}
        <div
          className="w-2 h-2 rounded-full animate-bounce bg-gradient-to-br from-purple-700 to-pink-500 shadow-md shadow-pink-500/40"
          style={{
            animationDelay: "0.4s",
            animationDuration: "1.2s",
          }}
        ></div>
      </div>
      {/* Optional Loading Message */}
      {message && (
        <p className="text-gray-600  text-sm  font-medium animate-pulse ">
          {message}
        </p>
      )}
    </div>
  );
};

export default Loading;
