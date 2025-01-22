import json
import os
import decky
import asyncio

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

    async def _main(self):
        decky.logger.info("Plugin loaded.")

    async def _unload(self):
        decky.logger.info("Plugin unloaded.")