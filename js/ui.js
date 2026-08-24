(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, D = CTK.Data, E = CTK.Effects;
  const $ = selector => document.querySelector(selector[0] === "#" ? selector : "#" + selector);
  const bar = (value, maximum, color) => {
    const percent = maximum > 0 ? Math.min(100, Math.max(0, 100 * value / maximum)) : 0;
    return `<div class="bar"><i class="fill ${color}" style="width:${percent}%"></i></div>`;
  };
  const button = (action, text, detail, disabled) => `<button class="action-button" data-action="${action}" ${disabled ? "disabled" : ""}><strong>${text}</strong>${detail ? `<span>${detail}</span>` : ""}</button>`;

  function cards(run, kind) {
    const ids = kind === "m" ? run.pendingMutationChoices : run.pendingRewardChoices;
    return `<section class="screen"><div class="hero"><h2>${kind === "m" ? "괴물에게 능력을 부여하십시오" : "보상을 선택하세요"}</h2><p>ROUND ${run.round}</p><div class="cards">${ids.map(id => {
      const item = kind === "m" ? D.mutationById[id] : D.upgradeById[id];
      return `<article class="card tier-${item.tier || 3}"><b class="rarity">${item.tier ? "★".repeat(item.tier) : item.rarity}</b><h3>${item.name}</h3><p>${item.description}</p><button class="button primary" data-select="${id}">선택</button></article>`;
    }).join("")}</div></div></section>`;
  }

  function mutationSummary(run) {
    return `<p class="run-summary"><b>ROUND ${run.round}</b> · 최종 HP ${run.player.hp}/${run.player.maxHp}</p><h3>선택한 Mutation</h3><ul class="summary-list">${run.enemy.mutations.map(id => `<li>${D.mutationById[id].name}</li>`).join("")}</ul>`;
  }
  function upgrades(run) {
    const acquired = D.upgrades.filter(item => (run.player.upgrades[item.id] || 0) > 0);
    return `<aside class="upgrades-panel" aria-label="My Upgrades"><h2>MY UPGRADES</h2>${acquired.length ? `<div class="upgrade-list">${acquired.map(item => {
      const count = run.player.upgrades[item.id];
      return `<article class="upgrade-entry"><div class="upgrade-heading"><h3>${item.name}</h3>${count > 1 ? `<span class="upgrade-count">×${count}</span>` : ""}</div><p>${item.description}</p></article>`;
    }).join("")}</div>` : `<p class="upgrades-empty">아직 획득한 Upgrade가 없습니다.</p>`}</aside>`;
  }
  function mutations(run) {
    const acquired = run.enemy.mutations.map(id => D.mutationById[id]).filter(Boolean);
    return `<aside class="mutations-panel" aria-label="Boss Mutations"><h2>BOSS MUTATIONS</h2>${acquired.length ? `<div class="mutation-list">${acquired.map(item => `<article class="mutation-entry"><div class="mutation-heading"><h3>${item.name}</h3><span class="mutation-risk">${"★".repeat(item.tier)}</span></div><p>${item.description}</p></article>`).join("")}</div>` : `<p class="mutations-empty">아직 부여된 Mutation이 없습니다.</p>`}</aside>`;
  }
  function playtestPanel() {
    return `<section class="playtest-panel"><b>PLAYTEST</b><span>Recorded Runs: ${CTK.Playtest.count()}</span><div><button class="button" data-playtest="export">Export JSON</button> <button class="button danger" data-playtest="clear">Clear Logs</button></div></section>`;
  }

  function battle(run) {
    const hidden = run.combat.mistConcealed;
    const intent = hidden ? "???" : CTK.Enemy.intentName(run.enemy.currentIntent);
    const intentPreview = hidden ? null : CTK.Enemy.preview(run);
    const intentDetail = !intentPreview ? "" : intentPreview.hits ? (intentPreview.hits.length === 2 ? `${intentPreview.hits[0]} Damage × 2` : `${intentPreview.damage} Damage`) : intentPreview.block !== undefined ? `Block +${intentPreview.block}` : intentPreview.attackBonus !== undefined ? `다음 공격 +${intentPreview.attackBonus}` : "";
    const chaosDetail = intentPreview?.chaos ? `<p class="intent-chaos">혼돈 엔진 · 이번 적 턴 Intent 2회</p>` : "";
    const attackDamage=CTK.Combat.previewStrikeDamage(run);
    const guardAmount=CTK.Combat.previewGuardAmount(run);
    const chargeGain=CTK.Combat.previewChargeGain(run);
    const chargeStacks=run.player.chargeStacks;
    const chargeDetail=`다음 공격 +${chargeGain}${chargeStacks ? ` · 현재 ${chargeStacks}/${run.player.maxChargeStacks}` : ""}`;
    return `<section class="battle">${mutations(run)}<div class="arena"><div class="topline"><b>ROUND ${run.round}</b><b>TURN ${run.combat.turn}</b></div><div class="combatant" data-combat-target="player">YOU · HP ${run.player.hp}/${run.player.maxHp} · BLOCK ${run.player.block}${bar(run.player.hp, run.player.maxHp, "hp")}</div><div class="combatant enemy">THE MONSTER · HP ${run.enemy.hp}/${run.enemy.maxHp} · BLOCK ${run.enemy.block}${bar(run.enemy.hp, run.enemy.maxHp, "enemy-hp")}<div class="monster" data-combat-target="enemy"><div class="eyes"><i class="eye"></i><i class="eye"></i></div><div class="mouth"></div></div><div class="intent"><b>다음 행동: ${intent}</b>${intentDetail ? `<strong class="intent-effect">${intentDetail}</strong>` : ""}${chaosDetail}${E.st(run,"scout") && !hidden ? `<p>다음: ${CTK.Enemy.intentName(run.enemy.nextIntent)}</p>` : ""}</div><div class="badges">${run.enemy.mutations.map(id => { const item=D.mutationById[id]; return `<button class="badge" aria-expanded="false">${item.name}<span class="tooltip">${item.description}</span></button>`; }).join("")}</div></div></div><aside class="controls"><b>AP ${"●".repeat(run.combat.ap)}${"○".repeat(Math.max(0,run.player.maxAp-run.combat.ap))}</b><b class="charge">충전 ${run.player.chargeStacks}/${run.player.maxChargeStacks}</b>${E.has(run,"deadline") ? `<b class="deadline">☠ DEADLINE ${8-run.combat.enemyTurnsCompleted}</b>` : ""}${button("strike","1 공격",`${attackDamage} Damage${chargeStacks ? ` · Charge ×${chargeStacks}` : ""}`,run.combat.ap<1)}${button("guard","2 방어",`+${guardAmount} Block`,run.combat.ap<1)}${button("charge","3 충전",chargeDetail,(!CTK.Combat.chargeIsFree(run) && run.combat.ap<1) || run.player.chargeStacks>=run.player.maxChargeStacks)}${button("end","턴 종료 SPACE","",false)}<ul class="log" aria-label="Combat Log">${run.logs.map(text => `<li>${text}</li>`).join("")}</ul></aside>${upgrades(run)}</section>`;
  }

  CTK.UI = {
    render() {
      const run=CTK.app.run, settings=CTK.app.settings;
      if (!run) $("app").innerHTML=`<section class="screen"><div class="hero"><h1>CREATED TO KILL</h1><p>내가 만든 괴물과 싸워 살아남으세요.</p>${CTK.app.resumableRun ? `<button class="button" data-resume>이어하기 · ROUND ${CTK.app.resumableRun.round}</button>` : ""}<button class="button primary" data-new>새로 만들기</button><p><button class="button" data-setting="sound">SOUND ${settings.sound ? "ON" : "OFF"}</button> <button class="button" data-setting="reducedMotion">MOTION ${settings.reducedMotion ? "LOW" : "ON"}</button></p>${playtestPanel()}</div></section>`;
      else if (run.phase === "MUTATION_SELECT") $("app").innerHTML=cards(run,"m");
      else if (run.phase === "REWARD_SELECT") $("app").innerHTML=cards(run,"u");
      else if (run.phase === "ROUND_RESULT") $("app").innerHTML=`<section class="screen"><div class="hero"><h2>ROUND CLEARED</h2><p class="score">${run.score}</p><button class="button primary" data-action="next">다음 라운드</button></div></section>`;
      else if (["GAME_OVER","VICTORY"].includes(run.phase)) $("app").innerHTML=`<section class="screen"><div class="hero"><h2>${run.phase === "VICTORY" ? "YOU SURVIVED YOUR CREATION" : "YOU CREATED YOUR KILLER"}</h2><p>${run.phase === "GAME_OVER" ? `사망 라운드 ${run.round} · ${run.deathReason}` : "승리"}</p>${mutationSummary(run)}<p class="score">최종 Score ${run.score}</p><button class="button primary" data-new>다시 만들기</button>${playtestPanel()}</div></section>`;
      else $("app").innerHTML=battle(run);
      document.body.classList.toggle("reduce-motion",!!settings.reducedMotion);
      if (run) this.fx(run);
    },
    fx(run) {
      const layer=$("fx-layer"), sounds={"player-hit":"hit","second-heart":"secondHeart","death-burst":"deathBurst",victory:"victory",defeat:"defeat"};
      const targetSelectors = {player:"[data-combat-target='player']",enemy:"[data-combat-target='enemy']"};
      const bannerTypes = ["banner","victory","defeat"];
      (run.visualEvents || []).forEach(event => {
        if (sounds[event.type] && CTK.Audio) CTK.Audio.play(sounds[event.type]);
        const element=document.createElement("i");
        element.className=bannerTypes.includes(event.type) ? "banner" : "float";
        element.textContent=event.text;
        if (!bannerTypes.includes(event.type)) {
          const selector=targetSelectors[event.target];
          const target=selector && document.querySelector(selector);
          if (!target) return;
          const rect=target.getBoundingClientRect();
          element.style.left=`${rect.left + rect.width / 2}px`;
          element.style.top=`${rect.top + rect.height / 2}px`;
        }
        layer.append(element);
        setTimeout(() => element.remove(),900);
      });
      run.visualEvents=[];
    }
  };
}());
