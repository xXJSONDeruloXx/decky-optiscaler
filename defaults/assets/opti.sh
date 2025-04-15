#!/usr/bin/env bash

set -x
exec > >(tee -i /tmp/opti-install.log) 2>&1

error_exit() {
  echo "$1"
  if [[ -n $STEAM_ZENITY ]]; then
    $STEAM_ZENITY --error --text "$1"
  else 
    zenity --error --text "$1"
  fi
  exit 1
}

# === PATHS ===
optipath="$HOME/opti"
fgmodpath="$HOME/fgmod"
dll_name="${DLL:-dxgi.dll}"  # Default is dxgi.dll unless overridden

# === Resolve game exe path ===
if [ "$#" -lt 1 ]; then
  error_exit "Usage: $0 program [program_arguments...]"
fi

# Determine exe folder
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

# UE4/5 fallback
if [[ -d "$exe_folder_path/Engine" ]]; then
  ue_exe=$(find "$exe_folder_path" -maxdepth 4 -mindepth 4 -path "*Binaries/Win64/*.exe" -not -path "*/Engine/*" | head -1)
  exe_folder_path=$(dirname "$ue_exe")
fi

[[ ! -d "$exe_folder_path" ]] && error_exit "Could not resolve game directory!"

# === Install Core Files ===
cp "$optipath/OptiScaler.dll" "$exe_folder_path/$dll_name" ||
  error_exit "Failed to copy OptiScaler.dll as $dll_name"
cp "$optipath/OptiScaler.ini" "$exe_folder_path/OptiScaler.ini" ||
  error_exit "Failed to copy OptiScaler.ini"

cp "$optipath/libxess.dll" "$exe_folder_path/" || true
cp "$optipath/amd_fidelityfx_dx12.dll" "$exe_folder_path/" || true
cp "$optipath/amd_fidelityfx_vk.dll" "$exe_folder_path/" || true
cp "$optipath/renames/nvngx.dll" "$exe_folder_path/" || true

# === Nukem FG Mod Files ===
cp "$fgmodpath/dlssg_to_fsr3_amd_is_better.dll" "$exe_folder_path/" || true
cp "$fgmodpath/dlssg_to_fsr3.ini" "$exe_folder_path/" || true
cp "$fgmodpath/nvapi64.dll" "$exe_folder_path/" || true
cp "$fgmodpath/fakenvapi.ini" "$exe_folder_path/" || true

# === Optional helpers ===
cp -n "$fgmodpath/nvngx.ini" "$exe_folder_path/" 2>/dev/null || true
cp -n "$fgmodpath/dxvk.conf" "$exe_folder_path/" 2>/dev/null || true

echo "✅ OptiScaler installed to $exe_folder_path with $dll_name"

# Launch game if extra args provided
if [[ $# -gt 1 ]]; then
  export WINEDLLOVERRIDES="$WINEDLLOVERRIDES,$dll_name=n,b"
  "$@"
fi