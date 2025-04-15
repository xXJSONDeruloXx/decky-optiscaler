#!/usr/bin/env bash

set -x
exec > >(tee -i /tmp/opti-install.log) 2>&1

error_exit() {
  echo "$1"
  if [[ -n $STEAM_ZENITY ]]; then
    $STEAM_ZENITY --error --text "$1"
  else 
    zenity --error --text "$1" || echo "Zenity failed to display error"
  fi
  logger -t optiscaler "❌ ERROR: $1"
  exit 1
}

safe_copy() {
  local src="$1"
  local dest="$2"
  local opts="${3:-}"
  cp $opts "$src" "$dest" 2>/dev/null

  if [[ $? -ne 0 && -d "$(dirname "$dest")" ]]; then
    echo "Limited permissions detected, trying alternative methods..."

    if command -v bwrap >/dev/null 2>&1; then
      echo "Using bubblewrap to copy files..."
      bwrap --dev-bind / / cp $opts "$src" "$dest" 2>/dev/null
    fi

    if [[ $? -ne 0 && "$(whoami)" == "deck" && -x "$(command -v sudo)" ]]; then
      echo "Using sudo to copy files..."
      sudo cp $opts "$src" "$dest"
    fi
  fi

  [[ -e "$dest" ]] || return 1
  return 0
}

# === CONFIG ===
optipath="$HOME/opti"
fgmodpath="$HOME/fgmod"
dll_name="${DLL:-dxgi.dll}"

# === Resolve Game Path ===
if [[ "$#" -lt 1 ]]; then
  error_exit "Usage: $0 program [program_arguments...]"
fi

exe_folder_path=""
if [[ $# -eq 1 ]]; then
  [[ "$1" == *.exe ]] && exe_folder_path=$(dirname "$1") || exe_folder_path="$1"
else
  for arg in "$@"; do
    if [[ "$arg" == *.exe ]]; then
      [[ "$arg" == *"Cyberpunk 2077"* ]] && arg=${arg//REDprelauncher.exe/bin/x64/Cyberpunk2077.exe}
      [[ "$arg" == *"Witcher 3"* ]]      && arg=${arg//REDprelauncher.exe/bin/x64_dx12/witcher3.exe}
      [[ "$arg" == *"HITMAN 3"* ]]       && arg=${arg//Launcher.exe/Retail/HITMAN3.exe}
      [[ "$arg" == *"HITMAN World of Assassination"* ]] && arg=${arg//Launcher.exe/Retail/HITMAN3.exe}
      [[ "$arg" == *"SYNCED"* ]]         && arg=${arg//Launcher\/sop_launcher.exe/SYNCED.exe}
      [[ "$arg" == *"2KLauncher"* ]]     && arg=${arg//2KLauncher\/LauncherPatcher.exe/DoesntMatter.exe}
      [[ "$arg" == *"Warhammer 40,000 DARKTIDE"* ]] && arg=${arg//launcher\/Launcher.exe/binaries/Darktide.exe}
      [[ "$arg" == *"Warhammer Vermintide 2"* ]]    && arg=${arg//launcher\/Launcher.exe/binaries_dx12/vermintide2_dx12.exe}
      [[ "$arg" == *"Satisfactory"* ]]   && arg=${arg//FactoryGameSteam.exe/Engine/Binaries/Win64/FactoryGameSteam-Win64-Shipping.exe}
      exe_folder_path=$(dirname "$arg")
      break
    fi
  done
fi

[[ -z "$exe_folder_path" && -n "$STEAM_COMPAT_INSTALL_PATH" ]] && exe_folder_path="$STEAM_COMPAT_INSTALL_PATH"

if [[ -d "$exe_folder_path/Engine" ]]; then
  ue_exe=$(find "$exe_folder_path" -maxdepth 4 -mindepth 4 -path "*Binaries/Win64/*.exe" -not -path "*/Engine/*" | head -1)
  exe_folder_path=$(dirname "$ue_exe")
fi

[[ ! -d "$exe_folder_path" ]] && error_exit "❌ Could not resolve game directory!"

logger -t optiscaler "🟢 Target directory: $exe_folder_path"
logger -t optiscaler "🧩 Using DLL name: $dll_name"

# === Cleanup Old Injectors ===
rm -f "$exe_folder_path"/{dxgi.dll,winmm.dll,nvngx.dll,_nvngx.dll,nvngx-wrapper.dll,dlss-enabler.dll,OptiScaler.dll}

# === Optional: Backup Original DLLs ===
for f in dxgi.dll d3dcompiler_47.dll nvapi64.dll; do
  [[ -f "$exe_folder_path/$f" ]] && mv -n "$exe_folder_path/$f" "$exe_folder_path/$f.bak"
done

# === Core Install ===
if [[ -f "$optipath/renames/$dll_name" ]]; then
  echo "✅ Using pre-renamed $dll_name"
  safe_copy "$optipath/renames/$dll_name" "$exe_folder_path/$dll_name" || error_exit "Failed to copy $dll_name"
else
  echo "⚠️ Pre-renamed $dll_name not found, falling back to OptiScaler.dll"
  safe_copy "$optipath/OptiScaler.dll" "$exe_folder_path/$dll_name" || error_exit "Failed to copy OptiScaler.dll as $dll_name"
fi

safe_copy "$optipath/OptiScaler.ini" "$exe_folder_path/OptiScaler.ini" || error_exit "Failed to copy OptiScaler.ini"

# === Supporting Libraries ===
safe_copy "$optipath/libxess.dll" "$exe_folder_path/" || true
safe_copy "$optipath/amd_fidelityfx_dx12.dll" "$exe_folder_path/" || true
safe_copy "$optipath/amd_fidelityfx_vk.dll" "$exe_folder_path/" || true
safe_copy "$optipath/renames/nvngx.dll" "$exe_folder_path/" || true

# === Nukem FG Mod Files ===
safe_copy "$fgmodpath/dlssg_to_fsr3_amd_is_better.dll" "$exe_folder_path/" || true
safe_copy "$fgmodpath/dlssg_to_fsr3.ini" "$exe_folder_path/" || true
safe_copy "$fgmodpath/nvapi64.dll" "$exe_folder_path/" || true
safe_copy "$fgmodpath/fakenvapi.ini" "$exe_folder_path/" || true

# === Optional Helpers ===
safe_copy "$fgmodpath/dxvk.conf" "$exe_folder_path/" "-n" || true

logger -t optiscaler "✅ OptiScaler installed in: $exe_folder_path with DLL: $dll_name"
echo "✅ OptiScaler installed in: $exe_folder_path with DLL: $dll_name"

# === Game Launch ===
if [[ $# -gt 1 ]]; then
  echo "🚀 Launching game with args: $@"
  logger -t optiscaler "🚀 Launching: $@"

  # Set DLL override
  dll_override="${dll_name%.dll}"
  if [[ "$WINEDLLOVERRIDES" != *"$dll_override=n,b"* ]]; then
    export WINEDLLOVERRIDES="${WINEDLLOVERRIDES:+$WINEDLLOVERRIDES,}$dll_override=n,b"
  fi
  logger -t optiscaler "🔧 DLL override: $dll_override=n,b"

  # Explicitly disable SteamDeck environment (some overlays/launchers check this)
  export SteamDeck=0

  "$@"
fi