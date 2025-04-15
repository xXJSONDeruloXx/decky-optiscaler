import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  DropdownItem,
  ConfirmModal,
  showModal
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
        </>
      ) : null}
    </PanelSection>
  );
}

export default definePlugin(() => ({
  name: "Framegen Plugin",
  titleView: <div>Decky Optiscaler</div>,
  alwaysRender: true,
  content: (
    <>
      <FGModInstallerSection />
      <InstalledGamesSection />
    </>
  ),
  icon: <RiAiGenerate />,
  onDismount() {
    console.log("Framegen Plugin unmounted");
  },
}));
