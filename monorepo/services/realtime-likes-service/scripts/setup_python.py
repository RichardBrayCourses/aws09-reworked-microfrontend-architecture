"""Set up the Python virtual environment for realtime-likes-service."""

import subprocess
import sys
from pathlib import Path

# This script lives in scripts/, so the service root is one level up.
SERVICE_ROOT = Path(__file__).resolve().parent.parent
VENV_DIR = SERVICE_ROOT / ".venv"
REQUIREMENTS_FILE = SERVICE_ROOT / "requirements.txt"
SRC_DIR = SERVICE_ROOT / "src"


def run_command(command):
    """Run a command in the service folder. Stop if it fails."""
    result = subprocess.run(command, cwd=SERVICE_ROOT)
    if result.returncode != 0:
        sys.exit(result.returncode)


def check_python_source():
    for path in SRC_DIR.rglob("*.py"):
        source = path.read_text()
        compile(source, str(path), "exec")


def find_system_python():
    """Use python3 on macOS/Linux, or python on Windows."""
    if sys.platform == "win32":
        options = [["python"], ["py", "-3"]]
    else:
        options = [["python3"], ["python"]]

    for command in options:
        check = subprocess.run(
            [*command, "--version"],
            cwd=SERVICE_ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if check.returncode == 0:
            return command

    print("Python was not found. Install Python, then run `pnpm install` again.")
    sys.exit(1)


def venv_python():
    """Return the Python executable inside .venv."""
    if sys.platform == "win32":
        return VENV_DIR / "Scripts" / "python.exe"
    return VENV_DIR / "bin" / "python"


def main():
    system_python = find_system_python()

    if not venv_python().exists():
        run_command([*system_python, "-m", "venv", ".venv"])

    python = str(venv_python())

    if REQUIREMENTS_FILE.exists():
        run_command([python, "-m", "pip", "install", "-r", str(REQUIREMENTS_FILE)])

    check_python_source()


if __name__ == "__main__":
    main()
