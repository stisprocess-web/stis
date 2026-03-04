"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Film,
  ChevronDown,
  ChevronUp,
  Image,
  Loader2,
} from "lucide-react";

type ProcessingStatus = "idle" | "uploading" | "processing" | "complete" | "error";

export function VideoClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [apiRefOpen, setApiRefOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing config form state
  const [inputDir, setInputDir] = useState("./video_input");
  const [outputDir, setOutputDir] = useState("./video_output");
  const [fpsInterval, setFpsInterval] = useState(30);
  const [sceneThreshold, setSceneThreshold] = useState(0.3);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setStatus("idle");
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleProcess = async () => {
    setStatus("processing");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/video/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputDir,
          outputDir,
          fpsIntervalSec: fpsInterval,
          sceneThreshold,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Processing failed" }));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      setStatus("complete");
      setSuccessMessage("Video processing completed successfully. Frames extracted and metadata indexed.");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const statusConfig = {
    idle: { icon: Clock, label: "Awaiting upload", color: "text-text-muted" },
    uploading: { icon: Loader2, label: "Uploading...", color: "text-accent" },
    processing: { icon: Loader2, label: "Processing...", color: "text-warning" },
    complete: { icon: CheckCircle, label: "Complete", color: "text-success" },
    error: { icon: AlertCircle, label: "Error", color: "text-error" },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div
        role="button"
        tabIndex={0}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50 hover:bg-surface-elevated/50"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mb-4 h-12 w-12 text-text-muted" />
        <p className="text-lg font-medium text-text-primary">Drop video files or click to browse</p>
        <p className="mt-1 text-sm text-text-muted">Supports MP4, AVI, MOV, MKV formats</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <Film className="h-5 w-5 text-accent" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{selectedFile.name}</p>
            <p className="text-xs text-text-muted">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={handleProcess}
            disabled={status === "processing"}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "processing" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Process
              </span>
            )}
          </button>
        </div>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle className="h-5 w-5 text-success" />
          <p className="text-sm text-success">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error/10 p-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">{errorMessage}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Processing Configuration */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Processing Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Input Directory
              </label>
              <input
                type="text"
                value={inputDir}
                onChange={(e) => setInputDir(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Output Directory
              </label>
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  FPS Interval
                </label>
                <input
                  type="number"
                  value={fpsInterval}
                  onChange={(e) => setFpsInterval(Number(e.target.value))}
                  min={1}
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Scene Threshold
                </label>
                <input
                  type="number"
                  value={sceneThreshold}
                  onChange={(e) => setSceneThreshold(Number(e.target.value))}
                  step={0.05}
                  min={0}
                  max={1}
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={status === "processing"}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "processing" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Start Processing"
              )}
            </button>
          </div>
        </div>

        {/* Output / Frame Gallery */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Frame Gallery</h2>
            <div className={`flex items-center gap-1.5 text-sm ${currentStatus.color}`}>
              <StatusIcon className={`h-4 w-4 ${status === "processing" ? "animate-spin" : ""}`} />
              <span>{currentStatus.label}</span>
            </div>
          </div>

          {status === "complete" ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-video items-center justify-center rounded-lg border border-border bg-surface-elevated"
                >
                  <Image className="h-6 w-6 text-text-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Image className="mb-3 h-10 w-10 text-text-muted" />
              <p className="text-sm text-text-muted">
                {status === "processing"
                  ? "Extracting frames..."
                  : "Processed frames will appear here"}
              </p>
            </div>
          )}

          {/* Status Indicators */}
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
            {(["idle", "processing", "complete"] as const).map((s) => {
              const cfg = statusConfig[s];
              const Icon = cfg.icon;
              const isActive = status === s;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-1.5 text-xs ${isActive ? cfg.color : "text-text-muted/50"}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive && s === "processing" ? "animate-spin" : ""}`} />
                  <span>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* API Reference (Collapsible) */}
      <div className="rounded-xl border border-border bg-surface">
        <button
          onClick={() => setApiRefOpen(!apiRefOpen)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <h2 className="text-lg font-semibold text-text-primary">API Reference</h2>
          {apiRefOpen ? (
            <ChevronUp className="h-5 w-5 text-text-muted" />
          ) : (
            <ChevronDown className="h-5 w-5 text-text-muted" />
          )}
        </button>
        {apiRefOpen && (
          <div className="border-t border-border px-5 pb-5 pt-4">
            <p className="text-sm text-text-secondary">
              Run batch video frame extraction via the ingest API:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-4 text-xs text-text-primary font-mono">
{`POST /api/video/ingest
Content-Type: application/json

{
  "inputDir": "./video_input",
  "outputDir": "./video_output",
  "fpsIntervalSec": 5,
  "sceneThreshold": 0.35
}`}
            </pre>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              <p>
                <strong className="text-text-primary">inputDir</strong> — Path to directory containing video files
              </p>
              <p>
                <strong className="text-text-primary">outputDir</strong> — Path for extracted frames and metadata
              </p>
              <p>
                <strong className="text-text-primary">fpsIntervalSec</strong> — Seconds between frame captures (default: 5)
              </p>
              <p>
                <strong className="text-text-primary">sceneThreshold</strong> — Scene change detection sensitivity 0-1 (default: 0.35)
              </p>
            </div>
            <p className="mt-4 text-xs text-text-muted">
              Output: frame image folders + <code className="rounded bg-surface-elevated px-1 py-0.5">metadata_index.jsonl</code> for downstream review and search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
