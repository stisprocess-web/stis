/**
 * @module app/video/page
 * Video ingestion MVP — batch frame extraction and metadata indexing.
 */

import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";

export default function VideoPage() {
  return (
    <div>
      <PageHeader title="Video Ingestion MVP" description="Batch frame extraction and metadata indexing for investigative cameras." />
      <Nav />

      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900">
        <h2 className="mb-2 font-semibold">API Endpoint</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Run batch video frame extraction via the ingest API:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100">
{`POST /api/video/ingest
{
  "inputDir": "./video_input",
  "outputDir": "./video_output",
  "fpsIntervalSec": 5,
  "sceneThreshold": 0.35
}`}
        </pre>
        <p className="mt-3 text-xs text-zinc-500">
          Output: frame image folders + <code>metadata_index.jsonl</code> for downstream review and search.
        </p>
      </div>
    </div>
  );
}
