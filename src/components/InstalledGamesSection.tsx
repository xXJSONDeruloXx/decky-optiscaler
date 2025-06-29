import { useState, useEffect } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  DropdownItem,
  ConfirmModal,
  showModal
} from "@decky/ui";
import { callable } from "@decky/api";
import PreserveIniSection from "./PreserveIniSection";

// Import the callable functions
const listInstalledGames = callable<
  [],
  { status: string; games: { appid: string; name: string }[] }
>("list_installed_games");

const logError = callable<[string], void>("log_error");

// Global SteamClient access
declare global {
  interface Window {
    SteamClient: any;
  }
}

const SteamClient = window.SteamClient;

interface InstalledGamesSectionProps {
  preserveGameIni: boolean;
  setPreserveGameIni: (value: boolean) => void;
}

export default function InstalledGamesSection({ preserveGameIni, setPreserveGameIni }: InstalledGamesSectionProps) {
  const [games, setGames] = useState<{ appid: number; name: string }[]>([]);
  const [selectedGame, setSelectedGame] = useState<{ appid: number; name: string } | null>(null);
  const [result, setResult] = useState<string>('');
  const [selectedDllType, setSelectedDllType] = useState<string>('dxgi.dll');

  // DLL options for OptiScaler patching
  const dllOptions = [
    { 
      label: 'dxgi.dll', 
      data: 'dxgi.dll',
      description: 'Default and most broadly compatible option'
    },
    { 
      label: 'winmm.dll', 
      data: 'winmm.dll',
      description: 'Often works better with Unity/Unreal games when dxgi fails'
    },
    { 
      label: 'dbghelp.dll', 
      data: 'dbghelp.dll',
      description: 'Alternative for older DX9/DX11 games'
    },
    { 
      label: 'version.dll', 
      data: 'version.dll',
      description: 'Used by some older mod loaders and ASI-based tools'
    },
    { 
      label: 'wininet.dll', 
      data: 'wininet.dll',
      description: 'Useful if winmm or version conflict with the game'
    },
    { 
      label: 'winhttp.dll', 
      data: 'winhttp.dll',
      description: 'Another alternative when others inject too early or late'
    }
  ];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await listInstalledGames();
        if (response.status === "success") {
          const sortedGames = [...response.games]
            .map(game => ({
              ...game,
              appid: parseInt(game.appid, 10),
            }))
            .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
          setGames(sortedGames);
        } else {
          logError('fetchGames: ' + JSON.stringify(response));
          console.error('fetchGames: ' + JSON.stringify(response));
        }
      } catch (error) {
        logError("Error fetching games:" + String(error));
        console.error("Error fetching games:", String(error));
      }
    };
    fetchGames();
  }, []);

  const handleUnpatchClick = async () => {
    if (!selectedGame) return;

    try {
      await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, '~/opti/opti-uninstaller.sh %COMMAND%');
      setResult(`OptiScaler will uninstall on next launch of ${selectedGame.name}.`);
    } catch (error) {
      logError('handleUnpatchClick: ' + String(error));
      setResult(error instanceof Error ? `Error clearing launch options: ${error.message}` : 'Error clearing launch options');
    }
  };

  const handleOptiScalerPatch = async () => {
    if (!selectedGame) return;

    try {
      const preserveIniFlag = preserveGameIni ? 'PRESERVE_INI=true' : 'PRESERVE_INI=false';
      await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, `DLL=${selectedDllType} ${preserveIniFlag} ~/opti/opti.sh %COMMAND%`);
      setResult(`OptiScaler (${selectedDllType}) set for ${selectedGame.name}${preserveGameIni ? ' - preserving existing game INI' : ''}`);
    } catch (error) {
      logError('handleOptiScalerPatch: ' + String(error));
      setResult(`Error setting OptiScaler: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <PanelSection title="Select a game to patch:">
      {/* Preserve INI Settings Section - Always visible */}
      <PreserveIniSection 
        preserveGameIni={preserveGameIni}
        onPreserveIniChange={setPreserveGameIni}
      />
      
      <PanelSectionRow>
        <DropdownItem
          rgOptions={games.map(game => ({
            data: game.appid,
            label: game.name
          }))}
          selectedOption={selectedGame?.appid}
          onChange={(option: any) => {
            const game = games.find(g => g.appid === option.data);
            setSelectedGame(game || null);
            setResult('');
          }}
          strDefaultLabel="Select a game..."
          menuLabel="Installed Games"
        />
      </PanelSectionRow>

      {result ? (
        <PanelSectionRow>
          <div style={{ 
            padding: '12px',
            marginTop: '16px',
            backgroundColor: 'var(--decky-selected-ui-bg)',
            borderRadius: '4px'
          }}>
            {result}
          </div>
        </PanelSectionRow>
      ) : null}
      
      {selectedGame ? (
        <>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleUnpatchClick}
            >
              Unpatch
            </ButtonItem>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                if (!selectedGame) return;
                
                // Show confirmation modal with strong warning
                showModal(
                  <ConfirmModal 
                    strTitle={`NUCLEAR UNPATCH - ${selectedGame.name}`}
                    strDescription={
                      "⚠️ WARNING: This will forcefully remove ALL DLL files and mod-related files from the game directory. You MUST verify game files in Steam afterward to restore the game to working condition. Continue?"
                    }
                    strOKButtonText="Yes, do nuclear cleanup"
                    strCancelButtonText="Cancel"
                    onOK={async () => {
                      try {
                        await SteamClient.Apps.SetAppLaunchOptions(selectedGame.appid, '~/opti/uninstall-nuclear.sh %COMMAND%');
                        setResult(`Nuclear uninstaller will run on next launch of ${selectedGame.name}. After running, you MUST verify game files in Steam.`);
                      } catch (error) {
                        logError('handleNuclearUnpatchClick: ' + String(error));
                        setResult(`Error setting nuclear uninstall: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                  />
                );
              }}
              style={{ 
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                paddingTop: '8px',
                paddingBottom: '8px'
              }}
            >
              Nuclear Unpatch
            </ButtonItem>
            <div style={{ fontSize: '0.8em', marginTop: '4px', color: 'rgba(255, 100, 100, 0.8)' }}>
              Emergency option: Forcibly removes all DLLs (requires game verification)
            </div>
          </PanelSectionRow>
          
          {/* OptiScaler Patching Options */}
          <PanelSectionRow>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
              OptiScaler Patching Options:
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <DropdownItem
              label="DLL Type"
              rgOptions={dllOptions}
              selectedOption={selectedDllType}
              onChange={(option: any) => setSelectedDllType(option.data)}
            />
          </PanelSectionRow>
          
          <PanelSectionRow>
            <div style={{ fontSize: '0.8em', marginBottom: '8px', opacity: 0.8 }}>
              {dllOptions.find(option => option.data === selectedDllType)?.description || ''}
            </div>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleOptiScalerPatch}
            >
              Opti-Patch ({selectedDllType})
            </ButtonItem>
          </PanelSectionRow>
        </>
      ) : null}
    </PanelSection>
  );
}
