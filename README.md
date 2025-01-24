# Decky Framegen Plugin

This plugin swaps DLSS with FSR to enable upscaling and frame generation in games without built-in FSR support.

## Features

- Install and uninstall Framegen mod
- Check if Framegen mod path exists
- Add launch option to the running game to enable the patch

### Frontend

The frontend code is located in [index.tsx](http://_vscodecontentref_/1). It uses the `@decky/ui` and `@decky/api` libraries to create the UI and interact with the backend.

### Backend

The backend code is located in [main.py](http://_vscodecontentref_/2). It handles the installation and uninstallation of the Framegen mod.

### Scripts

- [prepare.sh](http://_vscodecontentref_/3): Prepares the environment for the Framegen mod installation. It downloads necessary files and sets up the mod path. Located in [prepare.sh](http://_vscodecontentref_/4).

## Development

### Dependencies

This template relies on Node.js v16.14+ and `pnpm` (v9). Install `pnpm` using:
```bash
sudo npm i -g pnpm@9