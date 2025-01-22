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

set -euo pipefail
trap 'echo "An error occurred. Exiting." && exit 1' ERR

# Define paths
zip_file="$HOME/homebrew/plugins/Decky-Framegen/assets/fgmod-1.5.1.zip"
downloads_dir="$HOME/Downloads"
destination_zip="$downloads_dir/fgmod-1.5.1.zip"

# Step 1: Copy the ZIP file to Downloads if it doesn't already exist
if [[ ! -f "$destination_zip" ]]; then
    echo "Copying ZIP file to Downloads directory..."
    cp "$zip_file" "$destination_zip" || { echo "Error: ZIP file not found at $zip_file"; exit 1; }
else
    echo "ZIP file already exists in Downloads directory. Skipping copy."
fi

# Step 2: Navigate to Downloads
cd "$downloads_dir"

# Step 3: Extract the ZIP file
echo "Extracting ZIP file..."
unzip -o "$(basename "$destination_zip")" || { echo "Error: Failed to extract ZIP file."; exit 1; }

# Step 4: Locate the extracted directory dynamically
echo "Locating extracted directory..."
extracted_dir=$(find . -maxdepth 1 -type d -name "fgmod*" ! -name "__MACOSX" | head -n 1)

if [[ -d "$extracted_dir" ]]; then
    cd "$extracted_dir"
    echo "Navigated to extracted directory: $extracted_dir"
else
    echo "Error: Extracted directory not found."
    exit 1
fi

# Step 5: Run the prepare.sh script and automatically answer "y"
echo "Running prepare.sh..."
if [[ -f "./prepare.sh" ]]; then
    chmod +x ./prepare.sh
    echo "y" | ./prepare.sh || { echo "Error: prepare.sh failed."; exit 1; }
else
    echo "Error: prepare.sh not found in $extracted_dir"
    exit 1
fi

# Step 6: Signal success to the front end
echo "Installation successful!"
# Log the success explicitly for the frontend
echo "STATUS: SUCCESS"

exit 0
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