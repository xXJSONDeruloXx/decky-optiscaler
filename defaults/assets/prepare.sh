#!/usr/bin/env bash

# Save original stdout/stderr for later restoration
exec {ORIGINAL_STDOUT}>&1
exec {ORIGINAL_STDERR}>&2

# Better debugging with timestamps
set -x  # Enable debugging
# Use a different approach for logging that doesn't depend on exec redirection
{
  echo "===== $(date) ====="
  echo "Script starting: prepare.sh"

  # Print shell environment information
  echo "Shell Environment:"
  echo "SHELL: $SHELL"
  echo "BASH_VERSION: $BASH_VERSION"
  echo "PWD: $PWD"
  echo "PATH: $PATH"
  echo "Running as user: $(whoami)"
  echo "HOME: $HOME"
  echo "TERM: $TERM"
  echo "Parent process: $(ps -o comm= $PPID)"
  echo "------------------------"

  # Rest of the script continues as normal
  mod_path="$HOME/fgmod"
  bin_path="$(dirname "$(realpath "$0")")/../bin"
  assets_path="$(dirname "$(realpath "$0")")"

  standalone=1

  if [[ -d "$mod_path" ]] && [[ ! $mod_path == . ]]; then
      rm -rf "$mod_path"
  fi

  mkdir -p "$mod_path"
  cd "$mod_path" || exit 1

  # Copy all files from bin directory into the current directory
  cp "$bin_path"/* .

  # # Unzip assets.zip so that all files are in the modpath root, then remove the zip file
  # unzip -j -o assets.zip && rm assets.zip

  # Instead of using redirection which can cause permission issues, use cp to create files
  echo "Creating fgmod script from source content"
  cp "$assets_path/fgmod.sh" ./fgmod.tmp
  if [ -f "./fgmod.tmp" ]; then
    mv ./fgmod.tmp ./fgmod
  else
    echo "Failed to create temporary fgmod file"
    exit 1
  fi
  
  echo "Creating fgmod-uninstaller.sh from source content"
  cp "$assets_path/fgmod-uninstaller.sh" ./fgmod-uninstaller.sh.tmp
  if [ -f "./fgmod-uninstaller.sh.tmp" ]; then
    mv ./fgmod-uninstaller.sh.tmp ./fgmod-uninstaller.sh
  else
    echo "Failed to create temporary uninstaller file"
    exit 1
  fi
  
  # Make sure the files are executable
  chmod +x ./fgmod || { echo "Failed to make fgmod executable"; exit 1; }
  chmod +x ./fgmod-uninstaller.sh || { echo "Failed to make uninstaller executable"; exit 1; }

  # Update paths in scripts
  sed -i 's|mod_path="/usr/share/fgmod"|mod_path="'"$mod_path"'"|g' fgmod
  
  sed -i 's|mod_path="/usr/share/fgmod"|mod_path="'"$mod_path"'"|g' fgmod-uninstaller.sh

  echo ""

  # Flatpak compatibility
  if flatpak list | grep "com.valvesoftware.Steam" 1>/dev/null; then
      echo "Flatpak version of Steam detected, adding access to fgmod's folder"
      echo "Please restart Steam!"
      flatpak override --user --filesystem="$mod_path" com.valvesoftware.Steam
  fi

  echo "For Steam, add this to the launch options: \"$mod_path/fgmod\" %COMMAND%"
  echo "For Heroic, add this as a new wrapper: \"$mod_path/fgmod\""
  echo "All done!"
} 2>&1 | tee -a /tmp/prepare.log
