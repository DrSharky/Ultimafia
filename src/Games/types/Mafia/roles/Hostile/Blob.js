const Role = require("../../Role");

module.exports = class Blob extends Role {
  constructor(player, data) {
    super("Blob", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinAmongLastTwo", "NightBlobber"];
  }
};
