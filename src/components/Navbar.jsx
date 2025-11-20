import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <div style={styles.nav}>
      <div style={styles.brand} onClick={() => navigate('/')}>🐶 DoggoLoggo</div>
      <div style={styles.actions}>
        <button style={styles.btn} onClick={() => navigate('/dashboard')}>Dashboard</button>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: 'var(--white)',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  brand: {
    fontWeight: '700',
    color: 'var(--brown)',
    cursor: 'pointer',
  },
  actions: {},
  btn: {
    backgroundColor: 'var(--yellow)',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
