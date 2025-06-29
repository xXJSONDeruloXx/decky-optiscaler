import { definePlugin } from "@decky/api";
import { RiAiGenerate } from "react-icons/ri";

// Import component sections
import FGModInstallerSection from "./components/FGModInstallerSection";
import InstalledGamesSection from "./components/InstalledGamesSection";
import NonSteamGamesSection from "./components/NonSteamGamesSection";
import { OptiScalerFGTypeSection } from "./components/OptiScalerFGTypeSection";
import { OptiScalerSettingsTabs } from "./components/OptiScalerSettingsTabs";
import { PluginUpdateChecker } from "./components/PluginUpdateChecker";

export default definePlugin(() => {
  return {
    name: "Framegen Plugin",
    titleView: <div>Decky Optiscaler</div>,
    alwaysRender: true,
    content: (
      <>
        <FGModInstallerSection />
        <InstalledGamesSection />
        <NonSteamGamesSection />
        {/* <OptiScalerFGTypeSection /> */}
        {/* <OptiScalerSettingsTabs /> */}
        <PluginUpdateChecker />
      </>
    ),
    icon: <RiAiGenerate />,
    onDismount() {
      console.log("Framegen Plugin unmounted");
    },
  };
});
