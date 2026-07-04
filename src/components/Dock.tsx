import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, PencilSimple, Gear } from '@phosphor-icons/react';
import './Dock.css';

export const Dock: React.FC = () => {
  return (
    <div className="dock-container">
      <nav className="dock glass">
        <NavLink to="/" className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
          <House size={28} weight="duotone" />
        </NavLink>
        <NavLink to="/new" className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
          <PencilSimple size={28} weight="duotone" />
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "dock-item active" : "dock-item"}>
          <Gear size={28} weight="duotone" />
        </NavLink>
      </nav>
    </div>
  );
};
