import { NameWithAvatar } from "../User/User";
import { UserText } from "../../components/Basic";
import React, { useState, useCallback } from "react";
import "../../css/game.css";
import { Fade } from "@mui/material";

export const InGameMessage = ({
  delay,
  playerName,
  msg,
  isServerMessage,
  highlightMessage,
  setDemoFinished,
}) => {
  var Node;
  const elRef = useCallback(node => {
    if (node !== null) {
      Node = node;
      const timeout = setTimeout(() => {

        setVisible(true);
        if (Node) {
          Node.style["display"] = "flex";
          Node.scrollIntoView();
        }
  
        if (setDemoFinished) {
          setDemoFinished(true);
        }
      }, delay);
  
      return () => clearTimeout(timeout);
  
    }
  }, []);
  const [visible, setVisible] = useState(false);

  return (
    <Fade in={visible}>
      <div
        className="message"
        style={{ display: visible ? "flex" : "none", marginTop: "10px" }}
        ref={elRef}
      >
        <div className="sender gameMessageSender" style={{ flexBasis: "90px" }}>
          {!isServerMessage && (
            <NameWithAvatar
              name={playerName}
              color={"#68a9dc"}
              noLink
              small
            />
          )}
        </div>
        <div
          className={`gameMessageContent ${
            isServerMessage ? "gameMessageContentServer" : ""
          } ${highlightMessage ? "highlightMessage" : ""}`}
          style={{
            cursor: "default",
            ...(isServerMessage ? { borderLeft: "none" } : null),
          }}
        >
          <UserText
            text={msg}
            linkify
            emotify
            terminologyEmoticons={true}
            iconUsername
          />
        </div>
      </div>
    </Fade>
  );
};
