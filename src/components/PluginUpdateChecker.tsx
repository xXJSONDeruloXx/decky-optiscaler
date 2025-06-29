import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ConfirmModal,
  showModal,
} from "@decky/ui";
import { callable } from "@decky/api";

// Define callable functions for plugin update
const checkForPluginUpdate = callable<
  [],
  { 
    status: string; 
    message?: string; 
    current_version?: string;
    latest_version?: string;
    has_update?: boolean;
    release_notes?: string;
    release_date?: string;
    download_url?: string;
  }
>("check_for_plugin_update");

const downloadPluginUpdate = callable<
  [string],
  { 
    status: string; 
    message: string;
    file_path?: string;
  }
>("download_plugin_update");

export default function PluginUpdateChecker() {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseNotes: string;
    releaseDate: string;
    downloadUrl: string;
  } | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<{
    success: boolean;
    message: string;
    filePath?: string;
  } | null>(null);

  const checkForUpdate = async () => {
    try {
      setCheckingUpdate(true);
      setUpdateError(null);
      setUpdateInfo(null);
      
      const result = await checkForPluginUpdate();
      
      if (result.status === "success" && result.current_version && result.latest_version) {
        setUpdateInfo({
          hasUpdate: result.has_update || false,
          currentVersion: result.current_version,
          latestVersion: result.latest_version,
          releaseNotes: result.release_notes || "No release notes available",
          releaseDate: result.release_date || "Unknown date",
          downloadUrl: result.download_url || ""
        });
      } else {
        setUpdateError(result.message || "Failed to check for updates");
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      setUpdateError(`Error: ${String(error)}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const downloadUpdate = async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;
    
    try {
      setDownloadingUpdate(true);
      setDownloadResult(null);
      
      const result = await downloadPluginUpdate(updateInfo.downloadUrl);
      
      if (result.status === "success") {
        setDownloadResult({
          success: true,
          message: result.message,
          filePath: result.file_path
        });
      } else {
        setDownloadResult({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("Error downloading update:", error);
      setDownloadResult({
        success: false,
        message: `Error: ${String(error)}`
      });
    } finally {
      setDownloadingUpdate(false);
    }
  };

  const showUpdateDetailsModal = () => {
    if (!updateInfo) return;
    
    showModal(
      <ConfirmModal 
        strTitle={`Update Available - v${updateInfo.latestVersion}`}
        strDescription={
          <div style={{ 
            maxHeight: '60vh', 
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: '0.9em'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Released:</strong> {updateInfo.releaseDate}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Current Version:</strong> v{updateInfo.currentVersion}
            </div>
            <hr style={{ margin: '15px 0', opacity: 0.3 }} />
            <div>
              <strong>Release Notes:</strong>
              <div style={{ marginTop: '10px' }}>
                {updateInfo.releaseNotes}
              </div>
            </div>
            {downloadResult && downloadResult.success && (
              <div style={{ 
                marginTop: '20px', 
                padding: '10px', 
                backgroundColor: 'rgba(0, 128, 0, 0.2)',
                borderRadius: '4px'
              }}>
                <strong>✅ Update Downloaded Successfully!</strong>
                <div style={{ marginTop: '10px' }}>
                  To install the update:
                  <ol style={{ marginLeft: '20px', marginTop: '5px' }}>
                    <li>Go to Decky Settings</li>
                    <li>Uninstall this Decky-OptiScaler plugin</li>
                    <li>Go to the "Developer" tab in Decky Settings</li>
                    <li>Select "Install Plugin from File"</li>
                    <li>Navigate to Downloads and select "decky-optiscaler.zip"</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        }
        strOKButtonText={downloadResult && downloadResult.success ? "Close" : "Download Update"}
        strCancelButtonText="Cancel"
        onOK={() => {
          if (!(downloadResult && downloadResult.success)) {
            downloadUpdate();
          }
        }}
      />
    );
  };

  useEffect(() => {
    // Auto-hide messages after 5 seconds
    if (updateError || (downloadResult && !downloadResult.success)) {
      const timer = setTimeout(() => {
        if (updateError) setUpdateError(null);
        if (downloadResult && !downloadResult.success) setDownloadResult(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [updateError, downloadResult]);

  return (
    <PanelSection title="Plugin Updates">
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={checkingUpdate ? undefined : checkForUpdate}
          disabled={checkingUpdate}
        >
          {checkingUpdate ? "Checking for Updates..." : "Check for Plugin Updates"}
        </ButtonItem>
      </PanelSectionRow>

      {updateError && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateError}
          </div>
        </PanelSectionRow>
      )}

      {updateInfo && !updateError && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: updateInfo.hasUpdate ? 'rgba(0, 128, 0, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {updateInfo.hasUpdate ? (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Update Available: v{updateInfo.latestVersion}
                </div>
                <div style={{ fontSize: '0.8em', marginBottom: '10px' }}>
                  Current version: v{updateInfo.currentVersion}
                </div>
                <ButtonItem 
                  layout="below" 
                  onClick={showUpdateDetailsModal}
                  disabled={downloadingUpdate}
                >
                  {downloadingUpdate ? "Downloading..." : "View Details & Download"}
                </ButtonItem>
              </>
            ) : (
              <div>
                You have the latest version (v{updateInfo.currentVersion})
              </div>
            )}
          </div>
        </PanelSectionRow>
      )}

      {downloadResult && !downloadResult.success && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {downloadResult.message}
          </div>
        </PanelSectionRow>
      )}

      {downloadResult && downloadResult.success && (
        <PanelSectionRow>
          <div style={{ 
            padding: '10px',
            backgroundColor: 'rgba(0, 128, 0, 0.2)',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              Update Downloaded Successfully!
            </div>
            <div style={{ fontSize: '0.9em' }}>
              <ButtonItem 
                layout="below" 
                onClick={showUpdateDetailsModal}
              >
                View Installation Instructions
              </ButtonItem>
            </div>
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}
