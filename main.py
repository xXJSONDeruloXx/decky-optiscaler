import os
import subprocess
import json
from decky_plugin import PluginBase

class Plugin(PluginBase):
    async def get_installed_games(self) -> str:
        library_file = "/home/deck/.steam/steam/steamapps/libraryfolders.vdf"
        libraries = []

        # Parse libraryfolders.vdf
        if os.path.exists(library_file):
            with open(library_file, "r") as f:
                lines = f.readlines()
                for line in lines:
                    if '"path"' in line:
                        path = line.split('"')[3]
                        libraries.append(os.path.join(path, "steamapps"))
        
        # Fetch installed games from libraries
        games = []
        for library in libraries:
            if os.path.exists(library):
                manifest_files = [f for f in os.listdir(library) if f.startswith("appmanifest_")]
                for manifest in manifest_files:
                    with open(os.path.join(library, manifest), "r") as f:
                        lines = f.readlines()
                        appid = ""
                        name = ""
                        for line in lines:
                            if '"appid"' in line:
                                appid = line.split('"')[3]
                            elif '"name"' in line:
                                name = line.split('"')[3]
                        if appid and name:
                            games.append({"appid": appid, "name": name})

        # Return games as JSON string for compatibility with TSX
        return json.dumps(games)

    @callable
    async def run_install_fgmod(self) -> dict:
        script = """
#!/usr/bin/env bash

set -euo pipefail  # Exit on error, undefined variable, or pipe failure
trap 'echo "An error occurred. Exiting."' ERR

# Define paths
assets_path="$HOME/homebrew/plugins/Decky-Framegen/assets"
mod_path="$assets_path"
nvidiaver=555.52.04
enablerver=3.02.000.0
fakenvapiver=v1.2.0

# Ensure the assets directory exists
if [[ ! -d "$assets_path" ]]; then
    echo "Error: Assets directory does not exist at $assets_path!"
    exit 1
fi

# Clear existing mod files
echo "Preparing mod directory..."
rm -rf "$mod_path"/*
mkdir -p "$mod_path"

# Copy fgmod scripts from assets
echo "Copying fgmod scripts..."
cp "$assets_path/fgmod.sh" "$mod_path/fgmod" || { echo "Error: fgmod.sh not found in assets!"; exit 1; }
cp "$assets_path/fgmod-uninstaller.sh" "$mod_path/fgmod-uninstaller.sh" || { echo "Error: fgmod-uninstaller.sh not found in assets!"; exit 1; }

# Navigate to mod_path
cd "$mod_path"

# Download required files
echo "Downloading required files..."
curl -OLf "https://github.com/artur-graniszewski/DLSS-Enabler/releases/download/$enablerver/dlss-enabler-setup-$enablerver.exe"
curl -OLf "https://download.nvidia.com/XFree86/Linux-x86_64/$nvidiaver/NVIDIA-Linux-x86_64-$nvidiaver.run"
curl -OLf "https://raw.githubusercontent.com/mozilla/fxc2/master/dll/d3dcompiler_47.dll"
curl -OLf "https://github.com/FakeMichau/innoextract/releases/download/6.3.0/innoextract"
curl -OLf "https://github.com/FakeMichau/fakenvapi/releases/download/$fakenvapiver/fakenvapi.7z"

# Validate downloads
echo "Validating downloaded files..."
required_files=(
    "dlss-enabler-setup-$enablerver.exe"
    "NVIDIA-Linux-x86_64-$nvidiaver.run"
    "d3dcompiler_47.dll"
    "innoextract"
    "fakenvapi.7z"
)

for file in "${required_files[@]}"; do
    if [[ ! -f $file ]]; then
        echo "Error: Missing required file: $file"
        exit 1
    fi
done

# Extract and prepare files
echo "Extracting and preparing files..."
chmod +x NVIDIA-Linux-x86_64-$nvidiaver.run innoextract
./NVIDIA-Linux-x86_64-$nvidiaver.run -x
./innoextract dlss-enabler-setup-$enablerver.exe

mv app/* . || true
rm -r app || true
if command -v 7z &>/dev/null; then
    7z -y x fakenvapi.7z
fi

cp -f NVIDIA-Linux-x86_64-$nvidiaver/nvngx.dll _nvngx.dll
cp -f NVIDIA-Linux-x86_64-$nvidiaver/LICENSE "licenses/LICENSE (NVIDIA driver)"
chmod +r _nvngx.dll

# Cleanup unnecessary files
echo "Cleaning up temporary files..."
rm -rf innoextract NVIDIA-Linux-x86_64-$nvidiaver dlss-enabler-setup-$enablerver.exe \
       NVIDIA-Linux-x86_64-$nvidiaver.run fakenvapi.7z

# Update script paths
sed -i "s|mod_path=\"/usr/share/fgmod\"|mod_path=\"$mod_path\"|g" "$mod_path/fgmod" "$mod_path/fgmod-uninstaller.sh"
chmod +x "$mod_path/fgmod" "$mod_path/fgmod-uninstaller.sh"

# Handle Flatpak Steam
if flatpak list | grep -q "com.valvesoftware.Steam"; then
    echo "Flatpak version of Steam detected. Granting access to $mod_path."
    flatpak override --user --filesystem="$mod_path" com.valvesoftware.Steam
    echo "Please restart Steam for changes to take effect."
fi

echo "All done!"
echo "For Steam, add this to the launch options: \"$mod_path/fgmod\" %COMMAND%"
echo "For Heroic, add this as a new wrapper: \"$mod_path/fgmod\""
"""
        try:
            process = subprocess.run(script, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            return {"status": "success", "output": process.stdout}
        except subprocess.CalledProcessError as e:
            return {"status": "error", "message": e.stderr}

    async def _main(self):
        decky.logger.info("Plugin loaded.")

    async def _unload(self):
        decky.logger.info("Plugin unloaded.")