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

    async def download_optiscaler_nightly(self) -> dict:
        """Download the latest OptiScaler nightly build from GitHub using wget."""
        try:
            # Set up constants for clarity
            owner = 'cdozdil'
            repo = 'OptiScaler'
            tag = 'nightly'
            download_path = Path(decky.HOME) / "Downloads"
            download_path.mkdir(exist_ok=True)
            
            # Log the start of the download
            decky.logger.info("Starting OptiScaler nightly download")
            
            # Step 1: Get release info using wget and jq
            release_info_file = download_path / "optiscaler_release_info.json"
            release_url = f"https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag}"
            
            wget_api_cmd = [
                "wget",
                "-O", str(release_info_file),
                release_url
            ]
            
            decky.logger.info(f"Fetching release info from {release_url}")
            subprocess.run(
                wget_api_cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            # Step 2: Parse the JSON and find the 7z asset
            with open(release_info_file, 'r') as f:
                release_data = json.load(f)
            
            assets = release_data.get('assets', [])
            asset_data = next((a for a in assets if a['name'].endswith('.7z')), None)
            
            # Clean up the temporary file
            release_info_file.unlink(missing_ok=True)
            
            if not asset_data:
                return {"status": "error", "message": "No 7z file found in release"}
                
            # Step 3: Download the file using wget
            asset_url = asset_data['browser_download_url']
            asset_name = asset_data['name']
            output_file = download_path / asset_name
            
            decky.logger.info(f"Downloading {asset_name} to {output_file}")
            
            # Run wget command to download the actual asset
            wget_cmd = [
                "wget",
                "-O", str(output_file),
                asset_url
            ]
            
            result = subprocess.run(
                wget_cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            decky.logger.info(f"Download complete: {output_file}")
            return {
                "status": "success", 
                "message": f"Downloaded {asset_name} to ~/Downloads", 
                "file_path": str(output_file)
            }
            
        except subprocess.CalledProcessError as e:
            error_msg = f"wget failed: {e.stderr}"
            decky.logger.error(error_msg)
            return {"status": "error", "message": error_msg}
        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse GitHub API response: {str(e)}"
            decky.logger.error(error_msg)
            return {"status": "error", "message": error_msg}
        except Exception as e:
            error_msg = str(e)
            decky.logger.error(f"Download failed: {error_msg}")
            return {"status": "error", "message": f"Download failed: {error_msg}"}

    async def run_uninstall_fgmod(self) -> dict:
        try:
            result = subprocess.run(
                ["/bin/bash", Path(decky.DECKY_PLUGIN_DIR) / "assets" / "fgmod-remover.sh"],
                capture_output=True,
                text=True,
                check=True
            )
            return {"status": "success", "output": result.stdout}
        except subprocess.CalledProcessError as e:
            decky.logger.error(e.output)
            return {"status": "error", "message": str(e), "output": e.output}

    async def run_install_fgmod(self) -> dict:
        try:
            assets_dir = Path(decky.DECKY_PLUGIN_DIR) / "assets"
            prepare_script = assets_dir / "prepare.sh"

            if not prepare_script.exists():
                decky.logger.error(f"prepare.sh not found: {prepare_script}")
                return {
                    "status": "error",
                    "message": f"prepare.sh not found in plugin assets."
                }

            # Ensure prepare.sh has execution permissions
            prepare_script.chmod(0o755)

            # Run prepare.sh directly from the plugin's assets folder
            process = subprocess.run(
                ["/bin/bash", str(prepare_script)],
                cwd=str(assets_dir),  # Run in assets directory to use correct paths
                capture_output=True,
                text=True,
                timeout=300
            )

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
                "output": "You can now replace DLSS with FSR Frame Gen!"
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
        path = Path(decky.HOME) / "fgmod"
        required_files = [
            "amd_fidelityfx_dx12.dll", "amd_fidelityfx_vk.dll", "d3dcompiler_47.dll", "DisableNvidiaSignatureChecks.reg",
            "dlss-enabler.dll", "dlss-enabler-upscaler.dll", "dlssg_to_fsr3_amd_is_better-3.0.dll", "dlssg_to_fsr3_amd_is_better.dll",
            "dlssg_to_fsr3.ini", "dxgi.dll", "dxvk.conf", "fakenvapi.ini", "fgmod", "fgmod-uninstaller.sh",
            "libxess.dll", "nvapi64.dll", "nvngx.ini", "nvngx-wrapper.dll", "_nvngx.dll", "RestoreNvidiaSignatureChecks.reg"
        ]

        if path.exists():
            for file_name in required_files:
                if not path.joinpath(file_name).exists():
                    return {"exists": False}
            return {"exists": True}
        else:
            return {"exists": False}

    async def list_installed_games(self) -> dict:
        try:
            steam_root = Path(decky.HOME) / ".steam" / "steam"
            library_file = Path(steam_root) / "steamapps" / "libraryfolders.vdf"

            if not library_file.exists():
                return {"status": "error", "message": "libraryfolders.vdf not found"}

            library_paths = []
            with open(library_file, "r", encoding="utf-8", errors="replace") as file:
                for line in file:
                    if '"path"' in line:
                        path = line.split('"path"')[1].strip().strip('"').replace("\\\\", "/")
                        library_paths.append(path)

            games = []
            for library_path in library_paths:
                steamapps_path = Path(library_path) / "steamapps"
                if not steamapps_path.exists():
                    continue

                for appmanifest in steamapps_path.glob("appmanifest_*.acf"):
                    game_info = {"appid": None, "name": None}

                    try:
                        with open(appmanifest, "r", encoding="utf-8") as file:
                            for line in file:
                                if '"appid"' in line:
                                    game_info["appid"] = line.split('"appid"')[1].strip().strip('"')
                                if '"name"' in line:
                                    game_info["name"] = line.split('"name"')[1].strip().strip('"')
                    except UnicodeDecodeError as e:
                        decky.logger.error(f"Skipping {appmanifest} due to encoding issue: {e}")
                    finally:
                        pass  # Ensures loop continues even if an error occurs

                    if game_info["appid"] and game_info["name"]:
                        games.append(game_info)

            # Filter out games whose name contains "Proton" or "Steam Linux Runtime"
            filtered_games = [g for g in games if "Proton" not in g["name"] and "Steam Linux Runtime" not in g["name"]]

            return {"status": "success", "games": filtered_games}

        except Exception as e:
            decky.logger.error(str(e))
            return {"status": "error", "message": str(e)}

    async def log_error(self, error: str) -> None:
        decky.logger.error(f"FRONTEND: {error}")
