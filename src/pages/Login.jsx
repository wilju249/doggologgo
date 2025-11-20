import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // no real auth yet
    if (email && password) navigate("/dashboard");
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🐶 DoggoLoggo</h1>
          <p style={styles.subtitle}>Log in to keep your doggo happy</p>
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Log In
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--gray)",
  },
  card: {
    backgroundColor: "var(--white)",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0px 4px 15px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "320px",
  },
  title: { color: "var(--brown)", marginBottom: "10px" },
  subtitle: { color: "#777", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: { fontSize: "1rem", padding: "10px" },
  button: {
    backgroundColor: "var(--yellow)",
    color: "white",
    fontWeight: "bold",
    padding: "10px",
    borderRadius: "8px",
  },
};
