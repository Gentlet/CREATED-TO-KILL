(function () {
  "use strict";
  window.CTK = window.CTK || {};
  CTK.Constants = {
    VERSION: 1,
    PHASE: { TITLE: "TITLE", MUTATION_SELECT: "MUTATION_SELECT", REWARD_SELECT: "REWARD_SELECT", PLAYER_TURN: "PLAYER_TURN", ENEMY_RESOLVE: "ENEMY_RESOLVE", ROUND_RESULT: "ROUND_RESULT", VICTORY: "VICTORY", GAME_OVER: "GAME_OVER" },
    STORAGE: { RUN: "ctk.run.v1", META: "ctk.meta.v1", SETTINGS: "ctk.settings.v1" },
    ROUNDS: [null, { hp:32, attack:6, defense:8 }, { hp:40, attack:7, defense:9 }, { hp:50, attack:7, defense:10 }, { hp:62, attack:8, defense:11 }, { hp:76, attack:9, defense:12 }, { hp:92, attack:10, defense:13 }, { hp:110, attack:11, defense:14 }, { hp:132, attack:12, defense:16 }],
    MUTATION_TIERS: [null, [1,1,2], [1,2,2], [1,2,3], [2,2,3], [2,3,4], [2,3,4], [3,4,5], [3,4,5]],
    REWARD_RARITIES: { 1:["common","common","common"], 2:["common","common","advanced"], 3:["common","advanced","advanced"], 4:["advanced","advanced","rare"], 5:["advanced","rare","rare"] },
    INTENTS: { STRIKE:"strike", HEAVY:"heavy", DEFEND:"defend", ROAR:"roar" },
    INTENT_DECK: ["strike","strike","strike","heavy","defend","roar"],
    LOG_LIMIT: 6
  };
}());
