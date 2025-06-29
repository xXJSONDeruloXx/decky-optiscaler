import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem
} from "@decky/ui";
import { callable } from "@decky/api";

// Import the callable functions
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

export default function FGModInstallerSection() {
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
      
      // Install everything from the bleeding-edge release to ~/opti
      console.log("Installing OptiScaler bleeding-edge...");
      const result = await runInstallFGMod();
      
      console.log("Installation result:", result);
      setInstallResult(result);
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
            {installing ? "Installing..." : "Install OptiScaler"}
          </ButtonItem>
        </PanelSectionRow>
      ) : null}
      {pathExists === true ? (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleUninstallClick} disabled={uninstalling}>
            {uninstalling ? "Uninstalling..." : "Uninstall OptiScaler"}
          </ButtonItem>
        </PanelSectionRow>
      ) : null}      
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={handleDownload} 
          disabled={isDownloading}
        >
          {isDownloading ? "Updating..." : "Update OptiScaler Latest"}
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
          Install the mod, then select a game and apply a patch.
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
