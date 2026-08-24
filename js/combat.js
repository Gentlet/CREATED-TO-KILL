(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, E = CTK.Effects, S = CTK.State;
  const terminal = run => ["GAME_OVER","VICTORY","ROUND_RESULT"].includes(run.phase);
  const visual = (run,type,text) => (run.visualEvents || (run.visualEvents=[])).push({type,text});

  function finish(run, phase, reason) {
    if (terminal(run)) return;
    run.phase=phase;
    run.deathReason=reason || "";
    visual(run,phase === "GAME_OVER" ? "defeat" : "victory",phase === "GAME_OVER" ? "GAME OVER" : "VICTORY");
  }

  function victory(run) {
    if (run.phase === "GAME_OVER") return;
    run.score += 400 + run.round * 50 + run.selectedRisk * 150;
    const heal=Math.floor(run.player.maxHp * (.15 + .04 * E.st(run,"recovery_routine")));
    run.player.hp=Math.min(run.player.maxHp,run.player.hp + heal);
    S.log(run,"전투 승리 → HP +" + heal);
    if (run.round === 8) {
      run.score += 2500;
      finish(run,"VICTORY");
    } else {
      run.phase="ROUND_RESULT";
      visual(run,"victory","ROUND CLEARED");
    }
  }

  function playerDamage(run, amount, source) {
    const blocked=Math.min(run.player.block,amount);
    run.player.block-=blocked;
    const hp=Math.max(0,amount - blocked - (E.st(run,"stone_skin") ? 2 : 0));
    if (!hp && amount) {
      S.log(run,source + " → BLOCK");
      visual(run,"block","BLOCK");
    }
    if (hp) {
      run.player.hp-=hp;
      S.log(run,source + " → 플레이어 " + hp + " 피해");
      visual(run,"player-hit","-" + hp);
      if (source === "죽음의 폭발") visual(run,"death-burst","DEATH BURST");
      if (E.st(run,"second_wind") && !run.combat.secondWindUsed && run.player.hp > 0 && run.player.hp <= run.player.maxHp * .25) {
        run.combat.secondWindUsed=true;
        run.player.hp=Math.min(run.player.maxHp,run.player.hp + 10);
        S.log(run,"재기 → HP +10");
      }
      if (run.player.hp <= 0) {
        if (E.st(run,"guardian_angel") && !run.combat.guardianAngelUsed) {
          run.combat.guardianAngelUsed=true;
          run.player.hp=1;
          run.player.block=12;
          S.log(run,"최후의 기회 → HP 1 / Block 12");
          visual(run,"banner","GUARDIAN ANGEL");
        } else {
          run.player.hp=0;
          finish(run,"GAME_OVER",source);
        }
      }
    }
    return {blocked,hp,dead:run.phase === "GAME_OVER"};
  }

  function enemyDamage(run, amount, source) {
    const blocked=Math.min(run.enemy.block,amount);
    run.enemy.block-=blocked;
    const hp=Math.max(0,amount - blocked);
    if (hp) {
      run.enemy.hp-=hp;
      run.combat.damageToEnemyThisTurn+=hp;
      S.log(run,source + " → 적 " + hp + " 피해");
      visual(run,"enemy-hit","-" + hp);
      E.onEnemyDamage(run);
    }
    if (run.enemy.hp <= 0) {
      if (E.has(run,"second_heart") && !run.combat.secondHeartUsed) {
        run.combat.secondHeartUsed=true;
        run.enemy.hp=Math.ceil(run.enemy.maxHp * .25);
        S.log(run,"SECOND HEART → 부활");
        visual(run,"second-heart","SECOND HEART / REVIVED");
      } else {
        run.enemy.hp=0;
        if (!run.combat.deferEnemyDeath) resolveEnemyDeath(run);
      }
    }
    return {blocked,hp,dead:terminal(run)};
  }

  function resolveEnemyDeath(run) {
    if (run.enemy.hp !== 0 || run.phase === "GAME_OVER") return;
    if (E.has(run,"death_burst")) playerDamage(run,14,"죽음의 폭발");
    if (run.phase !== "GAME_OVER") victory(run);
  }

  function strike(run) {
    if (run.phase !== "PLAYER_TURN" || run.combat.ap < 1) return false;
    run.combat.ap--;
    run.combat.playerActionsThisTurn++;
    const charged=run.player.chargeStacks > 0;
    const raw=run.player.strikeBase + E.attackBonus(run) + E.chargeBonus(run);
    const damage=Math.max(1,raw - E.enemyArmor(run,charged && E.st(run,"overpower")));
    if (E.has(run,"armor_plates") && !(charged && E.st(run,"overpower"))) S.log(run,"철갑 → 공격 피해 -1");
    run.combat.strikesThisTurn++;
    run.combat.firstStrikeUsed=true;
    run.combat.bloodRushReady=false;
    run.player.chargeStacks=0;
    run.combat.deferEnemyDeath=true;
    const result=enemyDamage(run,damage,"공격");
    if (result.hp && E.st(run,"vampiric_edge")) {
      const heal=Math.min(3,Math.floor(result.hp * .2));
      if (heal) { run.player.hp=Math.min(run.player.maxHp,run.player.hp + heal); S.log(run,"흡혈검 → HP +" + heal); }
    }
    if (run.combat.damageToEnemyThisTurn >= 18 && E.has(run,"frenzy")) run.combat.frenzyReady=true;
    if (run.combat.damageToEnemyThisTurn >= 20 && E.has(run,"shield_engine")) run.combat.shieldEnginePending=true;
    if (E.has(run,"barbs")) playerDamage(run,1,"가시");
    if (run.phase !== "GAME_OVER" && E.has(run,"mirror_skin") && run.combat.strikesThisTurn === 1) playerDamage(run,Math.min(6,Math.floor(result.hp * .4)),"반사 피부");
    if (run.phase !== "GAME_OVER" && E.has(run,"adaptive_shell")) {
      const before=run.combat.temporaryEnemyArmor;
      run.combat.temporaryEnemyArmor=Math.min(6,before + 2);
      if (run.combat.temporaryEnemyArmor > before) S.log(run,"적응 갑각 → 방어 +" + (run.combat.temporaryEnemyArmor - before));
    }
    if (run.phase !== "GAME_OVER" && E.has(run,"counterlash") && run.combat.strikesThisTurn === 2 && !run.combat.counterlashUsed) {
      run.combat.counterlashUsed=true;
      playerDamage(run,4,"반격 본능");
    }
    run.combat.deferEnemyDeath=false;
    if (run.phase !== "GAME_OVER") resolveEnemyDeath(run);
    return true;
  }

  function guard(run) {
    if (run.phase !== "PLAYER_TURN" || run.combat.ap < 1) return false;
    run.combat.ap--; run.combat.playerActionsThisTurn++; run.combat.guardsThisTurn++;
    const amount=E.guard(run) + (run.combat.guardsThisTurn === 1 && E.st(run,"fortress") ? 4 : 0);
    run.player.block+=amount;
    S.log(run,"방어 → Block +" + amount);
    if (E.has(run,"reversal") && run.combat.guardsThisTurn >= 2 && !run.combat.reversalUsed) {
      run.combat.reversalUsed=true; run.enemy.block+=7; S.log(run,"방어 역전 → 적 Block +7");
    }
    return true;
  }

  function charge(run) {
    if (run.phase !== "PLAYER_TURN" || run.player.chargeStacks >= run.player.maxChargeStacks) return false;
    const free=(!run.combat.firstChargeUsed && E.st(run,"calm_mind")) || (run.combat.playerActionsThisTurn === 0 && E.st(run,"zero_cost_focus"));
    if (!free && run.combat.ap < 1) return false;
    if (!free) run.combat.ap--;
    run.combat.playerActionsThisTurn++; run.combat.firstChargeUsed=true; run.player.chargeStacks++;
    S.log(run,"충전 → " + run.player.chargeStacks + " stack");
    return true;
  }

  function playerAction(run, type) {
    const accepted=type === "strike" ? strike(run) : type === "guard" ? guard(run) : charge(run);
    if (!accepted) return false;
    if (!terminal(run) && E.has(run,"tripwire") && run.combat.playerActionsThisTurn === 3) playerDamage(run,5,"행동 감지");
    if (!terminal(run) && run.combat.mistConcealed) run.combat.mistConcealed=false;
    return true;
  }

  CTK.Combat={terminal,applyPlayerDamage:playerDamage,applyEnemyDamage:enemyDamage,resolveEnemyDeath,strike,guard,charge,playerAction};
}());
