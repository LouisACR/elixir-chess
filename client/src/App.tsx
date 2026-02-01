import { useState } from "react";
import { MenuScreen, type GameMode } from "./components/Lobby";
import { LocalGame } from "./components/LocalGame";
import { MultiplayerGame } from "./components/MultiplayerGame";

function App() {
  const [gameMode, setGameMode] = useState<GameMode>("menu");

  return (
    <>
      {gameMode === "menu" && (
        <MenuScreen
          onSelectLocal={() => setGameMode("local")}
          onSelectMultiplayer={() => setGameMode("multiplayer-lobby")}
        />
      )}
      {gameMode === "local" && <LocalGame onBack={() => setGameMode("menu")} />}
      {(gameMode === "multiplayer-lobby" ||
        gameMode === "multiplayer-game") && (
        <MultiplayerGame onBack={() => setGameMode("menu")} />
      )}
    </>
  );
}

export default App;
