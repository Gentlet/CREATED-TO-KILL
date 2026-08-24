(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, K = CTK.Constants.STORAGE;
  const LIMIT = 100;

  function active(run) { return run && run.playtestLog; }
  function round(run) {
    const log = active(run);
    if (!log) return null;
    let entry = log.rounds.find(item => item.round === run.round);
    if (!entry) {
      entry = { round:run.round, mutationOffered:[], mutationSelected:null, mutationRisk:null, rewardOffered:[], rewardSelected:null, startHP:null, endHP:null, turns:0, actions:{attack:0,guard:0,charge:0} };
      log.rounds.push(entry);
    }
    return entry;
  }
  function readLogs() {
    try { const value=JSON.parse(localStorage.getItem(K.PLAYTEST_LOGS)); return Array.isArray(value) ? value : []; } catch (_) { return []; }
  }

  CTK.Playtest = {
    startRun(run) { run.playtestLog={version:1,seed:run.seed,startedAt:new Date().toISOString(),endedAt:null,result:null,deathRound:null,deathCause:null,score:0,finalHP:0,rounds:[]}; },
    startRound(run) { round(run); },
    recordMutationOptions(run, ids) { const entry=round(run); if (entry && !entry.mutationOffered.length) entry.mutationOffered=ids.slice(); },
    selectMutation(run, id, risk) { const entry=round(run); if (entry && entry.mutationSelected === null) { entry.mutationSelected=id; entry.mutationRisk=risk; } },
    recordRewardOptions(run, ids) { const entry=round(run); if (entry && !entry.rewardOffered.length) entry.rewardOffered=ids.slice(); },
    selectReward(run, id) { const entry=round(run); if (entry && entry.rewardSelected === null) entry.rewardSelected=id; },
    startCombat(run) { const entry=round(run); if (entry && entry.startHP === null) entry.startHP=run.player.hp; },
    recordAction(run, type) { const entry=round(run); const key={strike:"attack",guard:"guard",charge:"charge"}[type]; if (entry && key) entry.actions[key]++; },
    finishRound(run) { const entry=round(run); if (!entry || entry.endHP !== null) return; entry.endHP=run.player.hp; entry.turns=run.combat.turn; },
    finishRun(run) {
      const log=active(run);
      if (!log || log.result) return;
      this.finishRound(run);
      log.endedAt=new Date().toISOString(); log.result=run.phase === "VICTORY" ? "victory" : "game_over";
      log.deathRound=run.phase === "GAME_OVER" ? run.round : null;
      log.deathCause=run.phase === "GAME_OVER" ? run.deathReason : null;
      log.score=run.score; log.finalHP=run.player.hp;
      const logs=readLogs(); logs.push(log); localStorage.setItem(K.PLAYTEST_LOGS,JSON.stringify(logs.slice(-LIMIT)));
    },
    count() { return readLogs().length; },
    clear() { localStorage.removeItem(K.PLAYTEST_LOGS); },
    exportJSON() {
      const payload={version:1,exportedAt:new Date().toISOString(),totalRuns:this.count(),runs:readLogs()};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}), url=URL.createObjectURL(blob), link=document.createElement("a");
      link.href=url; link.download="created-to-kill-playtest-"+new Date().toISOString().slice(0,10)+".json"; link.click(); URL.revokeObjectURL(url);
    }
  };
}());
