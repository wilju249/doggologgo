import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DogCard from "../components/DogCard";
import { supabase } from "../lib/supabaseClient";
import { getPublicUrl } from "../lib/storageClient";
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

        // Get first and last name from user metadata
        const first = currentUser.user_metadata?.first_name || "";
        setFirstName(first);

        // Fetch dogs for this user
        const { data, error } = await supabase
          .from("dogs")
          .select("*")
          .eq("owner", currentUser.id);

        if (error) {
          console.error("Error fetching dogs:", error);
        } else if (data) {
          // resolve public/signed URLs for storage-backed photos
          try {
            const enriched = await Promise.all(
              data.map(async (d) => {
                if (d.photo && !d.photo.startsWith("http")) {
                  try {
                    const resolved = await getPublicUrl(d.photo);
                    return { ...d, resolvedPhoto: resolved };
                  } catch (e) {
                    return d;
                  }
                }
                return d;
              })
            );
            setDogs(enriched);
          } catch (e) {
            setDogs(data);
          }
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
          <h1 style={styles.title}>Welcome back, {firstName}</h1>
        </div>
        <div style={styles.dogHeaderContainer}>
          <h2 style={styles.subtitle}>Your Dogs</h2>
          {!loading && (
            <button style={styles.addDogBtn} onClick={() => navigate("/add-dog")}>
              + Add Dog
            </button>
          )}
        </div>
        {loading ? (
          <p style={styles.loading}>Loading...</p>
        ) : dogs.length === 0 ? (
          <div style={styles.noDogsContainer}>
            <p style={styles.noDogs}>No dogs yet. Add one to get started!</p>
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
  dogHeaderContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    marginBottom: "10px",
  },
  subtitle: { margin: 0, color: "var(--light-brown)" },
  loading: { color: "#777", fontSize: "1rem" },
  noDogsContainer: { textAlign: "center", paddingTop: "40px" },
  noDogs: { color: "#777", fontSize: "1.1rem", marginBottom: "20px" },
  addDogBtn: {
    backgroundColor: "var(--yellow)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "0.95rem",
    cursor: "pointer",
    fontWeight: "bold",
  },
  dogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
};
