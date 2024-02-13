const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class Food extends Item {
  constructor(foodType) {
    super("Food");
    this.foodType = foodType;
  }

  eat() {
    if (this.foodType == "Stew" && this.holder.alignment != "Cult") {
      let action = new Action({
        actor: this.holder,
        target: this.holder,
        game: this.game,
        labels: [
          "giveEffect",
          "poison",
          "hidden",
          "absolute",
          "uncontrollable",
        ],
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        run: function () {
          if (this.dominates()) {
            this.target.queueAlert(
              "You have been poisoned by the Cannibal's stew!"
            );
            this.target.giveEffect("poison", this.actor);
          }
        },
      });

      action.do();
    }
  }

  get snoopName() {
    return this.foodType;
  }
};
