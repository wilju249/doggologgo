import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import mockData from "../data/mockData";
import GraphPlaceholder from "../components/GraphPlaceholder";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";

export default function DogPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDog = async () => {
      // Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            // Not logged in, use mock data
            const mockDog = mockData.dogs.find((d) => d.id.toString() === id);
            setDog(mockDog);
            setLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from("dogs")
            .select("*")
            .eq("id", id)
            .eq("owner", user.id)
            .single();

          if (error || !data) {
            // Fall back to mock data if not found
            const mockDog = mockData.dogs.find((d) => d.id.toString() === id);
            setDog(mockDog);
          } else {
            setDog(data);
          }
        } catch (err) {
          console.error("Fetch error:", err);
          const mockDog = mockData.dogs.find((d) => d.id.toString() === id);
          setDog(mockDog);
        }
      } else {
        // Supabase not configured, use mock data
        const mockDog = mockData.dogs.find((d) => d.id.toString() === id);
        setDog(mockDog);
      }

      setLoading(false);
    };

    fetchDog();
  }, [id]);

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        {loading ? (
          <p style={styles.loading}>Loading...</p>
        ) : !dog ? (
          <p style={styles.notFound}>Dog not found!</p>
        ) : (
          <>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
            <div style={styles.card}>
              <img src={dog.photo} alt={dog.name} style={styles.photo} />
              <h1 style={styles.name}>{dog.name}</h1>
              <p>Age: {dog.age} years</p>
              <p>Favorite food: {dog.favoriteFood}</p>
              <GraphPlaceholder title="Food Intake (Last 7 days)" />
              <GraphPlaceholder title="Water Intake (Last 7 days)" />
            </div>
          </>
        )}
      </div>
    </>
  );
}

const styles = {
  page: { padding: "40px" },
  loading: { color: "#777", fontSize: "1rem" },
  notFound: { color: "#d32f2f", fontSize: "1rem" },
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
