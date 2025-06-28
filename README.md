# Decky OptiScaler Plugin

A comprehensive Steam Deck plugin that brings advanced upscaling and frame generation to your games using the latest OptiScaler bleeding-edge builds. Enables FSR 3.1, DLSS, XeSS upscaling and frame generation on any compatible GPU - all from Game Mode with full gamepad support.

<img width="681" alt="image" src="https://github.com/user-attachments/assets/99e1f9d7-ee82-465e-871d-b87297d02f02" />

## Features

### 🚀 **Core Functionality**
- **One-Click Installation**: Automatically download and install the latest OptiScaler bleeding-edge builds from GitHub
- **Smart Game Patching**: Advanced per-game DLL injection with 6 different injection methods for maximum compatibility
- **Steam Library Integration**: Browse your entire Steam library and patch games directly from the plugin interface
- **Intelligent File Management**: Automatic backup of original game DLLs and seamless restoration capabilities

### 🎮 **Advanced Game Support**
- **Multiple DLL Injection Methods**: Full support for `dxgi.dll`, `winmm.dll`, `dbghelp.dll`, `version.dll`, `wininet.dll`, `winhttp.dll`
- **Game-Specific Optimizations**: Built-in launcher detection and path resolution for popular titles:
  - Cyberpunk 2077 (REDprelauncher bypass)
  - The Witcher 3 (launcher bypass with DX12 preference)  
  - HITMAN 3 / World of Assassination (direct retail executable)
  - SYNCED, 2K Games titles, and more
- **Unreal Engine Detection**: Automatic UE4/UE5 game detection with specialized handling
- **Compatibility Notes**: Each DLL method includes helpful descriptions for optimal game compatibility

### ⚙️ **Advanced OptiScaler Configuration**

#### **Frame Generation Control**
- **FGType Management**: Easy switching between frame generation modes:
  - `auto` - Default OptiScaler behavior
  - `nofg` - Disable frame generation entirely
  - `optifg` - AMD FidelityFX Frame Generation (FSR 3.1)
  - `nukems` - Nukem9's DLSS-to-FSR3 implementation (recommended)

#### **Upscaler Settings**
- **DirectX 11**: Full range from native FSR 2.2/3.1 to XeSS with DX12 fallback
- **DirectX 12**: XeSS, FSR 2.1/2.2/3.1, and native DLSS support
- **Vulkan**: Complete upscaler selection with auto-detection defaults

#### **OptiFG Frame Generation Settings**
- **Core Controls**: Enable/disable, high priority mode, debug view
- **Performance Tuning**: Async processing, HUD fix with multiple variants
- **Advanced Options**: HUD limit configuration, extended HUD checks, immediate capture mode

#### **Quality & Performance Controls**
- **Custom Quality Ratios**: Override upscaling ratios for all quality levels (DLAA, Ultra Quality, Quality, Balanced, Performance, Ultra Performance)
- **Upscale Ratio Override**: Fine-tune upscaling behavior with custom ratio settings
- **Frame Rate Limiting**: Built-in FPS limiter with configurable target rates

#### **In-Game Menu Configuration**
- **Overlay Controls**: Enable/disable ImGui overlay menu with customizable hotkeys
- **Menu Behavior**: Configure overlay appearance, positioning, and interaction settings

### 🛡️ **Safety & Recovery Features**
- **INI Preservation Toggle**: Optionally preserve user-modified OptiScaler.ini files between patches and updates
- **Nuclear Unpatch**: Emergency removal option that forcibly strips all mod files (requires Steam game verification)
- **Backup Management**: Automatic backup of original game DLLs with `.b` extension for safe restoration
- **Launch Option Cleanup**: Clean removal of all Steam launch options when unpatching games

### 🔧 **Technical Highlights**
- **Bleeding-Edge Builds**: Always downloads the latest OptiScaler builds from the official bleeding-edge repository
- **Pre-Built DLL Variants**: All injection DLLs are pre-generated and stored in a `renames` directory for instant deployment
- **Legacy Compatibility**: Seamless migration support for older FGMod installations
- **Plugin Auto-Update**: Built-in update checker with GitHub integration for plugin updates
- **Comprehensive Logging**: Detailed logging to `/tmp/opti-install.log` and system logs for troubleshooting
- **Wine Integration**: Proper WINEDLLOVERRIDES configuration for Steam Deck compatibility

## Credits

- Nukem9 for the DLSS to FSR3 mod: https://github.com/Nukem9/dlssg-to-fsr3

- Cdozdil for Optiscaler: https://github.com/cdozdil/OptiScaler

- FakeMichau for various tools leveraged in this script, including fgmod, innoextract and fakenvapi: https://github.com/FakeMichau

- Artur Graniszewski for DLSS Enabler: https://github.com/artur-graniszewski/DLSS-Enabler 

- Deck Wizard for making an awesome tutorial & demo video for the plugin beta here: https://www.youtube.com/watch?v=o_TkF-Eiq3M 

- Grown Up Gaming for creating a very early tutorial for the plugin beta here: https://www.youtube.com/watch?v=fGgc2CY6occ

- Steam Deck In Hand for making an awesome tutorial and showcase here: https://www.youtube.com/watch?v=vAuOUY8IyHE

- Davide Guidotti for his contributions to the plugin code: https://github.com/DGdev91

- the DLSS2FSR community for helping me get my head around all these tools and mods!
