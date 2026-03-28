import React from 'react';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary dark:text-primary-400 mb-4">Restaurant<span className="text-gray-900 dark:text-gray-100 font-black">Queue</span></h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
              Trải nghiệm ẩm thực tuyệt vời với hệ thống đặt bàn và gọi món thông minh. Chúng tôi luôn mong muốn mang đến cho bạn bữa ăn hoàn hảo nhất.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start text-gray-600 dark:text-gray-400 text-sm">
                <MapPin size={18} className="mr-2 text-primary shrink-0 mt-0.5" />
                <span>123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Phone size={18} className="mr-2 text-primary shrink-0" />
                <span>0123 456 789</span>
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Mail size={18} className="mr-2 text-primary shrink-0" />
                <span>contact@restaurantqueue.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Giờ mở cửa</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex justify-between">
                <span>Thứ 2 - Thứ 6:</span>
                <span className="font-medium text-gray-800 dark:text-gray-300">08:00 - 22:00</span>
              </li>
              <li className="flex justify-between">
                <span>Thứ 7 - Chủ Nhật:</span>
                <span className="font-medium text-gray-800 dark:text-gray-300">08:00 - 23:30</span>
              </li>
              <li className="flex justify-between text-danger mt-2 font-medium">
                <span>Ngày lễ:</span>
                <span>Nghỉ</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} RestaurantQueue App. Cung cấp trải nghiệm đặt bàn mượt mà.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
