import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  DropdownItem,
  ToggleField,
  TextField,
  SliderField,
} from "@decky/ui";
import { callable } from "@decky/api";

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

export function UpscalersSettingsSection() {
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

export function OptiFGSettingsSection() {
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

export function FramerateLimitSection() {
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

// Note: Additional settings sections (MenuSettingsSection, QualityRatioOverrideSection, UpscaleRatioSection) 
// would be added here following the same pattern. Due to length constraints, they are not included in this excerpt.
