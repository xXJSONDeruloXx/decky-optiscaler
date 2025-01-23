import decky  # Old-style Decky import
import os
import subprocess
import json
from pathlib import Path

class Plugin:
    async def _main(self):
        decky.logger.info("Framegen plugin loaded")

    async def _unload(self):
        decky.logger.info("Framegen plugin unloaded.")

    # # Public method: front end can call this via callable("get_installed_games")
    # async def get_installed_games(self) -> str:
    #     library_file = "/home/deck/.steam/steam/steamapps/libraryfolders.vdf"
    #     libraries = []

    #     # Find library folders
    #     if os.path.exists(library_file):
    #         with open(library_file, "r") as f:
    #             lines = f.readlines()
    #             for line in lines:
    #                 if '"path"' in line:
    #                     folder_path = line.split('"')[3]
    #                     libraries.append(os.path.join(folder_path, "steamapps"))

    #     # Gather installed games
    #     games = []
    #     for library in libraries:
    #         if os.path.exists(library):
    #             manifest_files = [
    #                 f for f in os.listdir(library)
    #                 if f.startswith("appmanifest_")
    #             ]
    #             for manifest in manifest_files:
    #                 manifest_path = os.path.join(library, manifest)
    #                 with open(manifest_path, "r") as mf:
    #                     lines = mf.readlines()
    #                     appid = ""
    #                     name = ""
    #                     for line in lines:
    #                         if '"appid"' in line:
    #                             appid = line.split('"')[3]
    #                         elif '"name"' in line:
    #                             name = line.split('"')[3]
    #                     if appid and name:
    #                         games.append({"appid": appid, "name": name})

    #     return json.dumps(games)

    # Public method: front end can call this via callable("run_install_fgmod")
    async def run_install_fgmod(self) -> dict:
        try:
            assets_dir = Path("/home/deck/homebrew/plugins/Decky-Framegen/assets")
            downloads_dir = Path.home() / "Downloads"

            if not assets_dir.exists():
                decky.logger.error(f"Assets directory not found: {assets_dir}")
                return {
                    "status": "error",
                    "message": f"Assets directory not found: {assets_dir}"
                }

            downloads_dir.mkdir(parents=True, exist_ok=True)

            files_to_copy = ["prepare.sh", "fgmod.sh", "fgmod-uninstaller.sh"]
            for file_name in files_to_copy:
                src = assets_dir / file_name
                if not src.exists():
                    decky.logger.error(f"Required file missing: {src}")
                    return {
                        "status": "error",
                        "message": f"Required file missing: {file_name}"
                    }

                dest = downloads_dir / file_name
                dest.write_bytes(src.read_bytes())
                dest.chmod(0o755)

            prepare_script = downloads_dir / "prepare.sh"
            process = subprocess.run(
                [str(prepare_script)],
                capture_output=True,
                text=True,
                timeout=300
            )

            fgmod_path = Path("/home/deck/fgmod")
            fgmod_path.mkdir(parents=True, exist_ok=True)

            decky.logger.info(f"Script output:\n{process.stdout}")
            decky.logger.error(f"Script errors:\n{process.stderr}")

            if "All done!" not in process.stdout:
                decky.logger.error("Installation did not complete successfully")
                return {
                    "status": "error",
                    "message": process.stdout + process.stderr
                }

            return {
                "status": "success",
                "output": "in the games' launch options, add: /home/deck/fgmod/fgmod %COMMAND%"
            }

        except subprocess.TimeoutExpired:
            decky.logger.error("Installation script timed out")
            return {
                "status": "error",
                "message": "Installation timed out"
            }
        except subprocess.CalledProcessError as e:
            decky.logger.error(f"Script error: {e.stderr}")
            return {
                "status": "error",
                "message": e.stderr
            }
        except Exception as e:
            decky.logger.error(f"Unexpected error: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def check_fgmod_path(self) -> dict:
        path = "/home/deck/fgmod/"
        exists = os.path.exists(path)
        return {
            "exists": exists
        }