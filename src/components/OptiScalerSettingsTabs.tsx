import { useState } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
} from "@decky/ui";
import {
  UpscalersSettingsSection,
  OptiFGSettingsSection,
  FramerateLimitSection,
} from "./SettingsSections";

// TODO: Import these additional sections once they are implemented in SettingsSections.tsx
// import { MenuSettingsSection, QualityRatioOverrideSection, UpscaleRatioSection } from "./SettingsSections";

// Placeholder components for sections not yet implemented
function MenuSettingsSection() {
  return (
    <PanelSection title="Menu Settings">
      <PanelSectionRow>
        <div>Menu Settings component needs to be implemented</div>
      </PanelSectionRow>
    </PanelSection>
  );
}

function QualityRatioOverrideSection() {
  return (
    <PanelSection title="Quality Ratio Override">
      <PanelSectionRow>
        <div>Quality Ratio Override component needs to be implemented</div>
      </PanelSectionRow>
    </PanelSection>
  );
}

function UpscaleRatioSection() {
  return (
    <PanelSection title="Upscale Ratio">
      <PanelSectionRow>
        <div>Upscale Ratio component needs to be implemented</div>
      </PanelSectionRow>
    </PanelSection>
  );
}

export default function OptiScalerSettingsTabs() {
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
