import {
  PanelSection,
  PanelSectionRow,
  ToggleField
} from "@decky/ui";

interface PreserveIniSectionProps {
  preserveGameIni: boolean;
  onPreserveIniChange: (value: boolean) => void;
}

export default function PreserveIniSection({ preserveGameIni, onPreserveIniChange }: PreserveIniSectionProps) {
  return (
    <PanelSection title="INI Preservation Settings">
      <PanelSectionRow>
        <ToggleField
          label="Preserve Game INI Settings"
          description=""
          checked={preserveGameIni}
          onChange={onPreserveIniChange}
        />
      </PanelSectionRow>
      
      <PanelSectionRow>
        <div style={{ 
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          fontSize: '0.85em',
          opacity: 0.9
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Status: {preserveGameIni ? "INI settings will be preserved" : "INI settings will be overwritten"}
          </div>
          <div>
            {preserveGameIni 
              ? "Your custom OptiScaler settings in opti.ini will remain intact when launching patched games."
              : "OptiScaler will use default settings and may overwrite existing opti.ini configurations."
            }
          </div>
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
