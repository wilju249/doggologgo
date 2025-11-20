import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import mockData from "../data/mockData";
import GraphPlaceholder from "../components/GraphPlaceholder";
import Navbar from "../components/Navbar";

export default function DogPage() {
  const { id } = useParams();
  const dog = mockData.dogs.find((d) => d.id.toString() === id);
  const navigate = useNavigate();

  if (!dog) return <p>Dog not found!</p>;

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <div style={styles.card}>
          <img src={dog.photo} alt={dog.name} style={styles.photo} />
          <h1 style={styles.name}>{dog.name}</h1>
          <p>Age: {dog.age} years</p>
          <p>Favorite food: {dog.favoriteFood}</p>
          <GraphPlaceholder title="Food Intake (Last 7 days)" />
          <GraphPlaceholder title="Water Intake (Last 7 days)" />
        </div>
      </div>
    </>
  );
}

const styles = {
  page: { padding: "40px" },
  backBtn: {
    backgroundColor: "var(--yellow)",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    marginBottom: "20px",
    cursor: "pointer",
  },
  card: {
    backgroundColor: "var(--white)",
    padding: "20px",
    borderRadius: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    textAlign: "center",
    maxWidth: "500px",
    margin: "auto",
  },
  photo: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  name: { color: "var(--brown)" },
};
