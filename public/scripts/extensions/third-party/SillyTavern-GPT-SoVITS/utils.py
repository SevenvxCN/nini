import os
from config import load_json, save_json, MAX_CACHE_SIZE_MB

def scan_audio_files(directory):
    """扫描目录下的音频文件"""
    refs = []
    if not os.path.exists(directory): return refs
    for f in os.listdir(directory):
        if f.lower().endswith(('.wav', '.mp3')):
            name = os.path.splitext(f)[0]
            # 兼容处理文件名： emotion_text.wav 或 text.wav
            parts = name.split('_', 1) if "_" in name else ["default", name]
            refs.append({"emotion": parts[0], "text": parts[1], "path": os.path.join(directory, f)})
    return refs

def maintain_cache_size(cache_dir):
    """清理缓存以限制大小"""
    try:
        if not os.path.exists(cache_dir): return
        files = []
        total_size = 0
        with os.scandir(cache_dir) as it:
            for entry in it:
                if entry.is_file() and entry.name.endswith('.wav'):
                    stat = entry.stat()
                    files.append({"path": entry.path, "size": stat.st_size, "mtime": stat.st_mtime})
                    total_size += stat.st_size

        if (total_size / (1024 * 1024)) < MAX_CACHE_SIZE_MB: return

        # 按修改时间排序，删除旧的
        files.sort(key=lambda x: x["mtime"])
        for f in files:
            try:
                os.remove(f["path"])
                total_size -= f["size"]
                if (total_size / (1024 * 1024)) < (MAX_CACHE_SIZE_MB * 0.9): break
            except: pass
    except: pass
