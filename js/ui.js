(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, D = CTK.Data, E = CTK.Effects;
  const $ = selector => document.querySelector(selector[0] === "#" ? selector : "#" + selector);
  const bar = (value, maximum, color) => `<div class="bar"><i class="fill ${color}" style="width:${100 * Math.max(0, value) / maximum}%"></i></div>`;
  const button = (action, text, disabled) => `<button class="action-button" data-action="${action}" ${disabled ? "disabled" : ""}>${text}</button>`;

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

  function battle(run) {
    const hidden = run.combat.mistConcealed;
    const intent = hidden ? "???" : CTK.Enemy.intentName(run.enemy.currentIntent);
    return `<section class="battle"><div class="arena"><div class="topline"><b>ROUND ${run.round}</b><b>TURN ${run.combat.turn}</b></div><div class="combatant">YOU · HP ${run.player.hp}/${run.player.maxHp} · BLOCK ${run.player.block}${bar(run.player.hp, run.player.maxHp, "hp")}</div><div class="combatant enemy">THE MONSTER · HP ${run.enemy.hp}/${run.enemy.maxHp} · BLOCK ${run.enemy.block}${bar(run.enemy.hp, run.enemy.maxHp, "enemy-hp")}<div class="monster"><div class="eyes"><i class="eye"></i><i class="eye"></i></div><div class="mouth"></div></div><div class="intent"><b>다음 행동: ${intent}</b>${E.st(run,"scout") && !hidden ? `<p>다음: ${CTK.Enemy.intentName(run.enemy.nextIntent)}</p>` : ""}</div><div class="badges">${run.enemy.mutations.map(id => { const item=D.mutationById[id]; return `<button class="badge" aria-expanded="false">${item.name}<span class="tooltip">${item.description}</span></button>`; }).join("")}</div></div></div><aside class="controls"><b>AP ${"●".repeat(run.combat.ap)}${"○".repeat(Math.max(0,run.player.maxAp-run.combat.ap))}</b><b class="charge">충전 ${run.player.chargeStacks}/${run.player.maxChargeStacks}</b>${E.has(run,"deadline") ? `<b class="deadline">☠ DEADLINE ${8-run.combat.enemyTurnsCompleted}</b>` : ""}${button("strike","1 공격",run.combat.ap<1)}${button("guard","2 방어",run.combat.ap<1)}${button("charge","3 충전",run.combat.ap<1||run.player.chargeStacks>=run.player.maxChargeStacks)}${button("end","턴 종료 SPACE",false)}<ul class="log" aria-label="Combat Log">${run.logs.map(text => `<li>${text}</li>`).join("")}</ul></aside></section>`;
  }

  CTK.UI = {
    render() {
      const run=CTK.app.run, settings=CTK.app.settings;
      if (!run) $("app").innerHTML=`<section class="screen"><div class="hero"><h1>CREATED TO KILL</h1><p>내가 만든 괴물과 싸워 살아남으세요.</p>${CTK.app.resumableRun ? `<button class="button" data-resume>이어하기 · ROUND ${CTK.app.resumableRun.round}</button>` : ""}<button class="button primary" data-new>새로 만들기</button><p><button class="button" data-setting="sound">SOUND ${settings.sound ? "ON" : "OFF"}</button> <button class="button" data-setting="reducedMotion">MOTION ${settings.reducedMotion ? "LOW" : "ON"}</button></p></div></section>`;
      else if (run.phase === "MUTATION_SELECT") $("app").innerHTML=cards(run,"m");
      else if (run.phase === "REWARD_SELECT") $("app").innerHTML=cards(run,"u");
      else if (run.phase === "ROUND_RESULT") $("app").innerHTML=`<section class="screen"><div class="hero"><h2>ROUND CLEARED</h2><p class="score">${run.score}</p><button class="button primary" data-action="next">다음 라운드</button></div></section>`;
      else if (["GAME_OVER","VICTORY"].includes(run.phase)) $("app").innerHTML=`<section class="screen"><div class="hero"><h2>${run.phase === "VICTORY" ? "YOU SURVIVED YOUR CREATION" : "YOU CREATED YOUR KILLER"}</h2><p>${run.phase === "GAME_OVER" ? `사망 라운드 ${run.round} · ${run.deathReason}` : "승리"}</p>${mutationSummary(run)}<p class="score">최종 Score ${run.score}</p><button class="button primary" data-new>다시 만들기</button></div></section>`;
      else $("app").innerHTML=battle(run);
      document.body.classList.toggle("reduce-motion",!!settings.reducedMotion);
      if (run) this.fx(run);
    },
    fx(run) {
      const layer=$("fx-layer"), sounds={"player-hit":"hit","second-heart":"secondHeart","death-burst":"deathBurst",victory:"victory",defeat:"defeat"};
      (run.visualEvents || []).forEach(event => {
        if (sounds[event.type] && CTK.Audio) CTK.Audio.play(sounds[event.type]);
        const element=document.createElement("i");
        element.className=event.type === "banner" ? "banner" : "float";
        element.textContent=event.text;
        layer.append(element);
        setTimeout(() => element.remove(),900);
      });
      run.visualEvents=[];
    }
  };
}());
