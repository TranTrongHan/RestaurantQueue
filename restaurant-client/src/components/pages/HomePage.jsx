import React from 'react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import useUserStore from '../../store/useUserStore';
import CommentSection from '../layout/CommentSection/CommenSection';

const HomePage = () => {
  const { user } = useUserStore();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 tracking-tight">
            Chào mừng đến với <span className="text-primary block mt-2">Nhà Hàng Của Chúng Tôi</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Thưởng thức ẩm thực đẳng cấp với không gian sang trọng, nguyên liệu tươi ngon và dịch vụ chuẩn 5 sao.
          </p>
        </div>

        {/* {user && (
          <div className="max-w-4xl mx-auto mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6 md:p-8 border border-gray-100 dark:border-gray-800">
             <CommentSection />
          </div>
        )} */}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
