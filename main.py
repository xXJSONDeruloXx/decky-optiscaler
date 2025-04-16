import decky  # Old-style Decky import
import os
import subprocess
import json
import shutil
import re
from pathlib import Path

class Plugin:
    async def _main(self):
        decky.logger.info("Framegen plugin loaded")

    async def _unload(self):
        decky.logger.info("Framegen plugin unloaded.")

    async def download_optiscaler_nightly(self) -> dict:
        """Download the latest OptiScaler nightly build from GitHub using wget and extract it to ~/opti."""
        try:
            # Set up constants for clarity
            owner = 'cdozdil'
            repo = 'OptiScaler'
            tag = 'nightly'
            download_path = Path(decky.HOME) / "Downloads"
            download_path.mkdir(exist_ok=True)
            extract_path = Path(decky.HOME) / "opti"
            extract_path.mkdir(exist_ok=True)
            
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
            
            # Extract version information from filename
            # Example: OptiScaler_v0.7.7-pre8_20250415.7z -> v0.7.7-pre8_20250415
            version_match = asset_name.replace('.7z', '')
            if '_v' in version_match:
                version = 'v' + version_match.split('_v')[1]
            else:
                version = version_match  # Fallback if naming pattern changes
            
            decky.logger.info(f"Detected version: {version}")
            
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
            
            # Step 4: Extract the 7z file directly to ~/opti
            decky.logger.info(f"Extracting {output_file} to {extract_path}")
            
            extract_cmd = [
                "7z",
                "x",
                "-y",
                "-o" + str(extract_path),
                str(output_file)
            ]
            
            extract_result = subprocess.run(
                extract_cmd,
                capture_output=True,
                text=True,
                check=False  # Don't raise exception if extraction fails
            )
            
            if extract_result.returncode != 0:
                decky.logger.error(f"Extraction failed: {extract_result.stderr}")
                return {
                    "status": "partial_success", 
                    "message": f"Downloaded {asset_name} to ~/Downloads but extraction failed", 
                    "file_path": str(output_file),
                    "extract_error": extract_result.stderr
                }
            
            decky.logger.info(f"Extraction complete to {extract_path}")
            
            # Step 5: Create version.txt file in the extract path
            version_file = extract_path / "version.txt"
            try:
                with open(version_file, 'w') as f:
                    f.write(version)
                decky.logger.info(f"Created version file at {version_file}")
            except Exception as e:
                decky.logger.error(f"Failed to create version file: {e}")
                # Continue with the process even if version file creation fails
            
            # Step 6: Remove the .7z file from Downloads
            try:
                output_file.unlink()
                decky.logger.info(f"Removed downloaded archive: {output_file}")
            except Exception as e:
                decky.logger.error(f"Failed to remove downloaded archive: {e}")
                return {
                    "status": "partial_success",
                    "message": f"Downloaded and extracted to ~/opti but failed to remove the .7z file",
                    "extract_path": str(extract_path)
                }
            
            # Step 7: Create renamed copies of OptiScaler.dll in a renames directory
            try:
                # Create the renames directory
                renames_dir = extract_path / "renames"
                renames_dir.mkdir(exist_ok=True)
                
                # Source file
                source_file = extract_path / "OptiScaler.dll"
                
                # List of names to create
                rename_files = [
                    "dxgi.dll",
                    "winmm.dll",
                    "dbghelp.dll",
                    "version.dll",
                    "wininet.dll",
                    "winhttp.dll",
                    "OptiScaler.asi"
                ]
                
                # Check if source file exists
                if not source_file.exists():
                    decky.logger.error(f"Source file {source_file} does not exist, can't create renames")
                else:
                    # Create each renamed copy
                    for rename_file in rename_files:
                        dest_file = renames_dir / rename_file
                        # Use shutil.copy2 to preserve metadata
                        shutil.copy2(source_file, dest_file)
                        decky.logger.info(f"Created renamed copy: {dest_file}")
                    
                    decky.logger.info(f"Created all renamed copies in {renames_dir}")

                    # Download nvngx_dlss.dll from GitHub and save as nvngx.dll in renames directory
                    try:
                        nvngx_url = "https://raw.githubusercontent.com/NVIDIAGameWorks/Streamline/main/bin/x64/nvngx_dlss.dll"
                        nvngx_dest = renames_dir / "nvngx.dll"
                        
                        decky.logger.info(f"Downloading nvngx_dlss.dll from GitHub to {nvngx_dest}")
                        
                        nvngx_cmd = [
                            "wget",
                            "-O", str(nvngx_dest),
                            nvngx_url
                        ]
                        
                        nvngx_result = subprocess.run(
                            nvngx_cmd,
                            capture_output=True,
                            text=True,
                            check=False  # Don't raise exception if download fails
                        )
                        
                        if nvngx_result.returncode != 0:
                            decky.logger.error(f"Failed to download nvngx_dlss.dll: {nvngx_result.stderr}")
                        else:
                            decky.logger.info(f"Successfully downloaded nvngx_dlss.dll as {nvngx_dest}")
                    except Exception as e:
                        decky.logger.error(f"Failed to download nvngx_dlss.dll: {e}")
                        # Continue with the process even if this download fails

            except Exception as e:
                decky.logger.error(f"Failed to create renamed copies: {e}")
                # Continue with the process even if renaming fails
            
            # Step 8: Update OptiScaler.ini to set FGType=nukems
            try:
                ini_file = extract_path / "OptiScaler.ini"
                if ini_file.exists():
                    # Comment out the FGType modification
                    decky.logger.info(f"FGType=nukems feature disabled, keeping original INI settings")
                    
                    # Original implementation:
                    # decky.logger.info(f"Updating {ini_file to set FGType=nukems")
                    # # Read the file content
                    # with open(ini_file, 'r') as f:
                    #     content = f.read()
                    # # Replace FGType=auto with FGType=nukems using regex for flexibility
                    # import re
                    # updated_content = re.sub(r'FGType\s*=\s*auto', 'FGType=nukems', content)
                    # # Write the updated content back to the file
                    # with open(ini_file, 'w') as f:
                    #     f.write(updated_content)
                    
                    decky.logger.info("Preserving original OptiScaler.ini FGType settings")
                else:
                    decky.logger.error(f"OptiScaler.ini not found at {ini_file}")
            except Exception as e:
                decky.logger.error(f"Failed to update OptiScaler.ini: {e}")
                # Continue with the process even if INI update fails
            
            return {
                "status": "success", 
                "message": f"Downloaded and extracted OptiScaler {version} to ~/opti", 
                "extract_path": str(extract_path),
                "version": version
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

    async def check_optiscaler_path(self) -> dict:
        """Check if OptiScaler is installed properly in ~/opti and get its version."""
        try:
            opti_path = Path(decky.HOME) / "opti"
            version_file = opti_path / "version.txt"
            required_files = ["OptiScaler.dll", "OptiScaler.ini"]
            
            # Check if directory exists
            if not opti_path.exists() or not opti_path.is_dir():
                return {"exists": False, "version": ""}
            
            # Check for required files
            for file_name in required_files:
                if not (opti_path / file_name).exists():
                    return {"exists": False, "version": ""}
            
            # Check for and read version.txt
            version = ""
            if version_file.exists():
                try:
                    with open(version_file, 'r') as f:
                        version = f.read().strip()
                except Exception as e:
                    decky.logger.error(f"Failed to read version file: {e}")
            
            return {"exists": True, "version": version}
        except Exception as e:
            decky.logger.error(f"Error checking OptiScaler path: {e}")
            return {"exists": False, "version": ""}

    async def get_optiscaler_fgtype(self) -> dict:
        """Get the current FGType value from OptiScaler.ini."""
        try:
            import re
            opti_path = Path(decky.HOME) / "opti"
            ini_file = opti_path / "OptiScaler.ini"
            
            if not ini_file.exists():
                return {"status": "error", "message": "OptiScaler.ini not found", "fgtype": "unknown"}
            
            # Read the file content
            with open(ini_file, 'r') as f:
                content = f.read()
            
            # Find the FGType setting
            match = re.search(r'FGType\s*=\s*(\w+)', content)
            if match:
                fgtype = match.group(1)
                return {"status": "success", "fgtype": fgtype}
            else:
                return {"status": "error", "message": "FGType setting not found", "fgtype": "unknown"}
        except Exception as e:
            decky.logger.error(f"Error getting FGType: {e}")
            return {"status": "error", "message": str(e), "fgtype": "unknown"}

    async def set_optiscaler_fgtype(self, fgtype: str) -> dict:
        """Set the FGType value in OptiScaler.ini."""
        try:
            import re
            opti_path = Path(decky.HOME) / "opti"
            ini_file = opti_path / "OptiScaler.ini"
            
            if not ini_file.exists():
                return {"status": "error", "message": "OptiScaler.ini not found"}
            
            # Validate fgtype
            valid_types = ["auto", "nofg", "optifg", "nukems"]
            if fgtype not in valid_types:
                return {"status": "error", "message": f"Invalid FGType: {fgtype}"}
            
            # Read the file content
            with open(ini_file, 'r') as f:
                content = f.read()
            
            # Replace FGType setting
            updated_content = re.sub(r'(FGType\s*=\s*)(\w+)', f'\\1{fgtype}', content)
            
            # Write the updated content back to the file
            with open(ini_file, 'w') as f:
                f.write(updated_content)
            
            decky.logger.info(f"Updated OptiScaler.ini FGType to {fgtype}")
            return {"status": "success", "message": f"FGType set to {fgtype}"}
        except Exception as e:
            decky.logger.error(f"Error setting FGType: {e}")
            return {"status": "error", "message": str(e)}

    async def get_optiscaler_settings(self, section: str = None) -> dict:
        """
        Get current settings from the OptiScaler.ini file.
        
        Args:
            section: Optional section name to filter settings
            
        Returns:
            Dictionary with settings
        """
        try:
            ini_path = Path(decky.HOME) / "opti" / "OptiScaler.ini"
            
            if not ini_path.exists():
                return {
                    "status": "error",
                    "message": "OptiScaler.ini not found",
                    "settings": {}
                }
            
            settings = {}
            current_section = None
            
            with open(ini_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    
                    # Skip comments and empty lines
                    if not line or line.startswith(';'):
                        continue
                    
                    # Check for section headers
                    if line.startswith('[') and line.endswith(']'):
                        current_section = line[1:-1]
                        if current_section not in settings:
                            settings[current_section] = {}
                        continue
                    
                    # Process key-value pairs
                    if '=' in line and current_section:
                        key, value = line.split('=', 1)
                        settings[current_section][key.strip()] = value.strip()
            
            # If a specific section was requested
            if section:
                if section in settings:
                    return {
                        "status": "success",
                        "settings": settings[section]
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"Section {section} not found",
                        "settings": {}
                    }
            
            return {
                "status": "success",
                "settings": settings
            }
            
        except Exception as e:
            decky.logger.error(f"Error getting OptiScaler settings: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "settings": {}
            }

    async def set_optiscaler_setting(self, section: str, key: str, value: str) -> dict:
        """
        Set a specific setting in the OptiScaler.ini file.
        
        Args:
            section: Section name in the INI file
            key: Setting key
            value: New value for the setting
            
        Returns:
            Dictionary with status and message
        """
        try:
            ini_path = Path(decky.HOME) / "opti" / "OptiScaler.ini"
            
            if not ini_path.exists():
                return {
                    "status": "error",
                    "message": "OptiScaler.ini not found"
                }
            
            # Read the entire file
            with open(ini_path, 'r') as f:
                content = f.read()
            
            # Create a pattern that looks for the key in the specific section
            section_pattern = f"\\[{re.escape(section)}\\](.*?)(?=\\[|$)"
            section_match = re.search(section_pattern, content, re.DOTALL)
            
            if not section_match:
                return {
                    "status": "error",
                    "message": f"Section [{section}] not found"
                }
            
            section_content = section_match.group(1)
            key_pattern = f"^{re.escape(key)}\\s*=.*$"
            
            # Check if the key exists in the section
            key_match = re.search(key_pattern, section_content, re.MULTILINE)
            
            if not key_match:
                return {
                    "status": "error",
                    "message": f"Key {key} not found in section [{section}]"
                }
            
            # Replace the key's value
            new_line = f"{key}={value}"
            updated_section = re.sub(key_pattern, new_line, section_content, flags=re.MULTILINE)
            
            # Replace the old section with the updated one
            updated_content = content.replace(section_content, updated_section)
            
            # Write the updated content back to the file
            with open(ini_path, 'w') as f:
                f.write(updated_content)
            
            decky.logger.info(f"Updated OptiScaler.ini: [{section}] {key}={value}")
            return {
                "status": "success",
                "message": f"Setting updated: [{section}] {key}={value}"
            }
            
        except Exception as e:
            decky.logger.error(f"Error setting OptiScaler setting: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def set_upscaler_type(self, upscaler_type: str, value: str) -> dict:
        """
        Set the upscaler type for a specific API.
        
        Args:
            upscaler_type: 'Dx11Upscaler', 'Dx12Upscaler', or 'VulkanUpscaler'
            value: The upscaler value to set (e.g., 'auto', 'fsr22', 'xess', etc.)
            
        Returns:
            Dictionary with status and message
        """
        valid_types = ["Dx11Upscaler", "Dx12Upscaler", "VulkanUpscaler"]
        if upscaler_type not in valid_types:
            return {
                "status": "error",
                "message": f"Invalid upscaler type: {upscaler_type}"
            }
        
        return await self.set_optiscaler_setting("Upscalers", upscaler_type, value)

    async def set_optifg_settings(self, settings: dict) -> dict:
        """
        Update multiple OptiFG settings at once.
        
        Args:
            settings: Dictionary of settings to update in the [OptiFG] section
            
        Returns:
            Dictionary with status and message
        """
        try:
            results = []
            section = "OptiFG"
            
            for key, value in settings.items():
                result = await self.set_optiscaler_setting(section, key, str(value))
                results.append(result)
            
            # Check if any errors occurred
            errors = [r for r in results if r["status"] == "error"]
            if errors:
                return {
                    "status": "partial_success",
                    "message": f"Updated {len(results) - len(errors)} settings, {len(errors)} failed",
                    "details": errors
                }
            
            return {
                "status": "success",
                "message": f"Updated {len(results)} OptiFG settings"
            }
            
        except Exception as e:
            decky.logger.error(f"Error setting OptiFG settings: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def set_framerate_limit(self, limit: str) -> dict:
        """
        Set the framerate limit in the OptiScaler.ini.
        
        Args:
            limit: The framerate limit value (e.g., 'auto', '60.0', etc.)
            
        Returns:
            Dictionary with status and message
        """
        return await self.set_optiscaler_setting("Framerate", "FramerateLimit", limit)
        
    async def set_quality_ratio_override(self, enabled: bool, ratios: dict = None) -> dict:
        """
        Set the quality ratio override settings.
        
        Args:
            enabled: Whether to enable quality ratio overrides
            ratios: Optional dictionary with quality mode ratios
            
        Returns:
            Dictionary with status and message
        """
        try:
            results = []
            
            # First, enable/disable the override
            enabled_result = await self.set_optiscaler_setting(
                "QualityOverrides", 
                "QualityRatioOverrideEnabled", 
                "true" if enabled else "false"
            )
            results.append(enabled_result)
            
            # If ratios are provided and enabled is True, update each ratio
            if enabled and ratios:
                for mode, ratio in ratios.items():
                    key_name = f"QualityRatio{mode}"
                    ratio_result = await self.set_optiscaler_setting(
                        "QualityOverrides", 
                        key_name, 
                        str(ratio)
                    )
                    results.append(ratio_result)
            
            # Check if any errors occurred
            errors = [r for r in results if r["status"] == "error"]
            if errors:
                return {
                    "status": "partial_success",
                    "message": f"Updated {len(results) - len(errors)} settings, {len(errors)} failed",
                    "details": errors
                }
            
            return {
                "status": "success",
                "message": f"Updated quality ratio override settings"
            }
            
        except Exception as e:
            decky.logger.error(f"Error setting quality ratio override: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def set_menu_settings(self, settings: dict) -> dict:
        """
        Update multiple Menu settings at once.
        
        Args:
            settings: Dictionary of settings to update in the [Menu] section
            
        Returns:
            Dictionary with status and message
        """
        try:
            results = []
            section = "Menu"
            
            for key, value in settings.items():
                result = await self.set_optiscaler_setting(section, key, str(value))
                results.append(result)
            
            # Check if any errors occurred
            errors = [r for r in results if r["status"] == "error"]
            if errors:
                return {
                    "status": "partial_success",
                    "message": f"Updated {len(results) - len(errors)} settings, {len(errors)} failed",
                    "details": errors
                }
            
            return {
                "status": "success",
                "message": f"Updated {len(results)} Menu settings"
            }
            
        except Exception as e:
            decky.logger.error(f"Error setting Menu settings: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def set_upscale_ratio_override(self, enabled: bool, value: str = None) -> dict:
        """
        Set the upscale ratio override settings.
        
        Args:
            enabled: Whether to enable upscale ratio override
            value: Optional value for the override
            
        Returns:
            Dictionary with status and message
        """
        try:
            results = []
            
            # First, enable/disable the override
            enabled_result = await self.set_optiscaler_setting(
                "UpscaleRatio", 
                "UpscaleRatioOverrideEnabled", 
                "true" if enabled else "false"
            )
            results.append(enabled_result)
            
            # If value is provided and enabled is True, update the value
            if enabled and value:
                value_result = await self.set_optiscaler_setting(
                    "UpscaleRatio", 
                    "UpscaleRatioOverrideValue", 
                    value
                )
                results.append(value_result)
            
            # Check if any errors occurred
            errors = [r for r in results if r["status"] == "error"]
            if errors:
                return {
                    "status": "partial_success",
                    "message": f"Updated {len(results) - len(errors)} settings, {len(errors)} failed",
                    "details": errors
                }
            
            return {
                "status": "success",
                "message": f"Updated upscale ratio override settings"
            }
            
        except Exception as e:
            decky.logger.error(f"Error setting upscale ratio override: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
