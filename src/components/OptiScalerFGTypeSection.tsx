import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
} from "@decky/ui";
import { callable } from "@decky/api";

const getOptiScalerFGType = callable<[], { status: string; fgtype: string; message?: string }>("get_optiscaler_fgtype");
const setOptiScalerFGType = callable<[string], { status: string; message: string }>("set_optiscaler_fgtype");

const logError = callable<[string], void>("log_error");

export default function OptiScalerFGTypeSection() {
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
