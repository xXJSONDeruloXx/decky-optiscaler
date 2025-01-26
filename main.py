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

    async def run_uninstall_fgmod(self) -> dict:
        try:
            result = subprocess.run(
                ["/bin/bash", "/home/deck/homebrew/plugins/Decky-Framegen/assets/fgmod-remover.sh"],
                capture_output=True,
                text=True,
                check=True
            )
            return {"status": "success", "output": result.stdout}
        except subprocess.CalledProcessError as e:
            return {"status": "error", "message": str(e), "output": e.output}

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
        path = "/home/deck/fgmod/"
        required_files = [
            "amd_fidelityfx_dx12.dll", "dlssg_to_fsr3_amd_is_better.dll", "libxess.dll",
            "amd_fidelityfx_vk.dll", "dlssg_to_fsr3.ini", "licenses",
            "d3dcompiler_47.dll", "dxgi.dll", "nvapi64.dll",
            "DisableNvidiaSignatureChecks.reg", "dxvk.conf", "_nvngx.dll",
            "dlss-enabler.dll", "fakenvapi.ini", "nvngx.ini",
            "dlss-enabler-upscaler.dll", "fgmod", "nvngx-wrapper.dll",
            "dlssg_to_fsr3_amd_is_better-3.0.dll", "fgmod-uninstaller.sh", "RestoreNvidiaSignatureChecks.reg"
        ]

        if os.path.exists(path):
            for file_name in required_files:
                if not os.path.exists(os.path.join(path, file_name)):
                    return {"exists": False}
            return {"exists": True}
        else:
            return {"exists": False}