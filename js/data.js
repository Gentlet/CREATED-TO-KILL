(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {};
  const mutation = (id,name,tier,description,incompatibleWith) => ({ id,name,tier,description,incompatibleWith:incompatibleWith || [] });
  const upgrade = (id,name,rarity,description,maxStacks) => ({ id,name,rarity,description,maxStacks:maxStacks || 1 });
  CTK.Data = {
    mutations: [
      mutation("thick_hide","두꺼운 피부",1,"최대 HP +12"), mutation("sharp_claws","날카로운 발톱",1,"모든 공격 피해 +1"), mutation("starting_shell","보호막",1,"전투 시작 시 Block 8"), mutation("regrowth","재생",1,"적 턴 종료마다 HP 2 회복"), mutation("barbs","가시",1,"플레이어가 공격할 때마다 1 고정 피해"), mutation("ambush","기습",1,"전투 첫 번째 적 공격 +4 피해"),
      mutation("armor_plates","철갑",2,"플레이어 공격 피해를 각각 1 감소"), mutation("blood_drinker","흡혈",2,"실제 HP 피해의 40% 회복"), mutation("counterlash","반격 본능",2,"같은 턴 두 번째 공격 시 4 피해"), mutation("frenzy","흥분",2,"한 턴 18 이상 피해 시 다음 공격 +4"), mutation("barricade","주기적 방벽",2,"매 3번째 플레이어 턴 Block 8"), mutation("fatigue_aura","피로 오라",2,"매 4번째 플레이어 턴 AP -1"),
      mutation("mirror_skin","반사 피부",3,"턴 첫 공격 피해의 40% 반사, 최대 6"), mutation("enrage","광폭화",3,"HP 40% 이하 시 공격력 +4"), mutation("mist","안개",3,"매 4번째 플레이어 턴 Intent 은닉",["chaos_engine"]), mutation("bleeding_aura","출혈 오라",3,"전투 첫 4턴 종료 시 2 피해"), mutation("reversal","방어 역전",3,"같은 턴 두 번째 방어 시 Block +7"), mutation("doom_clock","파멸의 시간",3,"7턴부터 공격 +5, 9턴부터 추가 +5"),
      mutation("second_heart","두 번째 심장",4,"처음 죽으면 최대 HP 25%로 부활"), mutation("twin_fang","쌍격",4,"두 번째 공격마다 70% 피해 2회",["chaos_engine"]), mutation("corrosion","부식 발톱",4,"HP 피해 시 전투 동안 방어 기본값 -1"), mutation("tripwire","행동 감지",4,"턴 세 번째 행동 시 5 피해"), mutation("shield_engine","보호막 엔진",4,"한 턴 20 이상 피해 시 다음 턴 Block 10"), mutation("doppelganger","흉내쟁이",4,"첫 행동을 적 턴 시작에 50% 복제"),
      mutation("deadline","시한부",5,"적 8턴 종료까지 생존하면 즉시 패배"), mutation("adaptive_shell","적응 갑각",5,"공격당 방어 +2, 턴당 최대 +6"), mutation("punisher","응징자",5,"Block 0 종료 시 다음 공격 +6"), mutation("berserker","진정한 광전사",5,"75/50/25% 통과마다 공격 +2"), mutation("chaos_engine","혼돈 엔진",5,"매 3번째 적 턴 행동 2회",["mist","twin_fang"]), mutation("death_burst","죽음의 폭발",5,"최종 사망 시 플레이어 14 피해")
    ],
    upgrades: [
      upgrade("honed_edge","연마된 검","common","공격 피해 +1",3), upgrade("reinforced_guard","강화 방어","common","방어량 +1",3), upgrade("strong_core","체력 강화","common","최대 HP와 즉시 HP +8",3), upgrade("focused_charge","집중 충전","common","충전 1스택당 피해 +2",3), upgrade("opening_guard","선제 방어","common","전투 시작 Block +6",2), upgrade("recovery_routine","회복 훈련","common","승리 회복량 +최대 HP 4%",3), upgrade("first_blood","선제타격","common","전투 첫 공격 +6"), upgrade("calm_mind","침착함","common","전투 첫 충전 AP 비용 0"), upgrade("scout","정찰","common","다음 Intent 표시"),
      upgrade("heavy_rhythm","공격 리듬","advanced","매 3번째 공격 +8"), upgrade("fortress","요새화","advanced","매 턴 첫 방어 +4"), upgrade("adrenaline","아드레날린","advanced","전투 첫 턴 AP +1"), upgrade("executioner","처형자","advanced","적 HP 30% 이하 공격 +4"), upgrade("armor_breaker","갑옷 파괴","advanced","적 방어력 최대 2 무시"), upgrade("retaliation","역공","advanced","완전 Block 시 적 5 피해"), upgrade("stored_power","축전","advanced","최대 충전 3"), upgrade("blood_rush","피의 질주","advanced","HP 피해 후 다음 공격 +5"), upgrade("second_wind","재기","advanced","전투당 1회 HP 25% 이하에서 10 회복"),
      upgrade("extra_action","초인적인 속도","rare","기본 최대 AP +1"), upgrade("master_edge","검의 달인","rare","공격 피해 +3"), upgrade("iron_wall","철벽","rare","방어량 +4"), upgrade("zero_cost_focus","완벽한 집중","rare","매 턴 첫 충전 AP 비용 0"), upgrade("guardian_angel","최후의 기회","rare","피해 lethal 1회 방지"), upgrade("vampiric_edge","흡혈검","rare","공격 피해의 20% 회복, 최대 3"), upgrade("overpower","압도","rare","충전 공격 +5 및 방어력 무시"), upgrade("stone_skin","강철 피부","rare","실제 HP 피해 -2"), upgrade("last_stand","최후의 저항","rare","HP 30% 이하 매 턴 AP +1")
    ]
  };
  CTK.Data.mutationById = Object.fromEntries(CTK.Data.mutations.map(x => [x.id,x]));
  CTK.Data.upgradeById = Object.fromEntries(CTK.Data.upgrades.map(x => [x.id,x]));
}());
