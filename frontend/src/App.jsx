import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';

import Dashboard from './pages/Dashboard';
import Budgeting from './pages/Budgeting';
import Transactions from './pages/Transactions';
import Auth from './pages/Auth';

import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

function NavItem({ to, icon: Icon, label, closeMenu }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={closeMenu}
      className={`nav-item-link ${isActive ? 'active' : ''}`}
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: '600',
        padding: '8px 16px',
        borderRadius: '20px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        color: isActive ? '#FFFFFF' : '#64748B',
        background: isActive ? '#2563EB' : 'transparent',
        boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}

function Navigation({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: flex !important; }
          .mobile-toggle { display: none !important; }
          .mobile-menu-drawer { display: none !important; }
        }

        /* Hamburger Animation */
        .hamburger-icon {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hamburger-icon.open {
          transform: rotate(90deg);
        }

        /* Mobile Drawer Animation */
        .mobile-menu-drawer {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out;
        }
        .mobile-menu-drawer.open {
          max-height: 300px;
          opacity: 1;
        }

        /* Hover Effects */
        .brand-logo-link {
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .brand-logo-link:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }
        .brand-logo-link:hover .logo-circle {
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.45) !important;
          transform: scale(1.04);
        }

        .nav-item-link:hover:not(.active) {
          background: rgba(0, 0, 0, 0.05) !important;
          color: #1F2223 !important;
        }
        .nav-item-link.active:hover {
          background: #1D4ED8 !important;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35) !important;
        }

        .logout-btn {
          transition: all 0.2s ease-in-out !important;
        }
        .logout-btn:hover {
          background: #334155 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mobile-toggle-btn {
          transition: all 0.2s ease-in-out !important;
        }
        .mobile-toggle-btn:hover {
          background: #334155 !important;
          transform: scale(1.05);
        }
      `}</style>

      <nav style={{ 
        background: 'rgba(231, 230, 225, 0.85)', 
        backdropFilter: 'blur(16px)', 
        WebkitBackdropFilter: 'blur(16px)', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        {/* Main Header Bar */}
        <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Clickable Logo Badge */}
          <Link 
            to="/dashboard" 
            onClick={closeMenu} 
            className="brand-logo-link"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              textDecoration: 'none', 
              cursor: 'pointer' 
            }}
          >
            <div 
              className="logo-circle"
              style={{ 
                background: '#2563EB', 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                fontSize: '16px',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              ₱
            </div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#1F2223', letterSpacing: '-0.5px' }}>
              FinanceTracker
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="desktop-only" style={{ 
            background: 'rgba(0,0,0,0.04)', 
            padding: '4px', 
            borderRadius: '24px',
            gap: '4px', 
            alignItems: 'center' 
          }}>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/transactions" icon={Wallet} label="Transactions" />
            <NavItem to="/budgeting" icon={PieChart} label="Budgeting" />
          </div>

          {/* Desktop User Info & Logout Button */}
          <div className="desktop-only" style={{ alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>{user?.email}</span>
            <button
              onClick={onLogout}
              className="logout-btn"
              style={{
                background: '#1F2223',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-toggle mobile-toggle-btn"
            onClick={toggleMenu}
            style={{
              background: '#1F2223',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Navigation"
          >
            <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </div>
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        <div
          className={`mobile-menu-drawer ${isOpen ? 'open' : ''}`}
          style={{
            background: 'rgba(231, 230, 225, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            padding: isOpen ? '16px 20px' : '0 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" closeMenu={closeMenu} />
          <NavItem to="/transactions" icon={Wallet} label="Transactions" closeMenu={closeMenu} />
          <NavItem to="/budgeting" icon={PieChart} label="Budgeting" closeMenu={closeMenu} />

          <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', paddingTop: '14px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{user?.email}</span>
            <button
              onClick={() => { closeMenu(); onLogout(); }}
              className="logout-btn"
              style={{
                background: '#1F2223',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthSuccess = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
  };

  if (loading) {
    return (
      <div style={{ background: '#E7E6E1', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#1F2223', fontWeight: '500' }}>
        Loading session...
      </div>
    );
  }

  return (
    <Router>
      <div style={{ background: '#E7E6E1', minHeight: '100vh' }}>
        {session ? (
          <>
            <Navigation user={session.user} onLogout={handleLogout} />
            <div style={{ padding: '24px 16px' }}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard session={session} user={session.user} userId={session.user.id} />} />
                <Route path="/transactions" element={<Transactions session={session} user={session.user} userId={session.user.id} />} />
                <Route path="/budgeting" element={<Budgeting session={session} user={session.user} userId={session.user.id} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/auth" element={<Auth onAuthSuccess={handleAuthSuccess} setSession={setSession} />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}