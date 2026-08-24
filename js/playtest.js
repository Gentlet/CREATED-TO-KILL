(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, K = CTK.Constants.STORAGE;
  const LIMIT = 100;
  const METRIC_FIELDS = ["damageDealt","damageTaken","blockAbsorbed","healingReceived","maxSingleHit","enemyAttackActions","chargedAttackCount","playerAPSpent"];

  function active(run) { return run && run.playtestLog; }
  function prepareEntry(entry) {
    METRIC_FIELDS.forEach(field => { if (typeof entry[field] !== "number") entry[field]=0; });
    if (entry.recovery === undefined) entry.recovery=null;
    return entry;
  }
  function round(run) {
    const log = active(run);
    if (!log) return null;
    let entry = log.rounds.find(item => item.round === run.round);
    if (!entry) {
      entry = { round:run.round, mutationOffered:[], mutationSelected:null, mutationRisk:null, rewardOffered:[], rewardSelected:null, startHP:null, endHP:null, recovery:null, turns:0, actions:{attack:0,guard:0,charge:0}, damageDealt:0, damageTaken:0, blockAbsorbed:0, healingReceived:0, maxSingleHit:0, enemyAttackActions:0, chargedAttackCount:0, playerAPSpent:0 };
      log.rounds.push(entry);
    }
    return prepareEntry(entry);
  }
  function readLogs() {
    try { const value=JSON.parse(localStorage.getItem(K.PLAYTEST_LOGS)); return Array.isArray(value) ? value : []; } catch (_) { return []; }
  }
  function isDevelopment() { return typeof location !== "undefined" && ["localhost","127.0.0.1"].includes(location.hostname); }

  CTK.Playtest = {
    startRun(run) { run.playtestLog={version:2,seed:run.seed,startedAt:new Date().toISOString(),endedAt:null,result:null,deathRound:null,deathCause:null,score:0,finalHP:0,rounds:[]}; },
    startRound(run) { round(run); },
    recordMutationOptions(run, ids) { const entry=round(run); if (entry && !entry.mutationOffered.length) entry.mutationOffered=ids.slice(); },
    selectMutation(run, id, risk) { const entry=round(run); if (entry && entry.mutationSelected === null) { entry.mutationSelected=id; entry.mutationRisk=risk; } },
    recordRewardOptions(run, ids) { const entry=round(run); if (entry && !entry.rewardOffered.length) entry.rewardOffered=ids.slice(); },
    selectReward(run, id) { const entry=round(run); if (entry && entry.rewardSelected === null) entry.rewardSelected=id; },
    startCombat(run) { const entry=round(run); if (entry && entry.startHP === null) entry.startHP=run.player.hp; },
    recordAction(run, type) { const entry=round(run); const key={strike:"attack",guard:"guard",charge:"charge"}[type]; if (entry && key) entry.actions[key]++; },
    recordEnemyDamage(run, amount) { const entry=round(run); if (entry && amount > 0) { entry.damageDealt+=amount; entry.maxSingleHit=Math.max(entry.maxSingleHit,amount); } },
    recordPlayerDamage(run, amount, blocked) { const entry=round(run); if (!entry) return; if (amount > 0) entry.damageTaken+=amount; if (blocked > 0) entry.blockAbsorbed+=blocked; },
    recordHealing(run, amount) { const entry=round(run); if (entry && amount > 0) entry.healingReceived+=amount; },
    recordEnemyAttack(run) { const entry=round(run); if (entry) entry.enemyAttackActions++; },
    recordChargedAttack(run) { const entry=round(run); if (entry) entry.chargedAttackCount++; },
    recordAPSpent(run, amount) { const entry=round(run); if (entry && amount > 0) entry.playerAPSpent+=amount; },
    finishRound(run) { const entry=round(run); if (!entry || entry.endHP !== null) return; entry.endHP=run.player.hp; entry.turns=run.combat.turn; },
    recordRecovery(run, amount) { const entry=round(run); if (entry && entry.recovery === null) entry.recovery=Math.max(0,amount); },
    finishRun(run) {
      const log=active(run);
      if (!log || log.result || !["GAME_OVER","VICTORY"].includes(run.phase)) return;
      const result=run.phase === "VICTORY" ? "victory" : "game_over", deathRound=run.phase === "GAME_OVER" ? run.round : null, deathCause=run.phase === "GAME_OVER" ? run.deathReason : null, score=run.score, finalHP=run.player.hp;
      this.finishRound(run);
      if (isDevelopment() && log.rounds.length !== run.round) console.warn("Playtest round log count does not match reached round",{rounds:log.rounds.length,reachedRound:run.round});
      log.endedAt=new Date().toISOString(); log.result=result; log.deathRound=deathRound; log.deathCause=deathCause; log.score=score; log.finalHP=finalHP;
      const logs=readLogs(); logs.push(log); localStorage.setItem(K.PLAYTEST_LOGS,JSON.stringify(logs.slice(-LIMIT)));
    },
    count() { return readLogs().length; },
    clear() { localStorage.removeItem(K.PLAYTEST_LOGS); },
    exportJSON() {
      const payload={version:2,exportedAt:new Date().toISOString(),totalRuns:this.count(),runs:readLogs()};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}), url=URL.createObjectURL(blob), link=document.createElement("a");
      link.href=url; link.download="created-to-kill-playtest-"+new Date().toISOString().slice(0,10)+".json"; link.click(); URL.revokeObjectURL(url);
    }
  };
}());
