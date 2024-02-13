const Role = require("../../Role");

module.exports = class Judge extends Role {
  constructor(player, data) {
    super("Judge", player, data);
    this.alignment = "Hostile";
    this.cards = [
      "VillageCore",
      "WinAmongLastTwo",
      "CourtSession",
      "BroadcastMessage",
    ];
    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Cry",
            targets: ["out"],
            targetType: "out",
            verb: "",
          },
        ],
      },
      "Court Session": {
        speechAbilities: [
          {
            name: "Cry",
            targets: ["out"],
            targetType: "out",
            verb: "",
          },
        ],
        voteWeight: 3,
      },
    };
  }
};
