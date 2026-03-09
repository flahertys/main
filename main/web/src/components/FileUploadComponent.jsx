import { useState } from "react";
import { uploadToMassive } from "../lib/massive-storage";

export function FileUploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const url = await uploadToMassive(file, "trading-data");
        setItems((prev) => [...prev, { name: file.name, url }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div style={{ border: "1px solid #3a4558", borderRadius: 10, padding: 14 }}>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>File Storage (Massive S3)</div>
      <input type="file" multiple onChange={onPick} disabled={uploading} />
      {uploading && <div style={{ marginTop: 8 }}>Uploading...</div>}
      {error && <div style={{ marginTop: 8, color: "#ff4455" }}>{error}</div>}
      {items.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {items.map((f, i) => (
            <div key={`${f.url}-${i}`}>
              <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

