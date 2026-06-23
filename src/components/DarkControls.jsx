import React, { useState } from 'react';

export function DarkInput({ type = 'text', style, onFocus, onBlur, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (type === 'radio' || type === 'checkbox') {
    return (
      <input
        type={type}
        style={{
          cursor: 'pointer',
          accentColor: 'var(--accent-primary)',
          width: '16px',
          height: '16px',
          ...style
        }}
        {...props}
      />
    );
  }

  const baseStyle = {
    background: isFocused 
      ? 'rgba(0, 230, 168, 0.03)' 
      : (isHovered ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)'),
    border: '1px solid',
    borderColor: isFocused 
      ? 'var(--accent-primary)' 
      : (isHovered ? 'var(--glass-hover-border)' : 'var(--glass-border)'),
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: '#fff',
    fontFamily: 'var(--font-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: isFocused 
      ? '0 0 0 3px var(--accent-primary-glow), 0 0 8px rgba(0, 230, 168, 0.2)' 
      : 'none',
  };

  const mergedStyle = { ...baseStyle, ...style };

  return (
    <input
      type={type}
      style={mergedStyle}
      onFocus={(e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    />
  );
}

export function DarkSelect({ style, onFocus, onBlur, children, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = {
    background: isFocused 
      ? 'rgba(0, 230, 168, 0.03)' 
      : (isHovered ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)'),
    border: '1px solid',
    borderColor: isFocused 
      ? 'var(--accent-primary)' 
      : (isHovered ? 'var(--glass-hover-border)' : 'var(--glass-border)'),
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: '#fff',
    fontFamily: 'var(--font-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: isFocused 
      ? '0 0 0 3px var(--accent-primary-glow), 0 0 8px rgba(0, 230, 168, 0.2)' 
      : 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    backgroundSize: '16px',
    paddingRight: '40px',
  };

  const mergedStyle = { ...baseStyle, ...style };

  return (
    <select
      style={mergedStyle}
      onFocus={(e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // ensure options have dark background
          return React.cloneElement(child, {
            style: {
              background: 'var(--bg-secondary)',
              color: '#fff',
              ...child.props.style
            }
          });
        }
        return child;
      })}
    </select>
  );
}

export function DarkSearch({ style, ...props }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span style={{
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>
      <DarkInput
        type="text"
        style={{
          paddingLeft: '40px',
          width: '100%',
          ...style
        }}
        {...props}
      />
    </div>
  );
}
