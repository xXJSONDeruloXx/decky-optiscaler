import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ConfirmModal,
  showModal
} from "@decky/ui";

export default function NonSteamGamesSection() {
  return (
    <PanelSection title="Non-Steam Games">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => {
            showModal(
              <ConfirmModal
                strTitle="Non-Steam Games Launch Commands"
                strDescription={
                  <div style={{ textAlign: 'left', lineHeight: '1.5' }}>
                    <div style={{ marginBottom: '15px' }}>
                      For non-Steam games, manually add one of these launch commands to your game launcher:
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '8px' }}>
                        🎯 RECOMMENDED (dxgi.dll):
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                      }}>
                        DLL=dxgi.dll ~/opti/opti.sh %COMMAND%
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fbbf24', marginBottom: '8px' }}>
                        🔧 ALTERNATIVES if dxgi doesn't work:
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                      }}>
                        DLL=winmm.dll ~/opti/opti.sh %COMMAND%<br/>
                        DLL=dbghelp.dll ~/opti/opti.sh %COMMAND%<br/>
                        DLL=version.dll ~/opti/opti.sh %COMMAND%<br/>
                        DLL=wininet.dll ~/opti/opti.sh %COMMAND%<br/>
                        DLL=winhttp.dll ~/opti/opti.sh %COMMAND%
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px' }}>
                        📝 INSTRUCTIONS:
                      </div>
                      <div style={{ paddingLeft: '10px' }}>
                        1. Copy one of the commands above<br/>
                        2. In your game launcher (Heroic, Lutris, etc.), find the launch options or prefix commands<br/>
                        3. Paste the command as a wrapper/prefix before the game executable<br/>
                        4. Launch the game - OptiScaler will inject automatically
                      </div>
                    </div>

                    <div style={{ 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                      padding: '10px', 
                      borderRadius: '6px',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#60a5fa' }}>💡 TIP:</div>
                      <div>Start with dxgi.dll as it works with most games. Try alternatives if you encounter issues.</div>
                    </div>
                  </div>
                }
                strOKButtonText="Got it!"
                bAlertDialog={true}
              />
            );
          }}
        >
          Non Steam Games
        </ButtonItem>
        <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
          Instructions for manually adding OptiScaler to other game launchers
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
