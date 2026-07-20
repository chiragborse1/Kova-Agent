class Kova < Formula
  include Language::Python::Virtualenv

  desc "Kova Agent — self-improving AI agent that creates skills from experience"
  homepage "https://github.com/chiragborse1/Kova-Agent"
  # Stable source should point at the semver-named sdist asset attached by
  # scripts/release.py, not the CalVer tag tarball.
  url "https://github.com/chiragborse1/Kova-Agent/releases/download/v0.1.0/kova_agent-0.1.0.tar.gz"
  sha256 "<replace-with-release-asset-sha256>"
  license "MIT"

  depends_on "certifi" => :no_linkage
  depends_on "cryptography" => :no_linkage
  depends_on "libyaml"
  depends_on "python@3.11"

  pypi_packages ignore_packages: %w[certifi cryptography pydantic]

  # Refresh resource stanzas after bumping the source url/version:
  #   brew update-python-resources --print-only kova

  def install
    venv = virtualenv_create(libexec, "python3.11")
    venv.pip_install resources
    venv.pip_install buildpath

    pkgshare.install "skills", "optional-skills"

    %w[kova hermes hermes-agent hermes-acp].each do |exe|
      next unless (libexec/"bin"/exe).exist?

      (bin/exe).write_env_script(
        libexec/"bin"/exe,
        KOVA_BUNDLED_SKILLS: pkgshare/"skills",
        KOVA_OPTIONAL_SKILLS: pkgshare/"optional-skills",
        KOVA_MANAGED: "homebrew"
      )
    end
  end

  test do
    assert_match "Kova Agent v#{version}", shell_output("#{bin}/kova version")

    managed = shell_output("#{bin}/kova update 2>&1")
    assert_match "managed by Homebrew", managed
    assert_match "brew upgrade kova", managed
  end
end
