# push_to_github.ps1
# Helper script to commit local changes and push to a remote GitHub repository.
# WARNING: Do NOT paste or store personal access tokens (PAT) in this script.

Write-Host "Push helper — will commit current workspace and push to remote"
$cwd = Get-Location
Write-Host "Working directory: $cwd"

# Ensure git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not installed or not in PATH. Install Git and re-run this script."
  exit 1
}

# Initialize repo if needed
if (-not (Test-Path .git)) {
  git init
  Write-Host "Initialized new git repository."
}

# Ensure branch
git checkout -B main

# Commit changes
git add -A
try {
  git commit -m "Save: Supabase fixes, image compression, date fallback, docs" -q
  Write-Host "Committed changes."
} catch {
  Write-Host "No changes to commit or commit failed (this is okay if nothing changed)."
}

# Remote
$defaultRemote = 'https://github.com/Zentrixacademyy/ZentrixCompany.git'
$remote = Read-Host "Enter remote URL (press Enter to use $defaultRemote)"
if ([string]::IsNullOrWhiteSpace($remote)) { $remote = $defaultRemote }

# Add or set remote
$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0 -and $existing) {
  git remote set-url origin $remote
  Write-Host "Set existing remote 'origin' to $remote"
} else {
  git remote add origin $remote
  Write-Host "Added remote 'origin' -> $remote"
}

# Prefer interactive 'gh auth login' if available
if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Host "Checking GitHub CLI authentication..."
  gh auth status 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated with gh. Launching 'gh auth login' (follow the browser steps)."
    gh auth login
  } else {
    Write-Host "gh is already authenticated."
  }
} else {
  Write-Host "GitHub CLI not found. 'git push' will prompt for credentials if required."
}

Write-Host "Pushing to origin main..."
git push -u origin main
if ($LASTEXITCODE -eq 0) {
  Write-Host "Push succeeded. Open https://github.com/Zentrixacademyy/ZentrixCompany to verify."
} else {
  Write-Error "Push failed. If it asked for credentials, authenticate (use 'gh auth login' or enter username and PAT when prompted) and retry."
}
