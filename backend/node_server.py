"""
node_server.py
──────────────
Manages the weather_and_soil_analysis Node.js server as a child process.
Called from app.py – the process starts with Flask and is killed on exit.
"""

import atexit
import os
import signal
import subprocess
import sys
import threading
import time

_node_process: subprocess.Popen | None = None

# ── Resolve paths ─────────────────────────────────────────────────────────────

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_SERVER_JS   = os.path.join(_BACKEND_DIR, "weather_and_soil_analysis", "server.js")


def _find_node() -> str:
    """Return the 'node' executable name; raises if not found."""
    import shutil
    node = shutil.which("node")
    if not node:
        raise FileNotFoundError(
            "❌  'node' not found in PATH.  "
            "Install Node.js from https://nodejs.org/"
        )
    return node


# ── Start ──────────────────────────────────────────────────────────────────────

def start_weather_server() -> None:
    global _node_process

    if not os.path.isfile(_SERVER_JS):
        print(f"⚠️  Weather server not found at {_SERVER_JS} – skipping.")
        return

    node_bin = _find_node()

    # On Windows, CREATE_NEW_PROCESS_GROUP lets us send Ctrl+C to the child
    kwargs: dict = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP

    _node_process = subprocess.Popen(
        [node_bin, _SERVER_JS],
        cwd=os.path.dirname(_SERVER_JS),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        encoding='utf-8',
        errors='replace',
        **kwargs,
    )

    # Stream Node output to Python console in a background thread
    def _stream(proc: subprocess.Popen) -> None:
        for line in proc.stdout:
            print(f"[weather-server] {line}", end="", flush=True)

    threading.Thread(target=_stream, args=(_node_process,), daemon=True).start()

    # Give the server a moment to boot, then confirm
    time.sleep(1.2)
    if _node_process.poll() is None:
        print(f"✅  Weather server started  (pid {_node_process.pid})", flush=True)
    else:
        print("❌  Weather server exited immediately – check Node logs above.", flush=True)


# ── Stop ───────────────────────────────────────────────────────────────────────

def stop_weather_server() -> None:
    global _node_process
    if _node_process is None:
        return

    if _node_process.poll() is not None:
        # Already dead
        _node_process = None
        return

    print(f"\n🛑  Stopping weather server (pid {_node_process.pid}) …", flush=True)

    try:
        if sys.platform == "win32":
            # CTRL_BREAK_EVENT propagates to the whole process group on Windows
            _node_process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            _node_process.terminate()          # SIGTERM on POSIX

        _node_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        _node_process.kill()                   # Force-kill if graceful stop fails
        _node_process.wait()
    except Exception:
        pass

    _node_process = None
    print("✅  Weather server stopped.", flush=True)


# ── Auto-register cleanup ──────────────────────────────────────────────────────

atexit.register(stop_weather_server)

# Also handle Ctrl+C and SIGTERM so the child doesn't become orphaned
def _sig_handler(sig, frame):
    stop_weather_server()
    sys.exit(0)

signal.signal(signal.SIGINT,  _sig_handler)
signal.signal(signal.SIGTERM, _sig_handler)
