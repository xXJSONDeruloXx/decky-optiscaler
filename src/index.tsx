import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Dropdown,
  DropdownOption
} from "@decky/ui";
import { definePlugin, callable } from "@decky/api";
import { FaShip } from "react-icons/fa";

// "run_install_fgmod" corresponds to the Python method run_install_fgmod()
const runInstallFGMod = callable<
  [],
  { status: string; message?: string; output?: string }
>("run_install_fgmod");

// "get_installed_games" corresponds to the Python method get_installed_games()
const fetchInstalledGames = callable<[], string>("get_installed_games");

function FGModInstallerSection() {
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{
    status: string;
    output?: string;
    message?: string;
  } | null>(null);

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
    </PanelSection>
  );
}

function GameSelectorSection() {
  const [games, setGames] = useState<DropdownOption[]>([]);
  const [selectedGame, setSelectedGame] = useState<DropdownOption | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      const result = await fetchInstalledGames();
      const gameList = JSON.parse(result) as { appid: string; name: string }[];
      setGames(gameList.map((g) => ({ data: g.appid, label: g.name })));
    };

    loadGames();
  }, []);

  return (
    <PanelSection title="Installed Games">
      <PanelSectionRow>
        <Dropdown
          rgOptions={games}
          selectedOption={selectedGame?.data || null}
          onChange={(option) => setSelectedGame(option)}
          strDefaultLabel="Select a game"
        />
      </PanelSectionRow>
      {selectedGame && (
        <PanelSectionRow>
          <div>You selected: {selectedGame.label}</div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

function MainContent() {
  return (
    <>
      <FGModInstallerSection />
      <GameSelectorSection />
    </>
  );
}

// One default export, one plugin
export default definePlugin(() => ({
  name: "Framegen Plugin",
  titleView: <div>Framegen Plugin</div>,
  content: <MainContent />,
  icon: <FaShip />,
  onDismount() {
    console.log("Framegen Plugin unmounted");
  },
}));