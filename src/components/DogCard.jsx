import React from "react";

export default function DogCard({ dog, onClick }) {
  return (
    <div style={styles.card} onClick={onClick}>
      <img src={dog.photo} alt={dog.name} style={styles.img} />
      <h3 style={styles.name}>{dog.name}</h3>
      <p>{dog.age} years old</p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--white)",
    padding: "15px",
    borderRadius: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  img: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  name: {
    color: "var(--brown)",
    marginTop: "10px",
  },
};
