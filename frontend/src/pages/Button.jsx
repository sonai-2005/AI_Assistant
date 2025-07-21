import React from "react";

const Button = ({ onClick, isListening }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-semibold transition duration-300 shadow-md rounded-full ${
        isListening
          ? "bg-red-500 text-white animate-pulse"
          : "bg-white text-black hover:bg-gray-200"
      }`}
    >
      {isListening ? "🎤 Listening..." : "Ask Assistant"}
    </button>
  );
};

export default Button;
