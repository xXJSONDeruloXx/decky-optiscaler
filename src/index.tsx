import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
} from "@decky/ui";
import { definePlugin, callable } from "@decky/api";
import { FaShip } from "react-icons/fa";

const runInstallFGMod = callable<
  [],
  { status: string; message?: string; output?: string }
>("run_install_fgmod");

const checkFGModPath = callable<
  [],
  { exists: boolean }
>("check_fgmod_path");

function FGModInstallerSection() {
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{
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
    checkPath();
  }, []);

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
      {pathExists !== null && (
        <PanelSectionRow>
          <div style={{ color: pathExists ? "green" : "red" }}>
            {pathExists ? "Path exists" : "Path does not exist"}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

export default definePlugin(() => ({
  name: "Framegen Plugin",
  titleView: <div>Framegen Plugin</div>,
  content: <MainContent />,
  icon: <FaShip />,
  onDismount() {
    console.log("Framegen Plugin unmounted");
  },
}));

function MainContent() {
  return (
    <>
      <FGModInstallerSection />
    </>
  );
}