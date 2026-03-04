/**
 * @module app/video/page
 * Video ingestion — batch frame extraction and metadata indexing.
 */

import { PageHeader } from "@/components/page-header";
import { VideoClient } from "@/components/video-client";

export default function VideoPage() {
  return (
    <div>
      <PageHeader
        title="Video Review"
        description="Upload, process, and extract frames from investigative video footage for case review."
      />
      <VideoClient />
    </div>
  );
}
