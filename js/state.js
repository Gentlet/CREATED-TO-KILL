(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, C = CTK.Constants, D = CTK.Data;
  const has = (run,id) => run.enemy.mutations.includes(id);
  const stacks = (run,id) => run.player.upgrades[id] || 0;
  function combat() { return { turn:0,ap:0,playerActionsThisTurn:0,strikesThisTurn:0,guardsThisTurn:0,damageToEnemyThisTurn:0,enemyAttackCount:0,enemyTurnsCompleted:0,temporaryEnemyArmor:0,corrosionStacks:0,firstEnemyAttackDone:false,secondHeartUsed:false,guardianAngelUsed:false,secondWindUsed:false,firstStrikeUsed:false,firstChargeUsed:false,firstGuardUsed:false,bloodRushReady:false,shieldEnginePending:false,counterlashUsed:false,reversalUsed:false,mistConcealed:false,enraged:false,berserkerThresholdsTriggered:[],deferEnemyDeath:false }; }
  function player() { return { hp:60,maxHp:60,maxAp:3,strikeBase:7,guardBase:6,chargeBase:6,chargeStacks:0,maxChargeStacks:2,block:0,upgrades:{} }; }
  function enemy() { return { hp:0,maxHp:0,baseAttack:0,defenseAmount:0,block:0,mutations:[],intentQueue:[],currentIntent:null,nextIntent:null,roarBonus:0 }; }
  CTK.State = {
    create(seed) { return { version:C.VERSION,seed,rngState:seed,phase:C.PHASE.MUTATION_SELECT,round:1,score:0,player:player(),enemy:enemy(),combat:combat(),pendingMutationChoices:[],pendingRewardChoices:[],selectedRisk:0,logs:[],deathReason:"",finalScoreApplied:false }; },
    stacks, has,
    addUpgrade(run,id) { const n=stacks(run,id)+1; run.player.upgrades[id]=n; if(id==="strong_core"){run.player.maxHp+=8;run.player.hp+=8;} if(id==="extra_action")run.player.maxAp+=1; if(id==="stored_power")run.player.maxChargeStacks=3; },
    resetCombat(run) { const table=C.ROUNDS[run.round], e=run.enemy; e.maxHp=table.hp+(has(run,"thick_hide")?12:0); e.hp=e.maxHp; e.baseAttack=table.attack; e.defenseAmount=table.defense; e.block=0;e.roarBonus=0;e.intentQueue=[];e.currentIntent=null;e.nextIntent=null; run.player.chargeStacks=0;run.combat=combat(); if(has(run,"thick_hide"))this.log(run,"두꺼운 피부 → 적 최대 HP +12"); if(stacks(run,"opening_guard")){run.player.block+=6*stacks(run,"opening_guard");this.log(run,"선제 방어 → Block +"+(6*stacks(run,"opening_guard")));} if(has(run,"starting_shell")){e.block+=8;this.log(run,"보호막 → 적 Block +8");} },
    setPhase(run,phase) { run.phase=phase; },
    log(run,text) { run.logs.unshift(text); run.logs=run.logs.slice(0,C.LOG_LIMIT); }
  };
}());
