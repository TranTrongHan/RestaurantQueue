import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  ChevronLeft,
  ChevronRight,
  Target,
  ShoppingCart,
  CalendarDays,
  ListFilter,
  Layers,
  Soup
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [openMenus, setOpenMenus] = useState({
    tongQuan: true,
    vanHanh: false,
    sanPham: false,
  });

  const toggleMenu = (menu) => {
    if (isCollapsed) return;
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const navItemClass = ({ isActive }) => `
    flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
    ${isActive
      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
    ${isCollapsed ? 'justify-center mx-2' : 'mx-4 mb-1'}
  `;

  const subItemClass = ({ isActive }) => `
    flex items-center pl-12 pr-4 py-2 rounded-lg text-sm transition-all duration-200
    ${isActive
      ? 'text-white font-medium'
      : 'text-slate-500 hover:text-white'}
  `;

  const MenuHeader = ({ icon: Icon, label, menuKey, hasSubItems = true }) => (
    <div
      onClick={() => toggleMenu(menuKey)}
      className={`
        flex items-center cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 group mx-4 mb-1
        ${openMenus[menuKey] && !isCollapsed ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      <Icon size={20} className={isCollapsed ? '' : 'mr-3'} />
      {!isCollapsed && (
        <>
          <span className="flex-1 font-medium">{label}</span>
          {hasSubItems && (
            <ChevronRight
              size={16}
              className={`transition-transform duration-200 ${openMenus[menuKey] ? 'rotate-90' : ''}`}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <aside
      className={`
        h-screen bg-[#1a1f2e] border-r border-slate-800 flex flex-col transition-all duration-300 relative
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Sidebar Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-blue-500 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Corporate Info Replacement (Header Area) */}
      <div className={`p-6 mb-4 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-white tracking-wider">CMS Admin</h2>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">C</div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {/* Tổng quan */}
        <div>
          <MenuHeader icon={LayoutDashboard} label="Tổng quan" menuKey="tongQuan" />
          {!isCollapsed && openMenus.tongQuan && (
            <div className="mb-2">
              <NavLink to="/rfm" className={subItemClass}>
                <Target size={14} className="mr-3" />
                <span>RFM</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Vận hành */}
        <div>
          <MenuHeader icon={ClipboardList} label="Vận hành" menuKey="vanHanh" />
          {!isCollapsed && openMenus.vanHanh && (
            <div className="mb-2">
              <NavLink to="/orders" className={subItemClass}>
                <ShoppingCart size={14} className="mr-3" />
                <span>Đơn đặt hàng</span>
              </NavLink>
              <NavLink to="/reservations" className={subItemClass}>
                <CalendarDays size={14} className="mr-3" />
                <span>Đặt bàn</span>
              </NavLink>
              <NavLink to="/kitchen" className={subItemClass}>
                <Soup size={14} className="mr-3" />
                <span>Đơn bếp</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Sản phẩm */}
        <div>
          <MenuHeader icon={Package} label="Sản phẩm" menuKey="sanPham" />
          {!isCollapsed && openMenus.sanPham && (
            <div className="mb-2">
              <NavLink to="/products" className={subItemClass}>
                <ListFilter size={14} className="mr-3" />
                <span>Danh sách món</span>
              </NavLink>
              <NavLink to="/product-groups" className={subItemClass}>
                <Layers size={14} className="mr-3" />
                <span>Nhóm món</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Footer / User display could go here, but per requirements we put toggle at top */}
    </aside>
  );
};

export default Sidebar;
