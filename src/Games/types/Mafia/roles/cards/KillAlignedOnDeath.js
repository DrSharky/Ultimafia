const Card = require("../../Card");

module.exports = class KillAlignedOnDeath extends Card {
  constructor(role) {
    super(role);

    if (role.alignment == "Independent" || role.alignment == "Hostile") {
      return;
    }

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.game.queueAlert(
          `${this.player.name} is the ${this.player.role.modifier}! Protect them at all costs!`,
          0,
          this.game.players.filter(
            (p) => p.role.alignment === this.player.role.alignment
          )
        );
      },
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          if (p.role.alignment === this.player.role.alignment) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
