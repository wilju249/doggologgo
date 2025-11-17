import React from "react";
import { useNavigate } from "react-router-dom";
import DogCard from "../components/DogCard";
import mockData from "../data/mockData";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Welcome back, Alex 👋</h1>
      <h2 style={styles.subtitle}>Your Dogs</h2>
      <div style={styles.dogGrid}>
        {mockData.dogs.map((dog) => (
          <DogCard key={dog.id} dog={dog} onClick={() => navigate(`/dog/${dog.id}`)} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "40px" },
  title: { color: "var(--brown)" },
  subtitle: { marginTop: "20px", marginBottom: "10px", color: "var(--light-brown)" },
  dogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
};
