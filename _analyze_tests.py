"""Analyze test failure patterns by running each test file individually."""
import subprocess
import sys
import json
import os
from pathlib import Path

os.chdir(Path(__file__).parent)

# Get slice 1 files
sys.path.insert(0, '.')
from scripts.run_tests_parallel import generate_slices
result = generate_slices(8)
data = json.loads(result)
slice1_files = data['include'][0]['slice']['files']

print(f"Slice 1 has {len(slice1_files)} files")

python = ".venv/Scripts/python.exe"
import_errors = 0
assertion_errors = 0
other_errors = 0
passed = 0
samples = []

for i, f in enumerate(slice1_files):
    if i >= 10:  # just first 10
        break
    result = subprocess.run(
        [python, "-m", "pytest", f, "-x", "--tb=line", "-o", "addopts=", "--no-header", "-q"],
        capture_output=True, text=True, timeout=60
    )
    stderr_lines = result.stderr.strip().split('\n')
    stdout_lines = result.stdout.strip().split('\n')
    summary = stderr_lines[-1] if stderr_lines else ""
    short_fail = [l for l in stdout_lines if l.startswith('FAILED') or l.startswith('ERROR')]
    
    if result.returncode == 0:
        passed += 1
        print(f"  PASS: {f}")
    else:
        fail_line = short_fail[0] if short_fail else summary
        if 'ImportError' in result.stderr or 'ModuleNotFoundError' in result.stderr:
            import_errors += 1
            print(f"  IMPORT: {f} -> {fail_line[:120]}")
        elif 'AssertionError' in result.stderr or 'assert' in fail_line:
            assertion_errors += 1
            print(f"  ASSERT: {f} -> {fail_line[:120]}")
        else:
            other_errors += 1
            print(f"  OTHER: {f} -> {fail_line[:120]}")

print(f"\nResults: passed={passed}, import_errors={import_errors}, assertion_errors={assertion_errors}, other_errors={other_errors}")
