import React from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

const ThemeToggle = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button className="icon-btn theme-toggle" type="button" onClick={onToggle} title={isDark ? 'Светлая тема' : 'Темная тема'}>
      {isDark ? <MdLightMode /> : <MdDarkMode />}
    </button>
  );
};

export default ThemeToggle;
