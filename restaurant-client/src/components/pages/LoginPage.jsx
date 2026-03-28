import React from "react";
import backgroundImg from "../../assets/restaurant-bg.jpg";
import LoginForm from "../forms/LoginForm";

const LoginPage = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative py-12"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm dark:bg-black/60 dark:backdrop-blur-md"></div>
      
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-primary/10 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
          <h3 className="text-center font-extrabold text-3xl text-primary dark:text-primary-400 mb-8 tracking-tight">
            Restaurant<span className="text-gray-900 dark:text-gray-100 font-black">Queue</span>
          </h3>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
