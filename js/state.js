(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, C = CTK.Constants, D = CTK.Data;
  const has = (run,id) => run.enemy.mutations.includes(id);
  const stacks = (run,id) => run.player.upgrades[id] || 0;
  const wagerById = id => C.WAGERS.find(wager => wager.id === id);
  const speedKillLimit = round => round <= 2 ? 3 : round <= 5 ? 4 : 5;
  const deriveWagerIndex = (seed,round,count) => ((Math.imul((seed >>> 0) ^ Math.imul(round,0x9e3779b1),0x85ebca6b) >>> 0) % count);
  function wagerStatus(run) {
    const wager=run.wager, definition=wager && wagerById(wager.id);
    if (!wager || !definition) return null;
    const progress=wager.progress;
    if (wager.result === "success") return {state:"SUCCESS", detail:"✓ SCORE +"+definition.score};
    if (wager.result === "failed") return {state:"FAILED", detail:"Bonus 없음"};
    if (wager.result === "skipped") return {state:"SKIPPED", detail:""};
    if (wager.id === "speed_kill") return {state:run.combat.turn > speedKillLimit(run.round) ? "FAILED" : "IN PROGRESS", detail:"TURN "+run.combat.turn+" / "+speedKillLimit(run.round)};
    if (wager.id === "no_guard") return {state:progress.guardsUsed ? "FAILED" : "IN PROGRESS", detail:progress.guardsUsed ? "Guard 사용" : "Guard 0회"};
    if (wager.id === "full_charge") return {state:progress.fullChargeAttack ? "READY" : "IN PROGRESS", detail:progress.fullChargeAttack ? "✓ Max Charge Attack" : "□ Max Charge Attack"};
    if (wager.id === "clean_fight") return {state:progress.damageTaken > 5 ? "FAILED" : "IN PROGRESS", detail:"Damage "+progress.damageTaken+" / 5"};
    return {state:progress.chargesUsed ? "FAILED" : "IN PROGRESS", detail:progress.chargesUsed ? "Charge 사용" : "Charge 0회"};
  }
  function wagerSucceeded(run) {
    const wager=run.wager, progress=wager.progress;
    if (wager.id === "speed_kill") return run.combat.turn <= speedKillLimit(run.round);
    if (wager.id === "no_guard") return progress.guardsUsed === 0;
    if (wager.id === "full_charge") return progress.fullChargeAttack;
    if (wager.id === "clean_fight") return progress.damageTaken <= 5;
    return progress.chargesUsed === 0;
  }
  function combat() { return { turn:0,ap:0,playerActionsThisTurn:0,strikesThisTurn:0,guardsThisTurn:0,damageToEnemyThisTurn:0,enemyAttackCount:0,enemyTurnsCompleted:0,temporaryEnemyArmor:0,corrosionStacks:0,firstEnemyAttackDone:false,secondHeartUsed:false,guardianAngelUsed:false,secondWindUsed:false,unbreakableUsed:false,decayUsed:false,firstStrikeUsed:false,firstChargeUsed:false,firstGuardUsed:false,bloodRushReady:false,shieldEnginePending:false,counterlashUsed:false,reversalUsed:false,mistConcealed:false,enraged:false,berserkerThresholdsTriggered:[],deferEnemyDeath:false }; }
  function player() { return { hp:60,maxHp:60,maxAp:3,strikeBase:7,guardBase:6,chargeBase:6,chargeStacks:0,maxChargeStacks:2,block:0,upgrades:{} }; }
  function enemy() { return { hp:0,maxHp:0,baseAttack:0,defenseAmount:0,block:0,mutations:[],intentQueue:[],currentIntent:null,nextIntent:null,roarBonus:0 }; }
  CTK.State = {
    create(seed) { return { version:C.VERSION,seed,rngState:seed,phase:C.PHASE.MUTATION_SELECT,round:1,score:0,player:player(),enemy:enemy(),combat:combat(),pendingMutationChoices:[],pendingRewardChoices:[],selectedRisk:0,rewardRerollsRemaining:1,logs:[],deathReason:"",finalScoreApplied:false }; },
    stacks, has,
    addUpgrade(run,id) { const n=stacks(run,id)+1; run.player.upgrades[id]=n; if(id==="strong_core"){run.player.maxHp+=8;run.player.hp+=8;} if(id==="extra_action")run.player.maxAp+=1; if(id==="stored_power")run.player.maxChargeStacks=3; },
    resetCombat(run) { const table=C.ROUNDS[run.round], e=run.enemy; e.maxHp=table.hp+(has(run,"thick_hide")?12:0); e.hp=e.maxHp; e.baseAttack=table.attack; e.defenseAmount=table.defense; e.block=0;e.roarBonus=0;e.intentQueue=[];e.currentIntent=null;e.nextIntent=null; run.player.chargeStacks=0;run.combat=combat(); if(has(run,"thick_hide"))this.log(run,"두꺼운 피부 → 적 최대 HP +12"); if(stacks(run,"opening_guard")){run.player.block+=6*stacks(run,"opening_guard");this.log(run,"선제 방어 → Block +"+(6*stacks(run,"opening_guard")));} if(has(run,"starting_shell")){e.block+=8;this.log(run,"보호막 → 적 Block +8");} },
    setPhase(run,phase) { run.phase=phase; },
    log(run,text) { run.logs.unshift(text); run.logs=run.logs.slice(0,C.LOG_LIMIT); }
  };
  CTK.Wager = {
    definition:wagerById,
    speedKillLimit,
    offer(run) {
      if (run.wager) return run.wager;
      const definition=C.WAGERS[deriveWagerIndex(run.seed,run.round,C.WAGERS.length)];
      run.wager={id:definition.id,accepted:null,result:null,scoreApplied:false,progress:{guardsUsed:0,chargesUsed:0,fullChargeAttack:false,damageTaken:0}};
      return run.wager;
    },
    choose(run,accepted) {
      if (!run.wager || run.wager.accepted !== null) return false;
      run.wager.accepted=accepted;
      if (!accepted) run.wager.result="skipped";
      return true;
    },
    recordAction(run,type,charged) {
      const wager=run.wager;
      if (!wager || !wager.accepted || wager.result) return;
      if (type === "guard") wager.progress.guardsUsed++;
      if (type === "charge") wager.progress.chargesUsed++;
      if (type === "strike" && charged && run.player.chargeStacks === run.player.maxChargeStacks) wager.progress.fullChargeAttack=true;
    },
    recordDamage(run,amount) { if (run.wager && run.wager.accepted && !run.wager.result && amount > 0) run.wager.progress.damageTaken+=amount; },
    status:wagerStatus,
    finish(run,won) {
      const wager=run.wager, definition=wager && wagerById(wager.id);
      if (!wager || !definition || wager.result) return;
      const success=!!won && wagerSucceeded(run);
      wager.result=success ? "success" : "failed";
      if (success && !wager.scoreApplied) { run.score+=definition.score; wager.scoreApplied=true; }
      if (CTK.Playtest) CTK.Playtest.recordWagerResult(run,wager.result,success ? definition.score : 0);
    }
  };
}());
