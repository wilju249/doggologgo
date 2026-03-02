import React from "react";
import { supabase } from "../lib/supabaseClient";

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

export default function DogCard({ dog, onClick }) {
  // Prefer explicit birthdate when available, fall back to numeric `age` if provided
  const computedAge = dog?.birthdate ? computeAgeFromBirthdate(dog.birthdate) : dog?.age ?? null;

  const fallback = `https://placedog.net/400/400?id=${dog.id}`;

  // If resolvedPhoto was computed earlier (e.g., in DogPage), prefer that.
  let photoSrc = dog.photo || "";
  let resolvedPublicUrl = dog.resolvedPhoto || null;
  if (!resolvedPublicUrl && photoSrc && !photoSrc.startsWith("http")) {
    try {
      const { data: publicUrlData } = supabase.storage.from("dogs").getPublicUrl(photoSrc);
      resolvedPublicUrl = publicUrlData?.publicUrl || null;
      photoSrc = resolvedPublicUrl || photoSrc;
    } catch (err) {
      console.warn("[DogCard] getPublicUrl error:", err);
    }
  } else if (resolvedPublicUrl) {
    photoSrc = resolvedPublicUrl;
  }

  // Diagnostic output to help debug missing images
  try {
    console.debug(`[DogCard] id=${dog?.id} rawPhoto=${dog?.photo} resolvedPublicUrl=${resolvedPublicUrl} finalSrc=${photoSrc}`);
  } catch (e) {
    // ignore
  }

  return (
    <div style={styles.card} onClick={onClick}>
      <img src={photoSrc || fallback} alt={dog.name} style={styles.img} />
      <h3 style={styles.name}>{dog.name}</h3>
      {computedAge !== null && <p>{computedAge} years old</p>}
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
