(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {};
  function next(state) { let x = state.rngState >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; state.rngState = x >>> 0; return state.rngState / 4294967296; }
  CTK.RNG = {
    newSeed() { const a = new Uint32Array(1); if (window.crypto && crypto.getRandomValues) { crypto.getRandomValues(a); return a[0] || 1; } return ((Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0) || 1; },
    next, int(state,max) { return Math.floor(next(state) * max); },
    shuffle(state,list) { const copy=list.slice(); for(let i=copy.length-1;i>0;i--){ const j=this.int(state,i+1); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; },
    pick(state,list) { return list.length ? list[this.int(state,list.length)] : null; }
  };
}());
