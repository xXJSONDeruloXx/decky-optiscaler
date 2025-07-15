import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem
} from "@decky/ui";
import { callable } from "@decky/api";

// Import the callable functions
const runInstallMesaGit = callable<
  [],
  { status: string; message?: string }
>("run_install_mesa_git");

const runUninstallMesaGit = callable<
  [],
  { status: string; message?: string }
>("run_uninstall_mesa_git");

const checkMesaGitPath = callable<
  [],
  { exists: boolean; version: string }
>("check_mesa_git_path");

const downloadMesaGit = callable<
  [],
  { 
    status: string; 
    message: string; 
    file_path?: string; 
    extract_path?: string;
    version?: string;
  }
>("download_mesa_git");

const logError = callable<[string], void>("log_error");

export default function MesaGitInstallerSection() {
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [installResult, setInstallResult] = useState<{
    status: string;
    message?: string;
  } | null>(null);
  const [uninstallResult, setUninstallResult] = useState<{
    status: string;
    message?: string;
  } | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [mesaGitExists, setMesaGitExists] = useState<boolean | null>(null);
  const [mesaGitVersion, setMesaGitVersion] = useState<string>("");

  useEffect(() => {
    const checkPath = async () => {
      try {
        const result = await checkMesaGitPath();
        setMesaGitExists(result.exists);
        setMesaGitVersion(result.version);
      } catch (e) {
        logError('useEffect -> checkPath (mesa-git): ' + String(e));
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
      
      console.log("Installing mesa-git...");
      const result = await runInstallMesaGit();
      
      console.log("Installation result:", result);
      setInstallResult(result);
    } catch (e) {
      logError('handleInstallClick (mesa-git): ' + String(e));
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
      const result = await runUninstallMesaGit();
      setUninstallResult(result);
    } catch (e) {
      logError('handleUninstallClick (mesa-git): ' + String(e));
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
      setDownloadStatus(null);
      
      console.log("Downloading mesa-git...");
      const result = await downloadMesaGit();
      
      console.log("Download result:", result);
      if (result.status === "success" || result.status === "partial_success") {
        setDownloadStatus({
          success: true,
          message: result.message
        });
      } else {
        setDownloadStatus({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logError('handleDownload (mesa-git): ' + String(error));
      console.error(error);
      setDownloadStatus({
        success: false,
        message: String(error)
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getMesaGitStatusColor = () => {
    if (mesaGitExists === null) return "gray";
    return mesaGitExists ? "green" : "red";
  };

  const getMesaGitStatusText = () => {
    if (mesaGitExists === null) return "Checking...";
    if (mesaGitExists) {
      return mesaGitVersion ? `Installed (${mesaGitVersion})` : "Installed";
    }
    return "Not Installed";
  };

  return (
    <PanelSection title="Mesa-Git Installation">
      <PanelSectionRow>
        <div style={{ 
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Status: <span style={{ color: getMesaGitStatusColor() }}>{getMesaGitStatusText()}</span>
          </div>
          <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
            Mesa-Git provides bleeding-edge Mesa drivers for improved graphics performance.
            Use with launch option: MESA_GIT=1 %command%
          </div>
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={isDownloading ? undefined : handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? "Downloading Mesa-Git..." : "Download Latest Mesa-Git"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={installing ? undefined : handleInstallClick}
          disabled={installing || mesaGitExists}
        >
          {installing ? "Installing..." : "Install Mesa-Git"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={uninstalling ? undefined : handleUninstallClick}
          disabled={uninstalling || !mesaGitExists}
        >
          {uninstalling ? "Uninstalling..." : "Uninstall Mesa-Git"}
        </ButtonItem>
      </PanelSectionRow>

      {downloadStatus && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: downloadStatus.success 
              ? 'rgba(0, 128, 0, 0.2)' 
              : 'rgba(255, 0, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {downloadStatus.message}
          </div>
        </PanelSectionRow>
      )}

      {installResult && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: installResult.status === "success" 
              ? 'rgba(0, 128, 0, 0.2)' 
              : 'rgba(255, 0, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {installResult.message}
          </div>
        </PanelSectionRow>
      )}

      {uninstallResult && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: uninstallResult.status === "success" 
              ? 'rgba(0, 128, 0, 0.2)' 
              : 'rgba(255, 0, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {uninstallResult.message}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}
