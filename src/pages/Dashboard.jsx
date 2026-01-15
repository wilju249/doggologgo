import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DogCard from "../components/DogCard";
import mockData from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dogs, setDogs] = useState(mockData.dogs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDogs = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return; // Use mock data
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return; // Not logged in, use mock data
        }

        const { data, error } = await supabase
          .from("dogs")
          .select("*")
          .eq("owner", user.id);

        if (error) {
          console.error("Error fetching dogs:", error);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setDogs(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDogs();
  }, []);

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <h1 style={styles.title}>Welcome back, Alex 👋</h1>
        <h2 style={styles.subtitle}>Your Dogs</h2>
        {loading ? (
          <p style={styles.loading}>Loading...</p>
        ) : dogs.length === 0 ? (
          <p style={styles.noDogs}>No dogs found. Add one to get started!</p>
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
  title: { color: "var(--brown)" },
  subtitle: { marginTop: "20px", marginBottom: "10px", color: "var(--light-brown)" },
  loading: { color: "#777", fontSize: "1rem" },
  noDogs: { color: "#777", fontSize: "1rem" },
  dogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
};
