#!/usr/bin/env bash

error_exit() {
  echo "$1"
  if [[ -n $STEAM_ZENITY ]]; then
    $STEAM_ZENITY --error --text "$1"
  else 
    zenity --error --text "$1"
  fi
  exit 1
}

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 program [program_arguments...]"
  exit 1
fi

game_path=""
mod_path="/usr/share/fgmod"

# Locate the game folder based on the first argument
if [[ "$1" == *.exe ]]; then
  exe_folder_path=$(dirname "$1")
else
  for arg in "$@"; do
    if [[ "$arg" == *.exe ]]; then
      # Handle special cases for specific games
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

# Fallback to STEAM_COMPAT_INSTALL_PATH when no path was found
if [[ ! -d $exe_folder_path ]] && [[ -n ${STEAM_COMPAT_INSTALL_PATH} ]]; then
  exe_folder_path=${STEAM_COMPAT_INSTALL_PATH}
fi

# Check for Unreal Engine game paths
if [[ -d "$exe_folder_path/Engine" ]]; then
  ue_exe_path=$(find "$exe_folder_path" -maxdepth 4 -mindepth 4 -path "*Binaries/Win64/*.exe" -not -path "*/Engine/*" | head -1)
  exe_folder_path=$(dirname "$ue_exe_path")
fi

# Verify the game folder exists
if [[ -d $exe_folder_path ]]; then
  cd "$exe_folder_path" || error_exit "Failed to change directory to $exe_folder_path"
else
  error_exit "Unable to locate the game folder. Ensure the game is installed and the path is correct."
fi

# Perform uninstallation
rm "dlss-enabler.dll" 2>/dev/null
rm "dxgi.dll" 2>/dev/null
rm "nvngx-wrapper.dll" 2>/dev/null
rm "_nvngx.dll" 2>/dev/null
rm "dlssg_to_fsr3_amd_is_better.dll" 2>/dev/null
rm "dlssg_to_fsr3_amd_is_better-3.0.dll" 2>/dev/null
rm "dlss-enabler-upscaler.dll" 2>/dev/null
rm "nvngx.ini" 2>/dev/null
rm "libxess.dll" 2>/dev/null
rm "d3dcompiler_47.dll" 2>/dev/null
rm "amd_fidelityfx_dx12.dll" 2>/dev/null
rm "amd_fidelityfx_vk.dll" 2>/dev/null
rm "nvapi64.dll" 2>/dev/null
rm "fakenvapi.ini" 2>/dev/null
rm "OptiScaler.log" 2>/dev/null
rm "dlss-enabler.log" 2>/dev/null
rm "dlssg_to_fsr3.log" 2>/dev/null
rm "fakenvapi.log" 2>/dev/null

# Restore original DLLs if they exist
mv -f "libxess.dll.b" "libxess.dll" 2>/dev/null
mv -f "d3dcompiler_47.dll.b" "d3dcompiler_47.dll" 2>/dev/null
mv -f "amd_fidelityfx_dx12.dll.b" "amd_fidelityfx_dx12.dll" 2>/dev/null
mv -f "amd_fidelityfx_vk.dll.b" "amd_fidelityfx_vk.dll" 2>/dev/null

# Self-remove uninstaller
rm "$0"

echo "fgmod removed from this game."