import { useState } from "react";
import { uploadToMassive } from "../lib/massive-storage";

// SECURITY: File upload configuration
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/json",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

export function FileUploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // SECURITY: Validate file before upload
  function validateFile(file) {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds 10 MB limit`;
    }

    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `File type "${file.type}" not allowed. Use: CSV, JSON, TXT, XLS, XLSX`;
    }

    // Check file extension (additional validation)
    const allowed = ["csv", "json", "txt", "xlsx", "xls"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      return `Extension ".${ext}" not allowed`;
    }

    return null; // No error
  }

  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // SECURITY: Limit number of files
    if (files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files per upload`);
      return;
    }

    setUploading(true);
    setError("");

    // SECURITY: Validate all files before uploading
    const validationErrors = [];
    const validFiles = [];

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        validationErrors.push(validationError);
      } else {
        validFiles.push(file);
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join("; "));
      setUploading(false);
      e.target.value = "";
      return;
    }

    try {
      for (const file of validFiles) {
        const url = await uploadToMassive(file, "trading-data");
        setItems((prev) => [...prev, { name: file.name, url, timestamp: new Date().toLocaleString() }]);
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
      <div style={{ marginBottom: 8, fontWeight: 700 }}>📁 File Storage (Massive S3)</div>
      <input
        type="file"
        multiple
        onChange={onPick}
        disabled={uploading}
        accept=".csv,.json,.txt,.xlsx,.xls"
      />
      {uploading && <div style={{ marginTop: 8, color: "#00ff88" }}>⏳ Uploading...</div>}
      {error && <div style={{ marginTop: 8, color: "#ff4455", fontSize: "12px" }}>⚠️ {error}</div>}
      {items.length > 0 && (
        <div style={{ marginTop: 10, fontSize: "12px" }}>
          <div style={{ color: "#8b95b8", marginBottom: 8 }}>✓ {items.length} file(s) uploaded</div>
          {items.map((f, i) => (
            <div key={`${f.url}-${i}`} style={{ marginBottom: 6, padding: "6px", background: "#242d4a", borderRadius: 4 }}>
              <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00d9ff", textDecoration: "none" }}>
                {f.name}
              </a>
              <div style={{ color: "#8b95b8", fontSize: "11px", marginTop: "2px" }}>{f.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

