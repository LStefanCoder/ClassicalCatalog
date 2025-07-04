//this is a separate module
//based on https://codesandbox.io/p/sandbox/midi-piano-player-v4u3x?file=%2Fsrc%2Fmidi%2Findex.js%3A2%2C1-3%2C41
import {SoundFont} from "soundfont-player";
import {MidiPlayer} from "midi-player-js";
import {ReverbJS} from "reverb.js";

//from https://codesandbox.io/p/sandbox/midi-piano-player-v4u3x?file=%2Fsrc%2Futils%2Fconstants.js%3A2%2C8-2%2C46
const SUSTAINED_NOTE_DURATION = 2;
const NON_SUSTAINED_NOTE_DURATION = 1;

export class midiPlayer {
    constructor(document) {
        this.audioContext = window.AudioContext || window.webkitAudioContext || false;
        this.safeAudioContext = new this.audioContext();
        this.instrument = null;
        this.midi = null;
        this.player = null;
        this.volume = 3;

        ReverbJS.extend(this.safeAudioContext);

        const reverbUrl = "../audio/Basement.m4a";
        this.reverbNode = this.safeAudioContext.createReverbFromUrl(
        reverbUrl,
            function () {
            this.reverbNode.connect(this.safeAudioContext.destination);
            }.bind(this)
        );
        
    }

    async setInstrument(instrumentUrl) {
        this.instrument = await SoundFont.instrument(
          this.safeAudioContext,
          instrumentUrl,
          {
            destination: this.reverbNode
          }
        );
    
        this.player = new MidiPlayer.Player((event) => {
          console.log(event);
          if (event.name === "Controller Change") {
            this.onControllerChange(event);
          } else if (event.name === "Note on") {
            this.onNoteOnEvent(event);
          } else if (event.name === "Note off") {
            this.onNoteOffEvent(event);
          }
        });
      }

      async setMidi(midiUrl) {
        // "../assets/chopin_etude_rev.mid"
        this.midi = await fetch(midiUrl).then((response) => response.arrayBuffer());
        this.player.loadArrayBuffer(this.midi);
      }
    
      playMidi() {
        this.player.play();
      }
    
      stopMidi() {
        this.player.stop();
        this.piano.repaintKeys();
      }
}