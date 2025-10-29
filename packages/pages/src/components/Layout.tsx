import type { ReactNode, ReactElement } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  description: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', description: 'Overview and introduction' },
  { path: '/wad-viewer', label: 'WAD Viewer', description: 'View and analyze DOOM WAD files' },
  { path: '/web-doom', label: 'Web DOOM', description: 'Play DOOM in your browser' },
  { path: '/image-converter', label: 'Image Converter', description: 'Convert between PNG/JPEG and DOOM format' },
];

function Layout({ children }: LayoutProps): ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">WEB DOOM</h1>
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <div className="nav-item-label">{item.label}</div>
              {!sidebarCollapsed && (
                <div className="nav-item-description">{item.description}</div>
              )}
            </Link>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="sidebar-footer">
            <p>DOOM ported to the web</p>
            <p>Built with TypeScript</p>
          </div>
        )}
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
