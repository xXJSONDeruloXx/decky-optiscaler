import os
import subprocess
import json
import decky

class Plugin:
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
        try:
            # Define paths
            assets_dir = Path("/home/deck/homebrew/plugins/Decky-Framegen/assets")
            downloads_dir = Path.home() / "Downloads"

            # Copy files to Downloads, overwriting if they exist
            files_to_copy = ["prepare.sh", "fgmod.sh", "fgmod-uninstaller.sh"]
            for file in files_to_copy:
                src = assets_dir / file
                dest = downloads_dir / file
                if src.exists():
                    dest.write_bytes(src.read_bytes())
                    dest.chmod(0o755)  # Make the file executable
                else:
                    return {"status": "error", "message": f"{file} is missing in {assets_dir}"}

            # Run prepare.sh
            prepare_script = downloads_dir / "prepare.sh"
            process = subprocess.run([str(prepare_script)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            # Verify key files exist, if not create it
            fgmod_path = Path("/home/deck/fgmod")
            if not fgmod_path.exists():
                fgmod_path.mkdir(parents=True)
                return {"status": "info", "message": "fgmod directory was not found and has been created"}

            # Check for success message
            if "All done!" not in process.stdout:
                return {"status": "error", "message": "Installation did not complete successfully"}

            return {"status": "success", "output": process.stdout}
        except subprocess.CalledProcessError as e:
            return {"status": "error", "message": e.stderr}

    async def _main(self):
        decky.logger.info("Plugin loaded.")

    async def _unload(self):
        decky.logger.info("Plugin unloaded.")
