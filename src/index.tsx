import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Router
} from "@decky/ui";
import { definePlugin, callable } from "@decky/api";
import { FaShip } from "react-icons/fa";

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

const listInstalledGames = callable<
  [],
  { status: string; games: { appid: string; name: string }[] }
>("list_installed_games");

function FGModInstallerSection() {
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
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
  const [pathExists, setPathExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPath = async () => {
      const result = await checkFGModPath();
      setPathExists(result.exists);
    };

    checkPath(); // Initial check

    const intervalId = setInterval(checkPath, 5000); // Check every 5 seconds

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

  const handleInstallClick = async () => {
    setInstalling(true);
    const result = await runInstallFGMod();
    setInstalling(false);
    setInstallResult(result);
  };

  const handleUninstallClick = async () => {
    setUninstalling(true);
    const result = await runUninstallFGMod();
    setUninstalling(false);
    setUninstallResult(result);
  };

  return (
    <PanelSection>
      {pathExists !== null && (
        <PanelSectionRow>
          <div style={{ color: pathExists ? "green" : "red" }}>
            {pathExists ? "Mod Is Installed" : "Mod Not Installed"}
          </div>
        </PanelSectionRow>
      )}
      {pathExists === false && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleInstallClick} disabled={installing}>
            {installing ? "Installing..." : "Install FG Mod"}
          </ButtonItem>
        </PanelSectionRow>
      )}
      {pathExists === true && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleUninstallClick} disabled={uninstalling}>
            {uninstalling ? "Uninstalling..." : "Uninstall FG Mod"}
          </ButtonItem>
        </PanelSectionRow>
      )}
      {installResult && (
        <PanelSectionRow>
          <div>
            <strong>Status:</strong>{" "}
            {installResult.status === "success" ? "Success" : "Error"}
            <br />
            {installResult.output && (
              <>
                <strong>Output:</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>{installResult.output}</pre>
              </>
            )}
            {installResult.message && (
              <>
                <strong>Error:</strong> {installResult.message}
              </>
            )}
          </div>
        </PanelSectionRow>
      )}
      {uninstallResult && (
        <PanelSectionRow>
          <div>
            <strong>Status:</strong>{" "}
            {uninstallResult.status === "success" ? "Success" : "Error"}
            <br />
            {uninstallResult.output && (
              <>
                <strong>Output:</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>{uninstallResult.output}</pre>
              </>
            )}
            {uninstallResult.message && (
              <>
                <strong>Error:</strong> {uninstallResult.message}
              </>
            )}
          </div>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <div>
          Once the mod is installed, launch your game, press the patch button, then restart the game!
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}

function MainRunningApp() {
  const mainRunningApp = Router.MainRunningApp;
  const [result, setResult] = useState<string | null>(null);
  const [isPatched, setIsPatched] = useState<boolean>(false);

  const checkLaunchOptions = async () => {
    if (mainRunningApp) {
      try {
        const currentOptions = await SteamClient.Apps.GetLaunchOptionsForApp(mainRunningApp.appid);
        setIsPatched(currentOptions.includes('/home/deck/fgmod/fgmod %COMMAND%'));
      } catch (error) {
        console.error('Error checking launch options:', error);
      }
    }
  };

  useEffect(() => {
    if (mainRunningApp) {
      checkLaunchOptions();
    }
  }, [mainRunningApp]);

  const handleSetLaunchOptions = async () => {
    if (mainRunningApp) {
      try {
        if (isPatched) {
          await SteamClient.Apps.SetAppLaunchOptions(mainRunningApp.appid, '');
          setResult(`Launch options cleared successfully. Restart the game to restore DLSS default files`);
        } else {
          await SteamClient.Apps.SetAppLaunchOptions(mainRunningApp.appid, '/home/deck/fgmod/fgmod %COMMAND%');
          setResult(`Launch options set successfully, restart the game to use FSR upscaling and frame gen via DLSS options.`);
        }
        setIsPatched(!isPatched);
      } catch (error) {
        if (error instanceof Error) {
          setResult(`Error setting launch options: ${error.message}`);
        } else {
          setResult('Error setting launch options');
        }
      }
    }
  };

  return (
    <PanelSection title="Game Patcher">
      <PanelSectionRow>
        <div>
          {mainRunningApp ? (
            <>
              <span>{isPatched ? `UnPatch: ${mainRunningApp.display_name}` : `Patch: ${mainRunningApp.display_name}`}</span>
              <ButtonItem layout="below" onClick={handleSetLaunchOptions}>
                {isPatched ? `UnPatch: ${mainRunningApp.display_name}` : `Patch: ${mainRunningApp.display_name}`}
              </ButtonItem>
            </>
          ) : (
            <span>No game is currently open.</span>
          )}
        </div>
      </PanelSectionRow>
      {result && (
        <PanelSectionRow>
          <div>{result}</div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function InstalledGamesSection() {
  const [games, setGames] = useState<{ appid: string; name: string }[]>([]);
  const [clickedGame, setClickedGame] = useState<{ appid: string; name: string } | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      const result = await listInstalledGames();
      if (result.status === "success") {
        const sortedGames = [...result.games].sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        setGames(sortedGames);
      } else {
        console.error("Failed to fetch games");
      }
    };

    fetchGames();
  }, []);

  return (
    <PanelSection title="Installed Games">
      {games.map((game) => (
        <PanelSectionRow key={game.appid}>
          <ButtonItem 
            layout="below"
            onClick={() => setClickedGame(game)}
          >
            {game.name} (AppID: {game.appid})
          </ButtonItem>
          {clickedGame?.appid === game.appid && (
            <div style={{ padding: '8px' }}>
              You clicked {game.name} with AppID: {game.appid}
            </div>
          )}
        </PanelSectionRow>
      ))}
    </PanelSection>
  );
}

export default definePlugin(() => ({
  name: "Framegen Plugin",
  titleView: <div>Decky Framegen</div>,
  alwaysRender: true,
  content: (
    <>
      <FGModInstallerSection />
      <MainRunningApp />
      <InstalledGamesSection />
      <MainContent />
    </>
  ),
  icon: <FaShip />,
  onDismount() {
    console.log("Framegen Plugin unmounted");
  },
}));

function MainContent() {
  return (
    <>
      {}
    </>
  );
}