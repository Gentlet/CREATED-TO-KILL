(function () {
  "use strict";
  const CTK=window.CTK=window.CTK||{}, C=CTK.Constants, D=CTK.Data, E=CTK.Effects;

  function mutations(run) {
    const used=[];
    for (const tier of C.MUTATION_TIERS[run.round]) {
      const candidates=D.mutations.filter(item => item.tier === tier && !run.enemy.mutations.includes(item.id) && !used.includes(item.id) && !item.incompatibleWith.some(id => run.enemy.mutations.includes(id)));
      const item=CTK.RNG.pick(run,candidates);
      if (item) used.push(item.id);
    }
    run.pendingMutationChoices=used;
    CTK.Playtest.startRound(run); CTK.Playtest.recordMutationOptions(run,used);
  }
  function generateRewardChoices(run, excludedIds) {
    const used=[];
    const excluded=excludedIds || [];
    for (const rarity of C.REWARD_RARITIES[run.selectedRisk]) {
      let candidates=D.upgrades.filter(item => item.rarity === rarity && !used.includes(item.id) && !excluded.includes(item.id) && (run.player.upgrades[item.id] || 0) < item.maxStacks);
      if (!candidates.length && excluded.length) candidates=D.upgrades.filter(item => item.rarity === rarity && !used.includes(item.id) && (run.player.upgrades[item.id] || 0) < item.maxStacks);
      const item=CTK.RNG.pick(run,candidates);
      if (item) used.push(item.id);
    }
    return used;
  }
  function rewards(run, excludedIds) {
    const choices=generateRewardChoices(run,excludedIds);
    run.pendingRewardChoices=choices;
    CTK.Playtest.recordRewardOptions(run,choices);
  }
  function rerollRewards() {
    const run=CTK.app.run;
    if (!run || run.phase !== "REWARD_SELECT" || run.rewardRerollsRemaining < 1) return;
    const previousChoices=run.pendingRewardChoices.slice();
    run.rewardRerollsRemaining--;
    rewards(run,previousChoices);
    CTK.Playtest.recordRewardReroll(run,run.pendingRewardChoices);
    CTK.Audio.play("select");
    save();
  }
  function save() { CTK.Storage.saveRun(CTK.app.run); CTK.app.resumableRun=CTK.app.run; CTK.UI.render(); }
  function beginCombat(run) { CTK.State.resetCombat(run); CTK.Playtest.startCombat(run); CTK.Enemy.start(run); }
  function chooseWager(accepted) {
    const run=CTK.app.run;
    if (!run || run.phase !== "WAGER_SELECT" || !CTK.Wager.choose(run,accepted)) return;
    CTK.Playtest.recordWagerChoice(run,run.wager);
    beginCombat(run); CTK.Audio.play("select"); save();
  }
  function finalize() {
    const run=CTK.app.run;
    if (!run || !["GAME_OVER","VICTORY"].includes(run.phase)) return;
    if (run.phase === "GAME_OVER") CTK.Wager.finish(run,false);
    if (!run.finalScoreApplied) {
      run.score+=run.player.hp * 10;
      run.finalScoreApplied=true;
      const meta=CTK.app.meta;
      meta.highScore=Math.max(meta.highScore,run.score);
      meta.highestRound=Math.max(meta.highestRound,run.round);
      if (run.phase === "VICTORY") meta.totalClears++;
      CTK.Storage.saveMeta(meta);
    }
    CTK.Playtest.finishRun(run);
    save();
  }
  function act(type) {
    const run=CTK.app.run;
    if (!run || run.phase !== "PLAYER_TURN") return;
    const charged=type === "strike" && run.player.chargeStacks > 0;
    if (!run.combat.firstAction) run.combat.firstAction=type;
    if (CTK.Combat.playerAction(run,type)) {
      CTK.Playtest.recordAction(run,type);
      CTK.Audio.play(type === "strike" ? (charged ? "heavy" : "attack") : type === "guard" ? "guard" : "select");
      if (["GAME_OVER","VICTORY"].includes(run.phase)) finalize(); else save();
    }
  }
  function end() {
    const run=CTK.app.run;
    if (!run || run.phase !== "PLAYER_TURN") return;
    CTK.Effects.endPlayerTurn(run);
    if (["GAME_OVER","VICTORY"].includes(run.phase)) return finalize();
    run.phase="ENEMY_RESOLVE";
    CTK.Enemy.resolve(run);
    if (["GAME_OVER","VICTORY"].includes(run.phase)) finalize(); else save();
  }
  function select(id) {
    const run=CTK.app.run;
    if (run.phase === "MUTATION_SELECT" && run.pendingMutationChoices.includes(id)) {
      const activeSynergiesBefore=E.activeMutationSynergies(run).map(synergy => synergy.id);
      run.enemy.mutations.push(id); run.selectedRisk=D.mutationById[id].tier;
      const activatedSynergies=E.activeMutationSynergies(run).map(synergy => synergy.id).filter(synergyId => !activeSynergiesBefore.includes(synergyId));
      CTK.Playtest.selectMutation(run,id,run.selectedRisk); CTK.Playtest.recordMutationSynergies(run,activatedSynergies); rewards(run); run.phase="REWARD_SELECT"; CTK.Audio.play("select"); save();
    } else if (run.phase === "REWARD_SELECT" && run.pendingRewardChoices.includes(id)) {
      const activeBuildsBefore=E.activeBuilds(run);
      CTK.Playtest.selectReward(run,id); CTK.State.addUpgrade(run,id);
      E.activeBuilds(run).filter(tag => !activeBuildsBefore.includes(tag)).forEach(tag => {
        const build=D.builds[tag];
        (run.visualEvents || (run.visualEvents=[])).push({type:"banner",text:build.synergy+" / BUILD ONLINE"});
      });
      CTK.Wager.offer(run); CTK.Playtest.recordWagerOffered(run,run.wager.id); run.phase="WAGER_SELECT"; CTK.Audio.play("select"); save();
    }
  }
  function start() { const run=CTK.State.create(CTK.RNG.newSeed()); CTK.Playtest.startRun(run); CTK.app.run=run; CTK.app.resumableRun=run; CTK.app.meta.totalRuns++; CTK.Storage.saveMeta(CTK.app.meta); mutations(run); save(); }
  function next() { const run=CTK.app.run; run.round++; run.wager=null; run.phase="MUTATION_SELECT"; mutations(run); save(); }
  function resume() { CTK.app.run=CTK.app.resumableRun; CTK.UI.render(); }
  function normalizeRun(run) { if (run && typeof run.rewardRerollsRemaining !== "number") run.rewardRerollsRemaining=1; return run; }

  CTK.app={run:null,resumableRun:null,meta:null,settings:null};
  document.addEventListener("DOMContentLoaded",() => {
    CTK.app.meta=CTK.Storage.meta(); CTK.app.settings=CTK.Storage.settings();
    const saved=normalizeRun(CTK.Storage.loadRun());
    if (saved && !["GAME_OVER","VICTORY"].includes(saved.phase)) CTK.app.resumableRun=saved; else CTK.app.run=saved;
    CTK.UI.render();
    document.body.addEventListener("click",event => {
      const badge=event.target.closest(".badge");
      if (badge) {
        document.querySelectorAll(".badge.open").forEach(item => {
          item.classList.remove("open");
          item.setAttribute("aria-expanded","false");
        });
        badge.classList.add("open");
        badge.setAttribute("aria-expanded","true");
        return;
      }
      document.querySelectorAll(".badge.open").forEach(item => {
        item.classList.remove("open");
        item.setAttribute("aria-expanded","false");
      });
      const target=event.target.closest("[data-new],[data-resume],[data-action],[data-select],[data-wager],[data-setting],[data-playtest]");
      if (!target) return;
      if (target.dataset.new !== undefined) start(); else if (target.dataset.resume !== undefined) resume(); else if (target.dataset.playtest === "export") CTK.Playtest.exportJSON(); else if (target.dataset.playtest === "clear") { if (confirm("Delete all recorded playtest logs?")) { CTK.Playtest.clear(); CTK.UI.render(); } } else if (target.dataset.wager !== undefined) chooseWager(target.dataset.wager === "accept"); else if (target.dataset.action === "end") end(); else if (target.dataset.action === "next") next(); else if (target.dataset.action === "reroll") rerollRewards(); else if (target.dataset.action) act(target.dataset.action); else if (target.dataset.select) select(target.dataset.select); else { CTK.app.settings[target.dataset.setting]=!CTK.app.settings[target.dataset.setting]; CTK.Storage.saveSettings(CTK.app.settings); CTK.UI.render(); }
    });
    document.addEventListener("keydown",event => { const map={"1":"strike","2":"guard","3":"charge"}; if (map[event.key]) { event.preventDefault(); act(map[event.key]); } if (event.code === "Space") { event.preventDefault(); end(); } });
  });
}());
