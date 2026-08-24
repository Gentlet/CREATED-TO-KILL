(function () {
  "use strict";
  const CTK = window.CTK = window.CTK || {};
  let context;
  const frequencies = { attack:220, heavy:100, guard:440, hit:150, select:560, secondHeart:720, deathBurst:90, victory:660, defeat:80 };

  CTK.Audio = {
    play(kind) {
      if (!CTK.app || !CTK.app.settings.sound) return;
      try {
        context = context || new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequencies[kind] || 300;
        gain.gain.setValueAtTime(.045, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .13);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + .14);
      } catch (_) { }
    }
  };
}());
