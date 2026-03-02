import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getPublicUrl, listDogPhotos } from "../lib/storageClient";
import Navbar from "../components/Navbar";

export default function DebugPhotos() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("dogs").select("*").eq("owner", user.id);
      if (error) {
        setError(error.message);
      } else {
        const enriched = await Promise.all(
          (data || []).map(async (d) => {
            const raw = d.photo || "";
            let resolved = null;
            if (raw) {
              if (raw.startsWith("http")) resolved = raw;
              else {
                try {
                  resolved = await getPublicUrl(raw);
                } catch (e) {
                  resolved = null;
                }
              }
            }

            let exists = null;
            if (resolved) {
              try {
                const res = await fetch(resolved, { method: "HEAD" });
                exists = res.ok;
              } catch (e) {
                exists = false;
              }
            }

            return { ...d, rawPhoto: raw, resolvedUrl: resolved, fileExists: exists };
          })
        );

        setDogs(enriched);
      }

      // list files in bucket root and dog-photos using helper
      try {
        const { data: listRoot } = await listDogPhotos("");
        const { data: listPhotos } = await listDogPhotos("dog-photos");
        setFiles({ root: listRoot || [], dogPhotos: listPhotos || [] });
      } catch (e) {
        setFiles({ root: [], dogPhotos: [] });
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Navbar onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} />
      <h1>Debug Photos</h1>
      <p>Use this page to inspect dog rows and storage files.</p>
      <button onClick={fetchData} style={{ marginBottom: 12 }}>Refresh</button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Dogs</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>id</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>raw photo</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>resolved url</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>exists</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>preview</th>
          </tr>
        </thead>
        <tbody>
          {dogs.map((d) => (
            <tr key={d.id}>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f1f1' }}>{d.id}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f1f1' }}>{d.name}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f1f1' }}>{d.rawPhoto}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f1f1' }}>{d.resolvedUrl}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f1f1' }}>{String(d.fileExists)}</td>
              <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f1f1' }}>
                {d.resolvedUrl ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={d.resolvedUrl} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <span style={{ color: '#777' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Bucket files</h2>
      <div>
        <h3>Root</h3>
        <pre style={{ maxHeight: 200, overflow: 'auto', background: '#fafafa', padding: 8 }}>{JSON.stringify(files.root, null, 2)}</pre>
        <h3>dog-photos</h3>
        <pre style={{ maxHeight: 200, overflow: 'auto', background: '#fafafa', padding: 8 }}>{JSON.stringify(files.dogPhotos, null, 2)}</pre>
      </div>
    </div>
  );
}
