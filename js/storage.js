(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {}, K = CTK.Constants.STORAGE;
  const defaults = { highScore:0,totalRuns:0,totalClears:0,highestRound:0,tutorialSeen:false };
  const settings = { sound:true,reducedMotion:false };
  function read(key,fallback) { try { const raw=localStorage.getItem(key); if(raw===null)return fallback===null?null:Object.assign({},fallback); const value=JSON.parse(raw); return value && typeof value === "object" ? Object.assign({},fallback||{},value) : (fallback===null?null:Object.assign({},fallback)); } catch (_) { return fallback===null?null:Object.assign({},fallback); } }
  CTK.Storage = { loadRun(){ return read(K.RUN,null); }, saveRun(run){ localStorage.setItem(K.RUN,JSON.stringify(run)); }, clearRun(){ localStorage.removeItem(K.RUN); }, meta(){ return read(K.META,defaults); }, saveMeta(v){ localStorage.setItem(K.META,JSON.stringify(v)); }, settings(){ return read(K.SETTINGS,settings); }, saveSettings(v){ localStorage.setItem(K.SETTINGS,JSON.stringify(v)); } };
}());
