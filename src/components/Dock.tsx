import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { House, PencilSimple, Gear, ShareNetwork } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { ImpactStyle } from '@capacitor/haptics';
import './Dock.css';

export const Dock: React.FC = () => {
  const location = useLocation();

  const handleTap = () => {
    triggerHaptic(ImpactStyle.Light);
    playSound('pop');
  };

  return (
    <div className="dock-container">
      <nav className="dock glass">
        <NavLink to="/" onClick={handleTap} className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
          <House size={30} weight={location.pathname === '/' ? "fill" : "regular"} />
          {location.pathname === '/' && (
            <motion.div layoutId="dock-pill" className="active-pill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          )}
        </NavLink>
        
        <NavLink to="/new" onClick={handleTap} className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
          <PencilSimple size={30} weight={location.pathname === '/new' ? "fill" : "regular"} />
          {location.pathname === '/new' && (
            <motion.div layoutId="dock-pill" className="active-pill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          )}
        </NavLink>
        
        <NavLink to="/graph" onClick={handleTap} className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
          <ShareNetwork size={30} weight={location.pathname === '/graph' ? "fill" : "regular"} />
          {location.pathname === '/graph' && (
            <motion.div layoutId="dock-pill" className="active-pill" transition={{ type: "spring", stiffness: 350, damping: 25 }} />
          )}
        </NavLink>
        
        <NavLink to="/settings" onClick={handleTap} className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
          <Gear size={30} weight={location.pathname === '/settings' ? "fill" : "regular"} />
          {location.pathname === '/settings' && (
            <motion.div layoutId="dock-pill" className="active-pill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          )}
        </NavLink>
      </nav>
    </div>
  );
};
