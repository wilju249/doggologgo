import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🐶 DoggoLoggo</h1>
        <p style={styles.subtitle}>Log in to keep your doggo happy</p>
        {error && <p style={styles.error}>{error}</p>}
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
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p style={styles.linkText}>
          Don't have an account?{" "}
          <a href="/signup" style={styles.link}>
            Sign up here
          </a>
        </p>
      </div>
    </div>
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
  error: { color: "#d32f2f", fontSize: "0.9rem", marginBottom: "10px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: { fontSize: "1rem", padding: "10px" },
  button: {
    backgroundColor: "var(--yellow)",
    color: "white",
    fontWeight: "bold",
    padding: "10px",
    borderRadius: "8px",
  },
  linkText: {
    marginTop: "15px",
    fontSize: "0.9rem",
    color: "#777",
  },
  link: {
    color: "var(--yellow)",
    textDecoration: "none",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
