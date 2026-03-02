import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { uploadDogPhoto } from "../lib/storageClient";
import Navbar from "../components/Navbar";

export default function AddDog() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    birthdate: null,
    weight_kg: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [debugInfo, setDebugInfo] = useState({ lastUpload: null, bucketList: null });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        navigate("/");
        return;
      }

      setUser(currentUser);
    };

    checkUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // removed URL paste support - only file uploads are allowed

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        setError("Dog name is required");
        setLoading(false);
        return;
      }

      let photoUrl = null;

      // Upload photo file to Supabase storage if selected (use helper)
      if (photoFile) {
        const res = await uploadDogPhoto(photoFile, user?.id);
        console.debug("[AddDog] uploadDogPhoto result:", res);
        setDebugInfo((d) => ({ ...d, lastUpload: res }));
        if (res?.error) {
          setError(`Photo upload failed: ${res.error?.message || res.error}`);
          setLoading(false);
          return;
        }
        photoUrl = res.filePath || null;
      }

      const { data, error: insertError } = await supabase
        .from("dogs")
        .insert([
          {
            owner: user.id,
            name: formData.name.trim(),
            birthdate: formData.birthdate || null,
            photo: photoUrl,
            weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          },
        ])
        .select();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Add a New Dog 🐕</h1>
          {error && <p style={styles.error}>{error}</p>}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>
                Dog Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter dog name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="birthday" style={styles.label}>
                Birthday
              </label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="weight_kg" style={styles.label}>
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight_kg"
                name="weight_kg"
                placeholder="e.g., 25.5"
                step="0.1"
                min="0"
                value={formData.weight_kg}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Dog Photo</label>
              <div style={styles.photoInputGroup}>
                <label htmlFor="photo-file" style={styles.fileLabel}>
                  Upload from Device
                </label>
                <input
                  type="file"
                  id="photo-file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  style={styles.fileInput}
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Dog preview"
                    style={styles.preview}
                    onError={() => console.error("Image failed to load")}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? "Adding Dog..." : "Add Dog"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  style={styles.cancelBtn}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
          {debugInfo.lastUpload && (
            <div style={{ marginTop: 12, padding: 10, background: "#fff8e1", borderRadius: 8 }}>
              <strong>Debug:</strong>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--gray)",
    padding: "20px",
  },
  card: {
    backgroundColor: "var(--white)",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0px 4px 15px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "500px",
  },
  title: {
    color: "var(--brown)",
    marginBottom: "30px",
    textAlign: "center",
  },
  error: {
    color: "#d32f2f",
    fontSize: "0.9rem",
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#ffebee",
    borderRadius: "8px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "var(--brown)",
  },
  input: {
    fontSize: "1rem",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontFamily: "inherit",
  },
  photoInputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    padding: "15px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  },
  fileLabel: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "var(--brown)",
    display: "block",
    marginBottom: "8px",
  },
  fileInput: {
    fontSize: "0.9rem",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  divider: {
    textAlign: "center",
    color: "#999",
    fontWeight: "600",
    margin: "10px 0",
  },
  preview: {
    marginTop: "10px",
    maxWidth: "200px",
    borderRadius: "8px",
    objectFit: "cover",
  },
  submitBtn: {
    backgroundColor: "var(--yellow)",
    color: "white",
    fontWeight: "bold",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
  },
  cancelBtn: {
    backgroundColor: "#ccc",
    color: "#333",
    fontWeight: "bold",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
  },
};
