import React, { useContext, useRef } from "react";
import { PopoverContext } from "../../../Contexts";
import { Typography } from "@mui/material";

export const PlayerCount = ({ game, small }) => {
  const infoRef = useRef();
  const popover = useContext(PopoverContext);

  function onInfoClick(e) {
    e.stopPropagation();
    popover.onClick(
      `/game/${game.id}/info`,
      "game",
      infoRef.current,
      `Game ${game.id}`
    );
  }

  if (game.endTime > 0) {
    game.players = 0;
  }

  const gradientColor = "var(--gradient-color)";
  const backgroundColor = "var(--scheme-color)";
  const numSlotsTaken = game.players;
  const numSlotsOpen = game.setup.total - game.players;
  const extraFillColors = `${gradientColor} ,`.repeat(
    Math.max(numSlotsTaken, 0) // Math.max because if we SOMEHOW magically have 8/7 players in the lobby, I'd rather not crash the whole app
  );
  const extraBackgroundColors = `${backgroundColor}, `.repeat(
    Math.max(numSlotsOpen - 1, 0)
  ); // -1 to avoid THE trailing comma
  const extraLastColor = numSlotsOpen > 0 ? backgroundColor : gradientColor; // If the game is filled, make the gradient "full"

  const gameNotFinished = ["Open", "In Progress"].includes(game.status);
  const backgroundImage = gameNotFinished
    ? `linear-gradient(to right, ${gradientColor}, ${extraFillColors}${extraBackgroundColors}${extraLastColor})`
    : "";
  const extraStyles = {
    backgroundImage,
  };

  const minWidth = small ? "36px" : "48px";
  return (
    <Typography
      className="player-count"
      sx={{ px: 0.25, mx: 1, minWidth }}
      ref={infoRef}
      onMouseOver={onInfoClick}
      style={extraStyles}
    >
      {game.players}/{game.setup.total}
    </Typography>
  );
};
