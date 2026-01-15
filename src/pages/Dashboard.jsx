import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DogCard from "../components/DogCard";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserAndDogs = async () => {
      try {
        // Get current user
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          navigate("/");
          return;
        }

        setUser(currentUser);

        // Get first name from user metadata
        const userFirstName =
          currentUser.user_metadata?.first_name || currentUser.email?.split("@")[0] || "User";
        setFirstName(userFirstName);

        // Fetch dogs for this user
        const { data, error } = await supabase
          .from("dogs")
          .select("*")
          .eq("owner", currentUser.id);

        if (error) {
          console.error("Error fetching dogs:", error);
        } else if (data) {
          setDogs(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDogs();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome back, {firstName} 👋</h1>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log Out
          </button>
        </div>
        <h2 style={styles.subtitle}>Your Dogs</h2>
        {loading ? (
          <p style={styles.loading}>Loading...</p>
        ) : dogs.length === 0 ? (
          <div style={styles.noDogsContainer}>
            <p style={styles.noDogs}>No dogs yet. Add one to get started!</p>
            <button style={styles.addDogBtn} onClick={() => navigate("/add-dog")}>
              + Add Your First Dog
            </button>
          </div>
        ) : (
          <div style={styles.dogGrid}>
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} onClick={() => navigate(`/dog/${dog.id}`)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  page: { padding: "40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { color: "var(--brown)", margin: 0 },
  logoutBtn: {
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  subtitle: { marginTop: "20px", marginBottom: "10px", color: "var(--light-brown)" },
  loading: { color: "#777", fontSize: "1rem" },
  noDogsContainer: { textAlign: "center", paddingTop: "40px" },
  noDogs: { color: "#777", fontSize: "1.1rem", marginBottom: "20px" },
  addDogBtn: {
    backgroundColor: "var(--yellow)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    fontWeight: "bold",
  },
  dogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
};
