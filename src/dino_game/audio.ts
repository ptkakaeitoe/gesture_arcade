
export class AudioManager {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
  
    constructor() {
      // Lazy initialization
    }
  
    public init() {
      if (!this.ctx) {
        // Handle cross-browser audio context support
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  
    public toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }
  
    public getMuted() {
      return this.isMuted;
    }
  
    public play(sound: 'jump' | 'coin' | 'hit' | 'gameover' | 'levelup') {
      if (this.isMuted || !this.ctx) return;
  
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      osc.connect(gain);
      gain.connect(this.ctx.destination);
  
      switch (sound) {
        case 'jump':
          // Retro jump: Sine wave frequency slide up
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, t);
          osc.frequency.linearRampToValueAtTime(600, t + 0.15);
          
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.linearRampToValueAtTime(0, t + 0.15);
          
          osc.start(t);
          osc.stop(t + 0.15);
          break;
  
        case 'coin':
          // Coin pick up: Two quick high sine beeps
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, t);
          osc.frequency.setValueAtTime(1600, t + 0.05);
          
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
          
          osc.start(t);
          osc.stop(t + 0.1);
          break;
  
        case 'hit':
          // Damage: Sawtooth wave dropping in pitch (crunch sound)
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
          
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
          
          osc.start(t);
          osc.stop(t + 0.2);
          break;
  
        case 'gameover':
          // Game Over: Long descending slide
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, t);
          osc.frequency.linearRampToValueAtTime(50, t + 1.5);
          
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.linearRampToValueAtTime(0, t + 1.5);
          
          osc.start(t);
          osc.stop(t + 1.5);
          break;
  
        case 'levelup':
           // Speed up: Simple major arpeggio
          [440, 554, 659].forEach((freq, i) => {
             const o = this.ctx!.createOscillator();
             const g = this.ctx!.createGain();
             o.connect(g);
             g.connect(this.ctx!.destination);
             o.type = 'square';
             o.frequency.value = freq;
             const st = t + i * 0.08;
             g.gain.setValueAtTime(0.05, st);
             g.gain.linearRampToValueAtTime(0, st + 0.08);
             o.start(st);
             o.stop(st + 0.08);
          });
          break;
      }
    }
  }
  
  export const audioManager = new AudioManager();
  