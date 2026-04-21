import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FeedingGraph from "../components/FeedingGraph";
import GraphPlaceholder from "../components/GraphPlaceholder";
import { supabase } from "../lib/supabaseClient";
import { uploadDogPhoto, getPublicUrl, listDogPhotos } from "../lib/storageClient";
import Navbar from "../components/Navbar";

export default function DogPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", birthdate: "", photo: "", weight_kg: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [feedingEvents, setFeedingEvents] = useState([]);
  const [feedingRecords, setFeedingRecords] = useState([]);

  useEffect(() => {
    const fetchFeedingRecords = async () => {
      try {
        if (!dog?.id) return;

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await supabase
          .from("feeding_records")
          .select("*")
          .eq("dog_id", dog.id)
          .gte("timestamp", today.toISOString())
          .lt("timestamp", tomorrow.toISOString())
          .order("timestamp", { ascending: true });

        if (error) {
          console.error("Error fetching feeding records:", error);
        } else {
          setFeedingRecords(data || []);
        }
      } catch (err) {
        console.error("Fetch feeding records error:", err);
      }
    };

    if (dog?.id) {
      fetchFeedingRecords();

      // Subscribe to realtime updates for this dog's feeding records
      const subscription = supabase
        .channel(`feeding_records:dog_id=eq.${dog.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "feeding_records",
            filter: `dog_id=eq.${dog.id}`,
          },
          (payload) => {
            // Refetch to ensure we get today's records only
            fetchFeedingRecords();
          }
        )
        .subscribe();

      // Set up timer to refetch at midnight
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const timeUntilMidnight = midnight.getTime() - now.getTime();
      const midnightTimer = setTimeout(() => {
        fetchFeedingRecords(); // Refetch at midnight
        // Then set the interval to refetch every 24 hours
        setInterval(fetchFeedingRecords, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);

      return () => {
        clearTimeout(midnightTimer);
        subscription.unsubscribe();
      };
    }
  }, [dog?.id]);

  useEffect(() => {
    const fetchDog = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/");
          return;
        }

        const { data, error } = await supabase
          .from("dogs")
          .select("*")
          .eq("id", id)
          .eq("owner", user.id)
          .single();

        if (error || !data) {
          console.error("Dog not found:", error);
          setDog(null);
        } else {
          // resolve photo URL (public or signed) for display
          try {
            const resolved = data.photo ? await getPublicUrl(data.photo) : null;
            setDog({ ...data, resolvedPhoto: resolved });
          } catch (e) {
            setDog(data);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDog();
  }, [id, navigate]);

  function computeAgeFromBirthdate(birthdate) {
    if (!birthdate) return null;
    try {
      const b = new Date(birthdate);
      if (Number.isNaN(b.getTime())) return null;
      const now = new Date();
      let years = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
      return years >= 0 ? years : null;
    } catch (err) {
      return null;
    }
  }

  function resolvePhotoSrc(photo) {
    const placeholder = `https://placedog.net/400/400?id=${dog.id}`;
    if (editMode && photoPreview) {
      console.debug("[DogPage] using preview image");
      return photoPreview;
    }
    const p = photo || "";
    if (!p) return placeholder;
    if (p.startsWith("http")) {
      console.debug(`[DogPage] photo is full URL: ${p}`);
      return p;
    }
    // prefer resolvedPhoto computed at fetch time (may be signed or public)
    if (dog?.resolvedPhoto) return dog.resolvedPhoto;
    try {
      const { data: publicUrlData } = supabase.storage.from("dogs").getPublicUrl(p);
      console.debug(`[DogPage] resolved storage path ${p} -> ${publicUrlData?.publicUrl}`);
      return publicUrlData?.publicUrl || placeholder;
    } catch (err) {
      console.warn("[DogPage] getPublicUrl error:", err);
      return placeholder;
    }
  }

  const handleEditToggle = () => {
    if (!editMode && dog) {
      setFormData({
        name: dog.name || "",
        birthdate: dog.birthdate || "",
        photo: dog.photo || "",
        weight_kg: dog.weight_kg ?? "",
      });
      setPhotoPreview(dog.photo || "");
      setPhotoFile(null);
    }
    setEditMode((s) => !s);
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updates = {
        name: formData.name.trim(),
        birthdate: formData.birthdate || null,
        photo: formData.photo || null,
        weight_kg: formData.weight_kg === "" ? null : parseFloat(formData.weight_kg),
      };

      // If a new file was selected, upload it to storage and use that URL
      if (photoFile) {
        try {
          const currentUser = (await supabase.auth.getUser())?.data?.user;
          const res = await uploadDogPhoto(photoFile, currentUser?.id);
          console.debug("[DogPage] uploadDogPhoto result:", res);
          if (res?.error) {
            console.warn("Photo upload failed:", res.error);
          } else {
            updates.photo = res.filePath;
            // update bucket list debug info
            const listRes = await listDogPhotos("dog-photos");
            console.debug("[DogPage] listDogPhotos:", listRes);
          }
        } catch (uploadErr) {
          console.warn("Photo upload failed, continuing without photo:", uploadErr);
        }
      }

      const { data, error } = await supabase
        .from("dogs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
      } else {
        setDog(data);
        setEditMode(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Delete this dog? This action cannot be undone.");
    if (!ok) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("dogs").delete().eq("id", id);
      if (error) {
        console.error("Delete error:", error);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const addFeedingEvent = () => {
    setFeedingEvents([...feedingEvents, { time: "08:00", amount: 100 }]);
  };

  const updateFeedingEvent = (index, field, value) => {
    const updated = [...feedingEvents];
    updated[index][field] = value;
    setFeedingEvents(updated);
  };

  const removeFeedingEvent = (index) => {
    setFeedingEvents(feedingEvents.filter((_, i) => i !== index));
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <div style={styles.page}>
        {loading ? (
          <p style={styles.loading}>Loading...</p>
        ) : !dog ? (
          <p style={styles.notFound}>Dog not found!</p>
        ) : (
          <>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
              ← Back
            </button>
            <div style={styles.card}>
              <img src={resolvePhotoSrc(dog.photo)} alt={dog.name} style={styles.photo} />

              {!editMode ? (
                <>
                  <h1 style={styles.name}>{dog.name}</h1>
                  {dog.birthdate || dog.age ? (
                    <p>
                      Age: {dog.birthdate ? computeAgeFromBirthdate(dog.birthdate) : dog.age} years
                    </p>
                  ) : null}
                  {dog.breed && <p>Breed: {dog.breed}</p>}

                  <div style={styles.actionsRow}>
                    <button onClick={handleEditToggle} style={styles.editBtn} disabled={loading}>
                      Edit
                    </button>
                    <button onClick={handleDelete} style={styles.deleteBtn} disabled={loading}>
                      Delete
                    </button>
                  </div>

                  <FeedingGraph feedingRecords={feedingRecords} title="Food Intake (Today)" />
                  <GraphPlaceholder title="Water Intake (Today)" />

                  <div style={styles.feedingSection}>
                    <h2 style={styles.feedingTitle}>Feeding Schedule</h2>
                    <p style={styles.feedingDesc}>Set daily feeding times and amounts (repeats every day)</p>
                    
                    {feedingEvents.length === 0 ? (
                      <p style={styles.noEvents}>No feeding events set. Add one below.</p>
                    ) : (
                      <div style={styles.eventsList}>
                        {feedingEvents.map((event, index) => (
                          <div key={index} style={styles.eventItem}>
                            <input
                              type="time"
                              value={event.time}
                              onChange={(e) => updateFeedingEvent(index, 'time', e.target.value)}
                              style={styles.timeInput}
                            />
                            <input
                              type="number"
                              min="1"
                              value={event.amount}
                              onChange={(e) => updateFeedingEvent(index, 'amount', parseInt(e.target.value) || 0)}
                              style={styles.amountInput}
                              placeholder="grams"
                            />
                            <button onClick={() => removeFeedingEvent(index)} style={styles.removeBtn}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button onClick={addFeedingEvent} style={styles.addEventBtn}>+ Add Feeding Event</button>
                  </div>
                </>
              ) : (
                <div style={styles.editForm}>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Name</label>
                    <input name="name" value={formData.name} onChange={handleChange} style={styles.input} />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Birthdate</label>
                    <input name="birthdate" type="date" value={formData.birthdate || ""} onChange={handleChange} style={styles.input} />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Weight (kg)</label>
                    <input name="weight_kg" type="number" step="0.1" value={formData.weight_kg ?? ""} onChange={handleChange} style={styles.input} />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Upload Photo</label>
                    <input type="file" id="photo-file" accept="image/*" onChange={handlePhotoFileChange} style={styles.fileInput} />
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" style={styles.preview} />
                    ) : null}
                  </div>

                  <div style={styles.actionsRow}>
                    <button onClick={handleSave} style={styles.saveBtn} disabled={loading}>
                      Save
                    </button>
                    <button onClick={handleEditToggle} style={styles.cancelBtn} disabled={loading}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
  actionsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "12px",
    marginBottom: "12px",
  },
  editBtn: {
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deleteBtn: {
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  editForm: { textAlign: "left", marginTop: "10px" },
  formRow: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" },
  label: { fontWeight: 600, color: "var(--brown)" },
  input: { padding: "8px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem" },
  saveBtn: {
    backgroundColor: "var(--yellow)",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  cancelBtn: { backgroundColor: "#ccc", color: "#222", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" },
  fileInput: { fontSize: "0.9rem", padding: "6px" },
  preview: { marginTop: "10px", maxWidth: "200px", borderRadius: "8px", objectFit: "cover" },
  feedingSection: { marginTop: "30px", textAlign: "left" },
  feedingTitle: { color: "var(--brown)", marginBottom: "10px" },
  feedingDesc: { color: "#666", fontSize: "0.9rem", marginBottom: "15px" },
  noEvents: { color: "#777", fontStyle: "italic" },
  eventsList: { marginBottom: "15px" },
  eventItem: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" },
  timeInput: { padding: "6px", borderRadius: "4px", border: "1px solid #ddd", width: "120px" },
  amountInput: { padding: "6px", borderRadius: "4px", border: "1px solid #ddd", width: "80px" },
  removeBtn: { backgroundColor: "#d32f2f", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" },
  addEventBtn: { backgroundColor: "var(--yellow)", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
};
