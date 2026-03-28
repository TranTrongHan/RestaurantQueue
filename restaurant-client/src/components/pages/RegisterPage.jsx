import React from "react";
import backgroundImg from "../../assets/restaurant-bg.jpg";
import RegisterForm from "../forms/RegisterForm";

const RegisterPage = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative py-12"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm dark:bg-black/60 dark:backdrop-blur-md"></div>
      
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-primary/10 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-10">
          <h3 className="text-center font-extrabold text-3xl text-gray-900 dark:text-gray-100 mb-8 tracking-tight">
            Đăng Ký Tài Khoản
          </h3>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
