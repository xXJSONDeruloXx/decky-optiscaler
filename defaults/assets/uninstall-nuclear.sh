#!/usr/bin/env bash

set -x  # Enable debugging
exec > >(tee -i /tmp/uninstall-nuclear.log) 2>&1  # Log output and errors

error_exit() {
  echo "❌ $1"
  if [[ -n $STEAM_ZENITY ]]; then
    $STEAM_ZENITY --error --text "$1"
  else 
    zenity --error --text "$1" || echo "Zenity failed to display error"
  fi
  logger -t optiscaler-nuclear "❌ ERROR: $1"
  exit 1
}

# === CONFIG ===
optipath="$HOME/opti"
fgmodpath="$HOME/fgmod"

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

[[ -z "$exe_folder_path" && -n "$STEAM_COMPAT_INSTALL_PATH" ]] && exe_folder_path="$STEAM_COMPAT_INSTALL_PATH"

if [[ -d "$exe_folder_path/Engine" ]]; then
  ue_exe=$(find "$exe_folder_path" -maxdepth 4 -mindepth 4 -path "*Binaries/Win64/*.exe" -not -path "*/Engine/*" | head -1)
  exe_folder_path=$(dirname "$ue_exe")
fi

# Verify the game folder exists
if [[ ! -d $exe_folder_path ]]; then
  error_exit "Unable to locate the game folder. Ensure the game is installed and the path is correct."
fi

# Avoid operating on the script's own directory
script_dir=$(dirname "$(realpath "$0")")
if [[ "$(realpath "$exe_folder_path")" == "$script_dir" ]]; then
  error_exit "The target directory matches the script's directory. Aborting to prevent accidental deletion."
fi

# Log the resolved exe_folder_path for debugging
echo "🛑 NUCLEAR UNINSTALL STARTING IN: $exe_folder_path" | tee /tmp/nuclear-uninstall.log
logger -t optiscaler-nuclear "🛑 NUCLEAR UNINSTALL STARTING IN: $exe_folder_path"

# Change to the game directory
cd "$exe_folder_path" || error_exit "Failed to change directory to $exe_folder_path"

# NUCLEAR REMOVAL: Remove all DLL and non-executable files except .exe files
echo "⚠️ NUCLEAR REMOVAL: Removing all DLL and related files. This will require game verification!" | tee -a /tmp/nuclear-uninstall.log
logger -t optiscaler-nuclear "⚠️ NUCLEAR REMOVAL: Removing all DLL and related files"

# Remove all .dll files
find "$exe_folder_path" -name "*.dll" -type f -delete
logger -t optiscaler-nuclear "🔥 Removed .dll files"

# Remove all .ini files
find "$exe_folder_path" -name "*.ini" -type f -delete
logger -t optiscaler-nuclear "🔥 Removed .ini files"

# Remove log files
find "$exe_folder_path" -name "*.log" -type f -delete
logger -t optiscaler-nuclear "🔥 Removed .log files"

# Remove any files that might be related to mods but keep exe files
for file in *; do
    if [[ -f "$file" && "$file" != *.exe ]]; then
        # If it's not an .exe file, check if it might be a mod-related file
        if [[ "$file" == *"dlss"* || "$file" == *"dxgi"* || "$file" == *"nvapi"* || 
              "$file" == *"fsr"* || "$file" == *"xess"* || "$file" == *"OptiScaler"* || 
              "$file" == *"nvngx"* || "$file" == *"uninstaller"* || "$file" == *"d3d"* ]]; then
            echo "🔥 Removing suspected mod file: $file" | tee -a /tmp/nuclear-uninstall.log
            rm -f "$file"
        fi
    fi
done

logger -t optiscaler-nuclear "✅ NUCLEAR UNINSTALL COMPLETE"
echo "✅ NUCLEAR UNINSTALL COMPLETE" | tee -a /tmp/nuclear-uninstall.log

# Show message to user that they need to verify game files
if [[ -n $STEAM_ZENITY ]]; then
  $STEAM_ZENITY --warning --text "🔄 IMPORTANT: You must now verify the game files in Steam to restore missing files.\n\n1. Right-click the game in your Steam library\n2. Select Properties\n3. Go to Installed Files tab\n4. Click 'Verify integrity of game files'"
else 
  zenity --warning --text "🔄 IMPORTANT: You must now verify the game files in Steam to restore missing files.\n\n1. Right-click the game in your Steam library\n2. Select Properties\n3. Go to Installed Files tab\n4. Click 'Verify integrity of game files'" || echo "Zenity failed to display message"
fi

# Exit without launching the game
echo "⚠️ Game launch prevented - verify files first!" | tee -a /tmp/nuclear-uninstall.log
logger -t optiscaler-nuclear "⚠️ Game launch prevented - verify files first!"
exit 0