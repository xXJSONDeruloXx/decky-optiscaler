import { useState, useEffect } from "react";
import { PanelSection, PanelSectionRow, Dropdown, DropdownOption } from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { FaShip } from "react-icons/fa";

const fetchInstalledGames = callable<[], string>("get_installed_games");

function Content() {
  const [games, setGames] = useState<DropdownOption[]>([]);
  const [selectedGame, setSelectedGame] = useState<DropdownOption | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      const result = await fetchInstalledGames();
      const gameList = JSON.parse(result) as { appid: string; name: string }[];
      setGames(gameList.map(game => ({ data: game.appid, label: game.name })));
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
          strDefaultLabel="Select a game" // Placeholder equivalent
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

export default definePlugin(() => ({
  name: "Game Selector Plugin",
  titleView: <div>Game Selector Plugin</div>,
  content: <Content />,
  icon: <FaShip />,
  onDismount() {
    console.log("Plugin unmounted");
  },
}));