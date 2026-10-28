import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ForcePasswordChangeModal from '../common/ForcePasswordChangeModal';
import './Layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Đóng mobile sidebar khi chuyển trang theo khuyến nghị chuẩn React
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMobileOpen(false);
  }

  return (
    <div className="app-container">
      {/* Backdrop overlay mờ cho mobile drawer */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
      {/* BR-SEC-01: khoá toàn ứng dụng cho tới khi đổi mật khẩu tạm thành công. */}
      <ForcePasswordChangeModal />
    </div>
  );
}
