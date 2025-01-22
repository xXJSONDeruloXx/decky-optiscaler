import { useState } from "react";
import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { FaShip } from "react-icons/fa";

const runInstallFGMod = callable<[], { status: string; message?: string; output?: string }>("run_install_fgmod");

function Content() {
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{ status: string; output?: string; message?: string } | null>(
    null
  );

  const handleInstallClick = async () => {
    setInstalling(true);
    const result = await runInstallFGMod();
    setInstalling(false);
    setInstallResult(result);
  };

  return (
    <PanelSection title="FG Mod Installer">
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={handleInstallClick} disabled={installing}>
          {installing ? "Installing..." : "Install FG Mod"}
        </ButtonItem>
      </PanelSectionRow>
      {installResult && (
        <PanelSectionRow>
          <div>
            <strong>Status:</strong> {installResult.status === "success" ? "Success" : "Error"} <br />
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
    </PanelSection>
  );
}

export default definePlugin(() => ({
  name: "FG Mod Installer",
  titleView: <div>FG Mod Installer</div>,
  content: <Content />,
  icon: <FaShip />,
  onDismount() {
    console.log("Plugin unmounted");
  },
}));