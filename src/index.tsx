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
    return () => {}; // Ensure a cleanup function is always returned
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
    <PanelSection title="FG Mod Installer">
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={handleInstallClick} disabled={installing}>
          {installing ? "Installing..." : "Install FG Mod"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={handleUninstallClick} disabled={uninstalling}>
          {uninstalling ? "Uninstalling..." : "Uninstall FG Mod"}
        </ButtonItem>
      </PanelSectionRow>
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
      {pathExists !== null && (
        <PanelSectionRow>
          <div style={{ color: pathExists ? "green" : "red" }}>
            {pathExists ? "Mod Is Installed" : "Mod Not Installed"}
          </div>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <div>
          Once the patch is installed, launch your game, press "Set Launch Options" below, then restart the game!
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}

function MainRunningApp() {
  const mainRunningApp = Router.MainRunningApp;
  const [result, setResult] = useState<string | null>(null);

  const handleSetLaunchOptions = async () => {
    if (mainRunningApp) {
      try {
        const response = await SteamClient.Apps.SetAppLaunchOptions(mainRunningApp.appid, '/home/deck/fgmod/fgmod %COMMAND%');
        setResult(`Launch options set successfully: ${response}`);
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
    <PanelSection title="Main Running App">
      <PanelSectionRow>
        <div>
          {mainRunningApp ? (
            <>
              <span>Running App: {mainRunningApp.appid}</span>
              <ButtonItem layout="below" onClick={handleSetLaunchOptions}>
                Set Launch Options
              </ButtonItem>
            </>
          ) : (
            <span>No app is currently running.</span>
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

export default definePlugin(() => ({
  name: "Framegen Plugin",
  titleView: <div>Framegen Plugin</div>,
  content: (
    <>
      <FGModInstallerSection />
      <MainRunningApp />
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
      {/* Other content */}
    </>
  );
}