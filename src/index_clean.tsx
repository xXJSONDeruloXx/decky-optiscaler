import { definePlugin } from "@decky/api";
import { RiAiGenerate } from "react-icons/ri";
import { useState } from "react";

// Import component sections
import FGModInstallerSection from "./components/FGModInstallerSection";
import InstalledGamesSection from "./components/InstalledGamesSection";
import NonSteamGamesSection from "./components/NonSteamGamesSection";
import OptiScalerFGTypeSection from "./components/OptiScalerFGTypeSection";
import OptiScalerSettingsTabs from "./components/OptiScalerSettingsTabs";
import PluginUpdateChecker from "./components/PluginUpdateChecker";

function PluginContent() {
  const [preserveGameIni, setPreserveGameIni] = useState<boolean>(true);

  return (
    <>
      <FGModInstallerSection />
      <InstalledGamesSection 
        preserveGameIni={preserveGameIni}
        setPreserveGameIni={setPreserveGameIni}
      />
      <NonSteamGamesSection />
      {!preserveGameIni && (
        <>
          <OptiScalerFGTypeSection />
          <OptiScalerSettingsTabs />
        </>
      )}
      <PluginUpdateChecker />
    </>
  );
}

export default definePlugin(() => {
  return {
    name: "Framegen Plugin",
    titleView: <div>Decky Optiscaler</div>,
    alwaysRender: true,
    content: <PluginContent />,
    icon: <RiAiGenerate />,
    onDismount() {
      console.log("Framegen Plugin unmounted");
    },
  };
});
