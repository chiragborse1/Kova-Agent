from pathlib import Path


def test_windows_native_install_path_docs_match_installer() -> None:
    doc = Path("website/docs/user-guide/windows-native.md").read_text()
    install = Path("scripts/install.ps1").read_text()

    assert "%LOCALAPPDATA%\.kova\\kova-agent\\venv\\Scripts" in doc
    assert "Get-Command kova        # should print C:\\Users\\<you>\\AppData\\Local\.kova\\kova-agent\\venv\\Scripts\\kova.exe" in doc
    assert '$kovaBin = "$InstallDir\\venv\\Scripts"' in install
