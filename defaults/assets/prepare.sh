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
  opti_path="$HOME/opti"

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

  # Setup OptiScaler launcher script
  echo "Setting up OptiScaler launcher script"
  mkdir -p "$opti_path"
  
  if [ -f "$assets_path/opti.sh" ]; then
    cp "$assets_path/opti.sh" "$opti_path/opti.sh.tmp"
    if [ -f "$opti_path/opti.sh.tmp" ]; then
      mv "$opti_path/opti.sh.tmp" "$opti_path/opti.sh"
      chmod +x "$opti_path/opti.sh" || { echo "Failed to make opti.sh executable"; }
      echo "Successfully installed OptiScaler launcher at $opti_path/opti.sh"
    else
      echo "Failed to create temporary OptiScaler launcher file"
    fi
  else
    echo "Warning: opti.sh not found in assets directory"
  fi

  echo ""

  # Flatpak compatibility
  if flatpak list | grep "com.valvesoftware.Steam" 1>/dev/null; then
      echo "Flatpak version of Steam detected, adding access to fgmod's folder"
      echo "Adding access to OptiScaler folder as well"
      echo "Please restart Steam!"
      flatpak override --user --filesystem="$mod_path" com.valvesoftware.Steam
      flatpak override --user --filesystem="$opti_path" com.valvesoftware.Steam
  fi

  echo "For Steam, add this to the launch options: \"$mod_path/fgmod\" %COMMAND%"
  echo "For OptiScaler, add this to the launch options: \"$opti_path/opti.sh\" %COMMAND%"
  echo "For Heroic, add these as new wrappers: \"$mod_path/fgmod\" or \"$opti_path/opti.sh\""
  echo "All done!"
} 2>&1 | tee -a /tmp/prepare.log
