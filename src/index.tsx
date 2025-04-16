import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  DropdownItem,
  ConfirmModal,
  showModal,
  SliderField,
  TextField,
  ToggleField,
  Tabs
} from "@decky/ui";
import { definePlugin, callable } from "@decky/api";
import { RiAiGenerate } from "react-icons/ri";

const runInstallFGMod = callable<
  [],
  { status: string; message?: string; output?: string }
>("run_install_fgmod");

const runUninstallFGMod = callable<
  [],
  { status: string; message?: string; output?: string }
>("run_uninstall_fgmod");

const checkFGModPath = callable<
  [],
  { exists: boolean }
>("check_fgmod_path");

const checkOptiScalerPath = callable<
  [],
  { exists: boolean; version: string }
>("check_optiscaler_path");

const listInstalledGames = callable<
  [],
  { status: string; games: { appid: string; name: string }[] }
>("list_installed_games");

const logError = callable<[string], void>("log_error");

const downloadLatestOptiScaler = callable<
  [],
  { 
    status: string; 
    message: string; 
    file_path?: string; 
    extract_path?: string;
    version?: string;
  }
>("download_optiscaler_nightly");

const getOptiScalerFGType = callable<[], { status: string; fgtype: string; message?: string }>("get_optiscaler_fgtype");
const setOptiScalerFGType = callable<[string], { status: string; message: string }>("set_optiscaler_fgtype");

const getOptiScalerSettings = callable<
  [string?],
  { status: string; settings: any; message?: string }
>("get_optiscaler_settings");

const setOptiScalerSetting = callable<
  [string, string, string],
  { status: string; message: string }
>("set_optiscaler_setting");

const setUpscalerType = callable<
  [string, string],
  { status: string; message: string }
>("set_upscaler_type");

const setOptiFGSettings = callable<
  [Record<string, any>],
  { status: string; message: string; details?: any[] }
>("set_optifg_settings");

const setFramerateLimit = callable<
  [string],
  { status: string; message: string }
>("set_framerate_limit");

const setQualityRatioOverride = callable<
  [boolean, Record<string, any>?],
  { status: string; message: string; details?: any[] }
>("set_quality_ratio_override");

const setMenuSettings = callable<
  [Record<string, any>],
  { status: string; message: string; details?: any[] }
>("set_menu_settings");

const setUpscaleRatioOverride = callable<
  [boolean, string?],
  { status: string; message: string }
>("set_upscale_ratio_override");

