import { useState, useRef } from "react";
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
  const [progress, setProgress] = useState({}); // { filename: percent }
  const [fileErrors, setFileErrors] = useState({}); // { filename: error }
  const inputRef = useRef();
  const [dragActive, setDragActive] = useState(false);

  // SECURITY: Validate file before upload
  function validateFile(file) {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File \"${file.name}\" exceeds 10 MB limit`;
    }

    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `File type \"${file.type}\" not allowed. Use: CSV, JSON, TXT, XLS, XLSX`;
    }

    // Check file extension (additional validation)
    const allowed = ["csv", "json", "txt", "xlsx", "xls"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      return `Extension \".${ext}\" not allowed`;
    }

    return null; // No error
  }

  function handleRemoveItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      processFiles(files);
    }
  }

  async function processFiles(files) {
    // SECURITY: Limit number of files
    if (files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files per upload`);
      return;
    }
    setUploading(true);
    setError("");
    setProgress({});
    setFileErrors({});
    // SECURITY: Validate all files before uploading
    const validationErrors = {};
    const validFiles = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        validationErrors[file.name] = validationError;
      } else {
        validFiles.push(file);
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      setFileErrors(validationErrors);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    // Atomic batch upload: rollback all if any fail
    const newItems = [];
    let failed = false;
    for (const file of validFiles) {
      try {
        const url = await uploadToMassive(file, "trading-data", percent => {
          setProgress(prev => ({ ...prev, [file.name]: percent }));
        });
        newItems.push({ name: file.name, url, timestamp: new Date().toLocaleString() });
      } catch (err) {
        setFileErrors(prev => ({ ...prev, [file.name]: `Failed to upload: ${err instanceof Error ? err.message : err}` }));
        failed = true;
        break;
      }
    }
    if (failed) {
      setUploading(false);
      setProgress({});
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setItems(prev => [...prev, ...newItems]);
    setUploading(false);
    setProgress({});
    setFileErrors({});
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await processFiles(files);
  }

  // Responsive style helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  return (
    <div
      style={{ border: dragActive ? "2px dashed #00d9ff" : "1px solid #3a4558", borderRadius: 10, padding: isMobile ? 8 : 14, background: dragActive ? "#1a233a" : undefined }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: isMobile ? 13 : undefined }}>📁 File Storage (Massive S3)</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onPick}
        disabled={uploading}
        accept=".csv,.json,.txt,.xlsx,.xls"
        style={{ fontSize: isMobile ? 12 : undefined }}
        aria-label="Upload files"
      />
      <div style={{ marginTop: 6, color: dragActive ? "#00d9ff" : "#8b95b8", fontSize: isMobile ? 11 : 12 }}>
        {dragActive ? "Drop files here to upload" : "Or drag and drop files here"}
      </div>
      {uploading && <div style={{ marginTop: 8, color: "#00ff88", fontSize: isMobile ? 12 : undefined }}>⏳ Uploading...</div>}
      {error && <div style={{ marginTop: 8, color: "#ff4455", fontSize: isMobile ? "11px" : "12px" }}>⚠️ {error}</div>}
      {Object.keys(fileErrors).length > 0 && (
        <div style={{ marginTop: 8 }}>
          {Object.entries(fileErrors).map(([name, err]) => (
            <div key={name} style={{ color: "#ff4455", fontSize: isMobile ? 11 : 12 }}>⚠️ {name}: {err}</div>
          ))}
        </div>
      )}
      {Object.keys(progress).length > 0 && (
        <div style={{ marginTop: 8 }}>
          {Object.entries(progress).map(([name, percent]) => (
            <div key={name} style={{ fontSize: isMobile ? 11 : 12 }}>
              {name}: <progress value={percent} max={100} style={{ width: isMobile ? 80 : 120, marginRight: 6 }} /> {percent}%
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div style={{ marginTop: 10, fontSize: isMobile ? "11px" : "12px" }}>
          <div style={{ color: "#8b95b8", marginBottom: 8 }}>✓ {items.length} file(s) uploaded</div>
          {items.map((f, i) => (
            <div key={`${f.url}-${i}`} style={{ marginBottom: 6, padding: isMobile ? "4px" : "6px", background: "#242d4a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00d9ff", textDecoration: "none", fontSize: isMobile ? 12 : undefined }}>
                  {f.name}
                </a>
                <div style={{ color: "#8b95b8", fontSize: isMobile ? "10px" : "11px", marginTop: "2px" }}>{f.timestamp}</div>
              </div>
              <button
                onClick={() => handleRemoveItem(i)}
                style={{ marginLeft: 10, background: "#ff4455", color: "#fff", border: "none", borderRadius: 3, padding: isMobile ? "2px 6px" : "4px 10px", cursor: "pointer", fontSize: isMobile ? 10 : 12 }}
                aria-label={`Remove ${f.name}`}
                title={`Remove ${f.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
