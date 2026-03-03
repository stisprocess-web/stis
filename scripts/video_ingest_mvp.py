#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

VIDEO_EXTS = {'.mp4', '.mov', '.mkv', '.avi', '.m4v'}


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{p.stderr}")
    return p.stdout.strip()


def ffprobe_duration(video_path: Path) -> float:
    out = run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(video_path)
    ])
    try:
        return float(out)
    except Exception:
        return 0.0


def extract_interval_frames(video_path: Path, out_dir: Path, interval_sec: int):
    out_dir.mkdir(parents=True, exist_ok=True)
    frame_glob = out_dir / 'frame_%06d.jpg'
    run([
        'ffmpeg', '-y', '-i', str(video_path),
        '-vf', f'fps=1/{interval_sec}',
        str(frame_glob)
    ])


def extract_scene_frames(video_path: Path, out_dir: Path, threshold: float):
    out_dir.mkdir(parents=True, exist_ok=True)
    frame_glob = out_dir / 'scene_%06d.jpg'
    run([
        'ffmpeg', '-y', '-i', str(video_path),
        '-vf', f"select='gt(scene,{threshold})'",
        '-vsync', 'vfr',
        str(frame_glob)
    ])


def index_outputs(video_path: Path, interval_dir: Path, scene_dir: Path, duration: float):
    return {
        'video': str(video_path),
        'durationSec': duration,
        'intervalFramesDir': str(interval_dir),
        'sceneFramesDir': str(scene_dir),
        'intervalFrameCount': len(list(interval_dir.glob('*.jpg'))),
        'sceneFrameCount': len(list(scene_dir.glob('*.jpg'))),
    }


def main():
    if len(sys.argv) < 5:
        print('Usage: video_ingest_mvp.py <input_dir> <output_dir> <fps_interval_sec> <scene_threshold>')
        sys.exit(2)

    input_dir = Path(sys.argv[1]).expanduser().resolve()
    output_dir = Path(sys.argv[2]).expanduser().resolve()
    interval_sec = int(float(sys.argv[3]))
    scene_threshold = float(sys.argv[4])

    output_dir.mkdir(parents=True, exist_ok=True)
    index_path = output_dir / 'metadata_index.jsonl'

    videos = [p for p in input_dir.rglob('*') if p.is_file() and p.suffix.lower() in VIDEO_EXTS]

    with index_path.open('w', encoding='utf-8') as f:
        for video in videos:
            rel = video.stem
            base = output_dir / rel
            interval_dir = base / 'interval_frames'
            scene_dir = base / 'scene_frames'

            duration = ffprobe_duration(video)
            extract_interval_frames(video, interval_dir, max(interval_sec, 1))
            extract_scene_frames(video, scene_dir, scene_threshold)

            row = index_outputs(video, interval_dir, scene_dir, duration)
            f.write(json.dumps(row) + '\n')

    print(json.dumps({
        'ok': True,
        'videosProcessed': len(videos),
        'metadataIndex': str(index_path)
    }))


if __name__ == '__main__':
    main()