function FGModInstallerSection() {
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [installResult, setInstallResult] = useState<{
    status: string;
    output?: string;
    message?: string;
  } | null>(null);
  const [uninstallResult, setUninstallResult] = useState<{
    status: string;
    output?: string;
    message?: string;
  } | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [pathExists, setPathExists] = useState<boolean | null>(null);
  const [optiScalerExists, setOptiScalerExists] = useState<boolean | null>(null);
  const [optiScalerVersion, setOptiScalerVersion] = useState<string>("");

  useEffect(() => {
    const checkPath = async () => {
      try {
        const fgmodResult = await checkFGModPath();
        setPathExists(fgmodResult.exists);
        
        const optiResult = await checkOptiScalerPath();
        setOptiScalerExists(optiResult.exists);
        setOptiScalerVersion(optiResult.version);
      } catch (e) {
        logError('useEffect -> checkPath' + String(e));
        console.error(e);
      }
    };
    checkPath(); // Initial check
    const intervalId = setInterval(checkPath, 3000); // Check every 3 seconds
    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    if (installResult) {
      const timer = setTimeout(() => {
        setInstallResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return () => {}; // Ensure a cleanup function is always returned
  }, [installResult]);

  useEffect(() => {
    if (uninstallResult) {
      const timer = setTimeout(() => {
        setUninstallResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [uninstallResult]);

  useEffect(() => {
    if (downloadStatus) {
      const timer = setTimeout(() => setDownloadStatus(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicitly return undefined for all code paths
  }, [downloadStatus]);

  const handleInstallClick = async () => {
    try {
      setInstalling(true);
      
      // First, install FGMod
      console.log("Installing FGMod...");
      const fgmodResult = await runInstallFGMod();
      
      // Log but don't update UI yet, as we have more to do
      console.log("FGMod installation result:", fgmodResult);
      
      // If FGMod installation succeeded, download OptiScaler as well
      if (fgmodResult.status === "success") {
        console.log("FGMod installed, now downloading OptiScaler...");
        
        // Show temporary notification that we're downloading OptiScaler
        setInstallResult({
          status: "success",
          output: "FGMod installed successfully, now downloading OptiScaler..."
        });
        
        // Download OptiScaler
        const optiResult = await downloadLatestOptiScaler();
        console.log("OptiScaler download result:", optiResult);
        
        // Update UI with combined result
        setInstallResult({
          status: "success",
          output: `FGMod installed. OptiScaler ${optiResult.status === "success" ? "also installed" : "download had issues"}. ${optiResult.version ? `(Version: ${optiResult.version})` : ""}`
        });
      } else {
        // Just show the FGMod result if it failed
        setInstallResult(fgmodResult);
      }
    } catch (e) {
      logError('handleInstallClick: ' + String(e));
      console.error(e);
      setInstallResult({
        status: "error",
        message: String(e)
      });
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstallClick = async () => {
    try {
      setUninstalling(true);
      const result = await runUninstallFGMod();
      setUninstallResult(result);
    } catch (e) {
      logError('handleUninstallClick: ' + String(e));
      console.error(e);
      setUninstallResult({
        status: "error",
        message: String(e)
      });
    } finally {
      setUninstalling(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      console.log("Starting OptiScaler download...");
      
      const result = await downloadLatestOptiScaler();
      
      console.log("Download complete:", result);
      
      setDownloadStatus({
        success: result.status === "success" || result.status === "partial_success",
        message: result.message + (result.version ? ` (${result.version})` : "")
      });
    } catch (error) {
      console.error("Download failed:", error);
      logError(`Download error: ${String(error)}`);
      setDownloadStatus({
        success: false,
        message: `Error: ${String(error)}`
      });
    } finally {
      setIsDownloading(false);
    }
  };



  return (
    <PanelSection>
      {pathExists !== null ? (
        <PanelSectionRow>
          <div style={{ color: pathExists ? "green" : "red" }}>
            {pathExists ? "Mod Is Installed" : "Mod Not Installed"}
          </div>
        </PanelSectionRow>
      ) : null}
      
      {/* Add OptiScaler status indicator */}
      {optiScalerExists !== null ? (
        <PanelSectionRow>
          <div style={{ color: optiScalerExists ? "green" : "red" }}>
            {optiScalerExists 
              ? `Current OptiScaler Version: ${optiScalerVersion}` 
              : "OptiScaler Not Installed"}
          </div>
        </PanelSectionRow>
      ) : null}
      
      {pathExists === false ? (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleInstallClick} disabled={installing}>
            {installing ? "Installing..." : "Install Mod Files"}
          </ButtonItem>
        </PanelSectionRow>
      ) : null}
      {pathExists === true ? (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleUninstallClick} disabled={uninstalling}>
            {uninstalling ? "Uninstalling..." : "Uninstall Mod Files"}
          </ButtonItem>
        </PanelSectionRow>
      ) : null}      
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={handleDownload} 
          disabled={isDownloading}
        >
          {isDownloading ? "Downloading..." : "Update OptiScaler Nightly"}
        </ButtonItem>
        
        {downloadStatus && (
          <div style={{ 
            marginTop: '8px',
            padding: '10px',
            backgroundColor: downloadStatus.success ? 'rgba(0, 128, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
            borderRadius: '4px'
          }}>
            <strong>{downloadStatus.success ? 'Success:' : 'Error:'}</strong> {downloadStatus.message}
          </div>
        )}
      </PanelSectionRow>
      {installResult ? (
        <PanelSectionRow>
          <div>
            <strong>Status:</strong>{" "}
            {installResult.status === "success" ? "Success" : "Error"}
            <br />
            {installResult.output ? (
              <>
                <strong>Output:</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>{installResult.output}</pre>
              </>
            ) : null}
            {installResult.message ? (
              <>
                <strong>Error:</strong> {installResult.message}
              </>
            ) : null}
          </div>
        </PanelSectionRow>
      ) : null}
      {uninstallResult ? (
        <PanelSectionRow>
          <div>
            <strong>Status:</strong>{" "}
            {uninstallResult.status === "success" ? "Success" : "Error"}
            <br />
            {uninstallResult.output ? (
              <>
                <strong>Output:</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>{uninstallResult.output}</pre>
              </>
            ) : null}
            {uninstallResult.message ? (
              <>
                <strong>Error:</strong> {uninstallResult.message}
              </>
            ) : null}
          </div>
        </PanelSectionRow>
      ) : null}
      <PanelSectionRow>
        <div>
          Install the mod above, then select and patch a game below to enable DLSS in the game's menu.
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}

function OptiScalerFGTypeSection() {
  const [fgType, setFgType] = useState<string>("unknown");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const fetchFGType = async () => {
    try {
      const result = await getOptiScalerFGType();
      if (result.status === "success") {
        setFgType(result.fgtype);
      } else {
        setFgType("unknown");
        console.error("Failed to get FGType:", result.message);
      }
    } catch (error) {
      logError(`Error fetching FGType: ${String(error)}`);
      console.error("Error fetching FGType:", error);
      setFgType("unknown");
    }
  };

  useEffect(() => {
    // Initially fetch FGType when component mounts
    fetchFGType();
    
    // Set up interval to refresh every 3 seconds
    const intervalId = setInterval(fetchFGType, 3000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (updateMessage) {
      const timer = setTimeout(() => setUpdateMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [updateMessage]);

  const handleSetFGType = async (type: string) => {
    setIsUpdating(true);
    try {
      const result = await setOptiScalerFGType(type);
      if (result.status === "success") {
        setUpdateMessage(`Successfully set FGType to ${type}`);
        fetchFGType(); // Refresh immediately
      } else {
        setUpdateMessage(`Failed to set FGType: ${result.message}`);
      }
    } catch (error) {
      logError(`Error setting FGType: ${String(error)}`);
      console.error("Error setting FGType:", error);
      setUpdateMessage(`Error: ${String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getFGTypeDescription = () => {
    switch (fgType) {
      case "auto":
        return "Default setting (usually falls back to nofg)";
      case "nofg":
        return "No frame generation";
      case "optifg":
        return "AMD FidelityFX frame generation";
      case "nukems":
        return "Nukem9's DLSS-to-FSR3 implementation";
      default:
        return "Unknown setting";
    }
  };

  return (
    <PanelSection title="OptiScaler Frame Generation Settings">
      <PanelSectionRow>
        <div style={{ 
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Current FGType: <span style={{ color: fgType === "unknown" ? "red" : "green" }}>{fgType}</span>
          </div>
          <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
            {getFGTypeDescription()}
          </div>
        </div>
      </PanelSectionRow>
      
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => handleSetFGType("auto")}
          disabled={isUpdating || fgType === "auto"}
        >
          Set to Auto
        </ButtonItem>
        <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
          Default setting, lets OptiScaler decide
        </div>
      </PanelSectionRow>
      
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => handleSetFGType("optifg")}
          disabled={isUpdating || fgType === "optifg"}
        >
          Set to OptiFG
        </ButtonItem>
        <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
          AMD FidelityFX frame generation (requires amd_fidelityfx_dx12.dll)
        </div>
      </PanelSectionRow>
      
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => handleSetFGType("nukems")}
          disabled={isUpdating || fgType === "nukems"}
        >
          Set to Nukems
        </ButtonItem>
        <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
          Nukem9's DLSS-to-FSR3 implementation (recommended)
        </div>
      </PanelSectionRow>
      
      {updateMessage && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateMessage.includes("Failed") || updateMessage.includes("Error") 
              ? 'rgba(255, 0, 0, 0.2)' 
              : 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateMessage}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function InstalledGamesSection() {
  const [games, setGames] = useState<{ appid: number; name: string }[]>([]);
  const [selectedGame, setSelectedGame] = useState<{ appid: number; name: string } | null>(null);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await listInstalledGames();
        if (response.status === "success") {
          const sortedGames = [...response.games]
            .map(game => ({
              ...game,
              appid: parseInt(game.appid, 10),
            }))
            .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
          setGames(sortedGames);
        } else {
          logError('fetchGames: ' + JSON.stringify(response));
          console.error('fetchGames: ' + JSON.stringify(response));
        }
      } catch (error) {
        logError("Error fetching games:" + String(error));
        console.error("Error fetching games:", String(error));
      }
    };
    fetchGames();
  }, []);

  const handlePatchClick = async () => {
    if (!selectedGame) return;

    // Show confirmation modal
    showModal(
      <ConfirmModal 
        strTitle={`Patch ${selectedGame.name}?`}
        strDescription={
          "WARNING: Decky Framegen does not unpatch games when uninstalled. Be sure to unpatch the game or verify the integrity of your game files if you choose to uninstall the plugin or the game has issues."
        }
        strOKButtonText="Yeah man, I wanna do it"
        strCancelButtonText="Cancel"
        onOK={async () => {
          try {
            await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, '~/fgmod/fgmod %COMMAND%');
            setResult(`Launch options set for ${selectedGame.name}. You can now select DLSS in the game's menu.`);
          } catch (error) {
            logError('handlePatchClick: ' + String(error));
            setResult(error instanceof Error ? `Error setting launch options: ${error.message}` : 'Error setting launch options');
          }
        }}
      />
    );
  };

  const handleUnpatchClick = async () => {
    if (!selectedGame) return;

    try {
      await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, '~/fgmod/fgmod-uninstaller.sh %COMMAND%');
      setResult(`DLSS mods will uninstall on next launch of ${selectedGame.name}.`);
    } catch (error) {
      logError('handleUnpatchClick: ' + String(error));
      setResult(error instanceof Error ? `Error clearing launch options: ${error.message}` : 'Error clearing launch options');
    }
  };

  return (
    <PanelSection title="Select a game to patch:">
      <PanelSectionRow>
        <DropdownItem
          rgOptions={games.map(game => ({
            data: game.appid,
            label: game.name
          }))}
          selectedOption={selectedGame?.appid}
          onChange={(option) => {
            const game = games.find(g => g.appid === option.data);
            setSelectedGame(game || null);
            setResult('');
          }}
          strDefaultLabel="Select a game..."
          menuLabel="Installed Games"
        />
      </PanelSectionRow>

      {result ? (
        <PanelSectionRow>
          <div style={{ 
            padding: '12px',
            marginTop: '16px',
            backgroundColor: 'var(--decky-selected-ui-bg)',
            borderRadius: '4px'
          }}>
            {result}
          </div>
        </PanelSectionRow>
      ) : null}
      
      {selectedGame ? (
        <>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handlePatchClick}
            >
              Patch
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleUnpatchClick}
            >
              Unpatch
            </ButtonItem>
          </PanelSectionRow>
          
          {/* OptiScaler Patching Options */}
          <PanelSectionRow>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
              OptiScaler Patching Options:
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                try {
                  await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, 'DLL=dxgi.dll ~/opti/opti.sh %COMMAND%');
                  setResult(`OptiScaler (dxgi.dll) set for ${selectedGame.name}`);
                } catch (error) {
                  logError('handleOptiPatchClick: ' + String(error));
                  setResult(`Error setting OptiScaler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              Opti-Patch (dxgi.dll)
            </ButtonItem>
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              Default and most broadly compatible option.
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                try {
                  await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, 'DLL=winmm.dll ~/opti/opti.sh %COMMAND%');
                  setResult(`OptiScaler (winmm.dll) set for ${selectedGame.name}`);
                } catch (error) {
                  logError('handleOptiPatchClick: ' + String(error));
                  setResult(`Error setting OptiScaler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              Opti-Patch (winmm.dll)
            </ButtonItem>
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              Often works better with Unity/Unreal games when dxgi fails.
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                try {
                  await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, 'DLL=dbghelp.dll ~/opti/opti.sh %COMMAND%');
                  setResult(`OptiScaler (dbghelp.dll) set for ${selectedGame.name}`);
                } catch (error) {
                  logError('handleOptiPatchClick: ' + String(error));
                  setResult(`Error setting OptiScaler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              Opti-Patch (dbghelp.dll)
            </ButtonItem>
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              Alternative for older DX9/DX11 games.
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                try {
                  await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, 'DLL=version.dll ~/opti/opti.sh %COMMAND%');
                  setResult(`OptiScaler (version.dll) set for ${selectedGame.name}`);
                } catch (error) {
                  logError('handleOptiPatchClick: ' + String(error));
                  setResult(`Error setting OptiScaler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              Opti-Patch (version.dll)
            </ButtonItem>
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              Used by some older mod loaders and ASI-based tools.
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                try {
                  await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, 'DLL=wininet.dll ~/opti/opti.sh %COMMAND%');
                  setResult(`OptiScaler (wininet.dll) set for ${selectedGame.name}`);
                } catch (error) {
                  logError('handleOptiPatchClick: ' + String(error));
                  setResult(`Error setting OptiScaler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              Opti-Patch (wininet.dll)
            </ButtonItem>
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              Useful if winmm or version conflict with the game.
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                try {
                  await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, 'DLL=winhttp.dll ~/opti/opti.sh %COMMAND%');
                  setResult(`OptiScaler (winhttp.dll) set for ${selectedGame.name}`);
                } catch (error) {
                  logError('handleOptiPatchClick: ' + String(error));
                  setResult(`Error setting OptiScaler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              Opti-Patch (winhttp.dll)
            </ButtonItem>
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              Another alternative when others inject too early or late.
            </div>
          </PanelSectionRow>
        </>
      ) : null}
    </PanelSection>
  );
}

// Components for OptiScaler Settings
function UpscalersSettingsSection() {
  const [settings, setSettings] = useState({
    Dx11Upscaler: "auto",
    Dx12Upscaler: "auto", 
    VulkanUpscaler: "auto"
  });
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const result = await getOptiScalerSettings("Upscalers");
        if (result.status === "success") {
          setSettings(result.settings);
        } else {
          console.error("Failed to load Upscalers settings:", result.message);
        }
      } catch (error) {
        console.error("Error loading Upscalers settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle setting updates
  const handleUpscalerChange = async (type: string, value: string) => {
    try {
      const result = await setUpscalerType(type, value);
      if (result.status === "success") {
        setSettings(prev => ({ ...prev, [type]: value }));
        setUpdateMessage(`Updated ${type} to ${value}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  // Define options for each upscaler type
  const dx11Options = [
    { data: "auto", label: "Auto (defaults to fsr22)" },
    { data: "fsr22", label: "FSR 2.2 (native DX11)" },
    { data: "fsr31", label: "FSR 3.1 (native DX11)" },
    { data: "xess", label: "XeSS (with DX12)" },
    { data: "fsr21_12", label: "FSR 2.1 (DX11 with DX12)" },
    { data: "fsr22_12", label: "FSR 2.2 (DX11 with DX12)" },
    { data: "fsr31_12", label: "FSR 3.1 (DX11 with DX12)" },
    { data: "dlss", label: "DLSS" }
  ];

  const dx12Options = [
    { data: "auto", label: "Auto (defaults to xess)" },
    { data: "xess", label: "XeSS" },
    { data: "fsr21", label: "FSR 2.1" },
    { data: "fsr22", label: "FSR 2.2" },
    { data: "fsr31", label: "FSR 3.1" },
    { data: "dlss", label: "DLSS" }
  ];

  const vulkanOptions = [
    { data: "auto", label: "Auto (defaults to fsr21)" },
    { data: "fsr21", label: "FSR 2.1" },
    { data: "fsr22", label: "FSR 2.2" },
    { data: "fsr31", label: "FSR 3.1" },
    { data: "dlss", label: "DLSS" }
  ];

  if (loading) {
    return (
      <PanelSection title="Upscalers">
        <PanelSectionRow>
          <div>Loading settings...</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="Upscalers">
      <PanelSectionRow>
        <DropdownItem
          label="DirectX 11 Upscaler"
          description="Select the upscaler to use for DX11 games"
          rgOptions={dx11Options}
          selectedOption={settings.Dx11Upscaler || "auto"}
          onChange={(option) => handleUpscalerChange("Dx11Upscaler", option.data)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <DropdownItem
          label="DirectX 12 Upscaler"
          description="Select the upscaler to use for DX12 games"
          rgOptions={dx12Options}
          selectedOption={settings.Dx12Upscaler || "auto"}
          onChange={(option) => handleUpscalerChange("Dx12Upscaler", option.data)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <DropdownItem
          label="Vulkan Upscaler"
          description="Select the upscaler to use for Vulkan games"
          rgOptions={vulkanOptions}
          selectedOption={settings.VulkanUpscaler || "auto"}
          onChange={(option) => handleUpscalerChange("VulkanUpscaler", option.data)}
        />
      </PanelSectionRow>

      {updateMessage && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateMessage.includes("Error") ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateMessage}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function OptiFGSettingsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const result = await getOptiScalerSettings("OptiFG");
        if (result.status === "success") {
          setSettings(result.settings);
        } else {
          console.error("Failed to load OptiFG settings:", result.message);
        }
      } catch (error) {
        console.error("Error loading OptiFG settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle setting updates
  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      const strValue = value ? "true" : "false";
      const result = await setOptiScalerSetting("OptiFG", key, strValue);
      
      if (result.status === "success") {
        setSettings(prev => ({ ...prev, [key]: strValue }));
        setUpdateMessage(`Updated ${key} to ${strValue}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  const handleTextSetting = async (key: string, value: React.ChangeEvent<HTMLInputElement> | string) => {
    try {
      // Extract string value from event if needed
      const strValue = typeof value === 'string' ? value : value.target.value;
      
      const result = await setOptiScalerSetting("OptiFG", key, strValue);
      
      if (result.status === "success") {
        setSettings(prev => ({ ...prev, [key]: strValue }));
        setUpdateMessage(`Updated ${key} to ${strValue}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  const getBooleanValue = (key: string): boolean => {
    const value = settings[key];
    if (value === "true") return true;
    if (value === "false") return false;
    // Default to false for any other value
    return false;
  };

  if (loading) {
    return (
      <PanelSection title="OptiFG Settings">
        <PanelSectionRow>
          <div>Loading settings...</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="OptiFG Settings">
      <PanelSectionRow>
        <ToggleField
          label="Enabled"
          description="Enables FSR3.1 frame generation"
          checked={getBooleanValue("Enabled")}
          onChange={(value) => handleToggleSetting("Enabled", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="High Priority"
          description="Creates FG CommandQueue with _PRIORITY_HIGH flag"
          checked={getBooleanValue("HighPriority")}
          onChange={(value) => handleToggleSetting("HighPriority", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Debug View"
          description="Enables FSR3.1 frame generation debug view"
          checked={getBooleanValue("DebugView")}
          onChange={(value) => handleToggleSetting("DebugView", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Async"
          description="Enables async FSR3.1 frame generation"
          checked={getBooleanValue("AllowAsync")}
          onChange={(value) => handleToggleSetting("AllowAsync", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="HUD Fix"
          description="Enables HUD fix for FSR3.1 frame generation (may cause crashes)"
          checked={getBooleanValue("HUDFix")}
          onChange={(value) => handleToggleSetting("HUDFix", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <TextField
          label="HUD Limit"
          description="Delays HUDless image capture (integer > 0)"
          value={settings.HUDLimit || "auto"}
          onChange={(value) => handleTextSetting("HUDLimit", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="HUD Fix Extended"
          description="Extended HUDless checks for more image formats"
          checked={getBooleanValue("HUDFixExtended")}
          onChange={(value) => handleToggleSetting("HUDFixExtended", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="HUD Fix Immediate"
          description="Captures resources before shader execution"
          checked={getBooleanValue("HUDFixImmadiate")}
          onChange={(value) => handleToggleSetting("HUDFixImmadiate", value)}
        />
      </PanelSectionRow>

      {updateMessage && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateMessage.includes("Error") ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateMessage}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function FramerateLimitSection() {
  const [frameLimit, setFrameLimit] = useState("auto");
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const result = await getOptiScalerSettings("Framerate");
        if (result.status === "success") {
          setFrameLimit(result.settings.FramerateLimit || "auto");
        } else {
          console.error("Failed to load Framerate settings:", result.message);
        }
      } catch (error) {
        console.error("Error loading Framerate settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle setting updates
  const handleFramerateLimitChange = async (value: string | React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Extract string value from event if needed
      const strValue = typeof value === 'string' ? value : value.target.value;
      
      const result = await setFramerateLimit(strValue);
      
      if (result.status === "success") {
        setFrameLimit(strValue);
        setUpdateMessage(`Updated framerate limit to ${strValue}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating framerate limit:", error);
      setUpdateMessage(`Error updating framerate limit: ${String(error)}`);
    }
  };

  const framerateLimitOptions = [
    { data: "auto", label: "Auto (disabled)" },
    { data: "30.0", label: "30 FPS" },
    { data: "40.0", label: "40 FPS" },
    { data: "45.0", label: "45 FPS" },
    { data: "60.0", label: "60 FPS" },
    { data: "72.0", label: "72 FPS" },
    { data: "90.0", label: "90 FPS" },
    { data: "120.0", label: "120 FPS" },
    { data: "144.0", label: "144 FPS" }
  ];

  if (loading) {
    return (
      <PanelSection title="Framerate Limit">
        <PanelSectionRow>
          <div>Loading settings...</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="Framerate Limit">
      <PanelSectionRow>
        <div style={{ padding: '10px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '4px', marginBottom: '10px' }}>
          This setting uses Reflex, so the game must support it. AMD users need fakenvapi to use this feature.
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <DropdownItem
          label="Framerate Limit"
          description="Limit the game's framerate (using Reflex)"
          rgOptions={framerateLimitOptions}
          selectedOption={frameLimit}
          onChange={(option) => handleFramerateLimitChange(option.data)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <TextField
          label="Custom Limit"
          description="Enter a custom framerate limit (e.g., 50.0)"
          value={frameLimit !== "auto" && !framerateLimitOptions.some(opt => opt.data === frameLimit) ? frameLimit : ""}
          onChange={(value) => {
            if (value.target.value.trim() === "") {
              handleFramerateLimitChange("auto");
            } else {
              handleFramerateLimitChange(value);
            }
          }}
        />
      </PanelSectionRow>

      {updateMessage && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateMessage.includes("Error") ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateMessage}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function MenuSettingsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const result = await getOptiScalerSettings("Menu");
        if (result.status === "success") {
          setSettings(result.settings);
        } else {
          console.error("Failed to load Menu settings:", result.message);
        }
      } catch (error) {
        console.error("Error loading Menu settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle setting updates
  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      const strValue = value ? "true" : "false";
      const result = await setOptiScalerSetting("Menu", key, strValue);
      
      if (result.status === "success") {
        setSettings(prev => ({ ...prev, [key]: strValue }));
        setUpdateMessage(`Updated ${key} to ${strValue}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  const handleTextSetting = async (key: string, value: React.ChangeEvent<HTMLInputElement> | string) => {
    try {
      // Extract string value from event if needed
      const strValue = typeof value === 'string' ? value : value.target.value;
      
      const result = await setOptiScalerSetting("Menu", key, strValue);
      
      if (result.status === "success") {
        setSettings(prev => ({ ...prev, [key]: strValue }));
        setUpdateMessage(`Updated ${key} to ${strValue}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  const getBooleanValue = (key: string): boolean => {
    const value = settings[key];
    if (value === "true") return true;
    if (value === "false") return false;
    // Default to false for any other value
    return false;
  };

  if (loading) {
    return (
      <PanelSection title="In-Game Menu Settings">
        <PanelSectionRow>
          <div>Loading settings...</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="In-Game Menu Settings">
      <PanelSectionRow>
        <ToggleField
          label="Overlay Menu"
          description="Enables ImGui overlay menu (disabling will also disable frame generation)"
          checked={getBooleanValue("OverlayMenu")}
          onChange={(value) => handleToggleSetting("OverlayMenu", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <TextField
          label="Menu Scale"
          description="In-game ImGui menu scale (1.0 to 2.0)"
          value={settings.Scale || "auto"}
          onChange={(value) => handleTextSetting("Scale", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <TextField
          label="Shortcut Key"
          description="Virtual key code for menu toggle (default: 45 = Insert)"
          value={settings.ShortcutKey || "auto"}
          onChange={(value) => handleTextSetting("ShortcutKey", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Extended Limits"
          description="Extends scaling ratio limits to 0.1 - 6.0"
          checked={getBooleanValue("ExtendedLimits")}
          onChange={(value) => handleToggleSetting("ExtendedLimits", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Use HQ Font"
          description="Use high quality font for menu"
          checked={getBooleanValue("UseHQFont")}
          onChange={(value) => handleToggleSetting("UseHQFont", value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Show FPS"
          description="Enables FPS overlay"
          checked={getBooleanValue("ShowFps")}
          onChange={(value) => handleToggleSetting("ShowFps", value)}
        />
      </PanelSectionRow>

      {updateMessage && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateMessage.includes("Error") ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateMessage}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function QualityRatioOverrideSection() {
  const [enabled, setEnabled] = useState(false);
  const [ratios, setRatios] = useState({
    DLAA: "1.0",
    UltraQuality: "1.3",
    Quality: "1.5",
    Balanced: "1.7",
    Performance: "2.0",
    UltraPerformance: "3.0"
  });
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const result = await getOptiScalerSettings("QualityOverrides");
        if (result.status === "success") {
          setEnabled(result.settings.QualityRatioOverrideEnabled === "true");
          
          const newRatios = { ...ratios };
          if (result.settings.QualityRatioDLAA) newRatios.DLAA = result.settings.QualityRatioDLAA;
          if (result.settings.QualityRatioUltraQuality) newRatios.UltraQuality = result.settings.QualityRatioUltraQuality;
          if (result.settings.QualityRatioQuality) newRatios.Quality = result.settings.QualityRatioQuality;
          if (result.settings.QualityRatioBalanced) newRatios.Balanced = result.settings.QualityRatioBalanced;
          if (result.settings.QualityRatioPerformance) newRatios.Performance = result.settings.QualityRatioPerformance;
          if (result.settings.QualityRatioUltraPerformance) newRatios.UltraPerformance = result.settings.QualityRatioUltraPerformance;
          
          setRatios(newRatios);
        } else {
          console.error("Failed to load Quality Override settings:", result.message);
        }
      } catch (error) {
        console.error("Error loading Quality Override settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle setting updates
  const handleToggleOverride = async (value: boolean) => {
    try {
      const result = await setQualityRatioOverride(value);
      
      if (result.status === "success" || result.status === "partial_success") {
        setEnabled(value);
        setUpdateMessage(`${value ? "Enabled" : "Disabled"} quality ratio override`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating quality ratio override:", error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  const handleRatioChange = async (mode: string, value: string | React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Extract string value from event if needed
      const strValue = typeof value === 'string' ? value : value.target.value;
      
      // Update local state first
      const newRatios = { ...ratios, [mode]: strValue };
      setRatios(newRatios);
      
      // Update the backend
      const result = await setQualityRatioOverride(enabled, newRatios);
      
      if (result.status === "success" || result.status === "partial_success") {
        setUpdateMessage(`Updated ${mode} ratio to ${strValue}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error updating ${mode} ratio:`, error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  if (loading) {
    return (
      <PanelSection title="Quality Ratio Override">
        <PanelSectionRow>
          <div>Loading settings...</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="Quality Ratio Override">
      <PanelSectionRow>
        <ToggleField
          label="Enable Quality Ratio Override"
          description="Override the default upscale ratios for each quality mode"
          checked={enabled}
          onChange={handleToggleOverride}
        />
      </PanelSectionRow>

      {enabled && (
        <>
          <PanelSectionRow>
            <TextField
              label="DLAA"
              description="Custom ratio for DLAA mode"
              value={ratios.DLAA}
              onChange={(value) => handleRatioChange("DLAA", value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField
              label="Ultra Quality"
              description="Custom ratio for Ultra Quality mode"
              value={ratios.UltraQuality}
              onChange={(value) => handleRatioChange("UltraQuality", value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField
              label="Quality"
              description="Custom ratio for Quality mode"
              value={ratios.Quality}
              onChange={(value) => handleRatioChange("Quality", value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField
              label="Balanced"
              description="Custom ratio for Balanced mode"
              value={ratios.Balanced}
              onChange={(value) => handleRatioChange("Balanced", value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField
              label="Performance"
              description="Custom ratio for Performance mode"
              value={ratios.Performance}
              onChange={(value) => handleRatioChange("Performance", value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField
              label="Ultra Performance"
              description="Custom ratio for Ultra Performance mode"
              value={ratios.UltraPerformance}
              onChange={(value) => handleRatioChange("UltraPerformance", value)}
            />
          </PanelSectionRow>
        </>
      )}

      {updateMessage && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateMessage.includes("Error") ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateMessage}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function UpscaleRatioSection() {
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState("1.3");
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const result = await getOptiScalerSettings("UpscaleRatio");
        if (result.status === "success") {
          setEnabled(result.settings.UpscaleRatioOverrideEnabled === "true");
          if (result.settings.UpscaleRatioOverrideValue) {
            setValue(result.settings.UpscaleRatioOverrideValue);
          }
        } else {
          console.error("Failed to load Upscale Ratio settings:", result.message);
        }
      } catch (error) {
        console.error("Error loading Upscale Ratio settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle setting updates
  const handleToggleOverride = async (toggleValue: boolean) => {
    try {
      const result = await setUpscaleRatioOverride(toggleValue, value);
      
      if (result.status === "success" || result.status === "partial_success") {
        setEnabled(toggleValue);
        setUpdateMessage(`${toggleValue ? "Enabled" : "Disabled"} upscale ratio override`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating upscale ratio override:", error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  const handleValueChange = async (newValue: string | React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Extract string value from event if needed
      const strValue = typeof newValue === 'string' ? newValue : newValue.target.value;
      
      setValue(strValue);
      
      if (enabled) {
        const result = await setUpscaleRatioOverride(true, strValue);
        
        if (result.status === "success" || result.status === "partial_success") {
          setUpdateMessage(`Updated upscale ratio to ${strValue}`);
          
          // Clear success message after 3 seconds
          setTimeout(() => setUpdateMessage(null), 3000);
        } else {
          setUpdateMessage(`Error: ${result.message}`);
        }
      }
    } catch (error) {
      console.error("Error updating upscale ratio value:", error);
      setUpdateMessage(`Error updating setting: ${String(error)}`);
    }
  };

  if (loading) {
    return (
      <PanelSection title="Upscale Ratio Override">
        <PanelSectionRow>
          <div>Loading settings...</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="Upscale Ratio Override">
      <PanelSectionRow>
        <ToggleField
          label="Enable Upscale Ratio Override"
          description="Force a specific upscale ratio for all quality modes"
          checked={enabled}
          onChange={handleToggleOverride}
        />
      </PanelSectionRow>

      {enabled && (
        <PanelSectionRow>
          <TextField
            label="Upscale Ratio"
            description="The fixed upscale ratio to use (default: 1.3)"
            value={value}
            onChange={handleValueChange}
          />
        </PanelSectionRow>
      )}

      {updateMessage && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateMessage.includes("Error") ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateMessage}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function OptiScalerSettingsTabs() {
  // State to track which settings panel is currently displayed
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<string | null>(null);

  // Function to render the active settings panel
  const renderActivePanel = () => {
    switch (activeSettingsPanel) {
      case "upscalers":
        return <UpscalersSettingsSection />;
      case "optifg":
        return <OptiFGSettingsSection />;
      case "framerate":
        return <FramerateLimitSection />;
      case "menu":
        return <MenuSettingsSection />;
      case "quality":
        return (
          <>
            <QualityRatioOverrideSection />
            <UpscaleRatioSection />
          </>
        );
      default:
        return null;
    }
  };

  // If a settings panel is active, show it with a back button
  if (activeSettingsPanel) {
    return (
      <PanelSection title={`OptiScaler ${activeSettingsPanel.charAt(0).toUpperCase() + activeSettingsPanel.slice(1)} Settings`}>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => setActiveSettingsPanel(null)}
          >
            Back to Settings Menu
          </ButtonItem>
        </PanelSectionRow>
        
        {renderActivePanel()}
      </PanelSection>
    );
  }

  // Otherwise show the main settings menu
  return (
    <PanelSection title="OptiScaler Settings">
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={() => setActiveSettingsPanel("upscalers")}
        >
          Upscalers Settings
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={() => setActiveSettingsPanel("optifg")}
        >
          OptiFG Settings
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={() => setActiveSettingsPanel("framerate")}
        >
          FPS Limit Settings
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={() => setActiveSettingsPanel("menu")}
        >
          Menu Settings
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={() => setActiveSettingsPanel("quality")}
        >
          Quality Settings
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => {
  return {
    name: "Framegen Plugin",
    titleView: <div>Decky Optiscaler</div>,
    alwaysRender: true,
    content: (
      <>
        <FGModInstallerSection />
        <OptiScalerFGTypeSection />
        <OptiScalerSettingsTabs />
        <InstalledGamesSection />
      </>
    ),
    icon: <RiAiGenerate />,
    onDismount() {
      console.log("Framegen Plugin unmounted");
    },
  };
});
