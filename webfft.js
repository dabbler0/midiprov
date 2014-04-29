(function() {
  var NOTES_PER_MEASURE, TEMPO, THRESHOLD, WINDOW_SIZE, addNotes, chordToFrequencies, chordToPentatonic, lastNote, lastTheme, pitchToFrequency, time;

  WINDOW_SIZE = 2048;

  THRESHOLD = 1;

  MIDI.loadPlugin({
    soundfontUrl: '/bower_components/midi/soundfont/',
    instruments: ['acoustic_grand_piano', 'synth_drum', 'alto_sax'],
    callback: function() {
      MIDI.programChange(0, 0);
      MIDI.programChange(1, 118);
      MIDI.programChange(2, 65);
      return addNotes();
    }
  });

  pitchToFrequency = function(pitch) {
    var a, m, n, semitone;
    m = /^(\^\^|\^|__|_|=|)([A-Ga-g])(,+|'+|)$/.exec(pitch);
    n = {
      C: -9,
      D: -7,
      E: -5,
      F: -4,
      G: -2,
      A: 0,
      B: 2,
      c: 3,
      d: 5,
      e: 7,
      f: 8,
      g: 10,
      a: 12,
      b: 14
    };
    a = {
      '^^': 2,
      '^': 1,
      '': 0,
      '_': -1,
      '__': -2
    };
    semitone = n[m[2]] + a[m[1]] + (/,/.test(m[3]) ? -12 : 12) * m[3].length;
    return semitone + 69;
  };

  chordToFrequencies = function(chord) {
    var a, c, k, m, n, s, x;
    n = {
      C: -9,
      D: -7,
      E: -5,
      F: -4,
      G: -2,
      A: 0,
      B: 2
    };
    a = {
      '^': 1,
      '_': -1
    };
    s = {
      '': [0, 4, 7],
      'm': [0, 3, 7],
      '7': [0, 4, 7, 11],
      'd7': [0, 4, 7, 10],
      'm7': [0, 3, 7, 10],
      '07': [0, 3, 6, 10]
    };
    m = 0;
    if (chord[0] in a) {
      m = a[chord[0]];
      chord = chord.slice(1);
    }
    c = s[chord.slice(1)];
    x = n[chord[0]];
    return (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = c.length; _i < _len; _i++) {
        k = c[_i];
        _results.push((((x + m + k + 9) % 12) - 9) + 69);
      }
      return _results;
    })();
  };

  chordToPentatonic = function(chord) {
    var a, c, k, m, n, s, x;
    n = {
      C: -9,
      D: -7,
      E: -5,
      F: -4,
      G: -2,
      A: 0,
      B: 2
    };
    a = {
      '^': 1,
      '_': -1
    };
    s = {
      '': [-12, -10, -8, -5, 0, 2, 4, 7],
      'm': [-12, -9, -7, -5, 0, 3, 5, 7]
    };
    m = 0;
    if (chord[0] in a) {
      m = a[chord[0]];
      chord = chord.slice(1);
    }
    c = s[chord[1] === 'm' ? 'm' : ''];
    x = n[chord[0]];
    return (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = c.length; _i < _len; _i++) {
        k = c[_i];
        _results.push(((x + m + k + 9) - 9) + 69);
      }
      return _results;
    })();
  };

  TEMPO = 1;

  time = 0;

  NOTES_PER_MEASURE = 4;

  lastTheme = (function() {
    var _i, _results;
    _results = [];
    for (_i = 0; 0 <= NOTES_PER_MEASURE ? _i < NOTES_PER_MEASURE : _i > NOTES_PER_MEASURE; 0 <= NOTES_PER_MEASURE ? _i++ : _i--) {
      _results.push(0);
    }
    return _results;
  })();

  lastNote = null;

  addNotes = function() {
    var c, chord, i, j, k, note, p, themeNoteProbability, _i, _j, _k, _l, _len, _len1, _len2, _ref;
    time = 0;
    console.log('adding more notes');
    _ref = 'Dm7 Gd7 Dm7 Gd7 Em7 Ad7 Em7 Ad7 Am7 Dd7 _Am7 _Dd7 C7 C7 Dm7 Gd7 Dm7 Gd7 Em7 Ad7 Em7 Ad7 Am7 Dd7 _Am7 _Dd7 C7 C7 Gm7 Gm7 Cd7 Cd7 F7 F7 Am7 Am7 Dd7 Dd7 Gd7 Gd7 Dm7 Gd7 Dm7 Gd7 Em7 Ad7 Em7 Ad7 Am7 Dd7 _Am7 _Dd7 C7 C7'.split(' ');
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      chord = _ref[i];
      c = chordToFrequencies(chord);
      for (_j = 0, _len1 = c.length; _j < _len1; _j++) {
        note = c[_j];
        if (Math.random() > 0.5) {
          MIDI.noteOn(0, note, 80, time);
          MIDI.noteOff(0, note, time + 2 * TEMPO);
        } else {
          MIDI.noteOn(0, note, 80, time);
          MIDI.noteOff(0, note, time + TEMPO / 4);
          MIDI.noteOn(0, note, 80, time + TEMPO / 2);
          MIDI.noteOff(0, note, time + 2 * TEMPO);
        }
      }
      MIDI.noteOn(1, 50, 127, time);
      MIDI.noteOff(1, 50, time);
      MIDI.noteOn(1, 50, 80, time + TEMPO / 2);
      MIDI.noteOff(1, 50, time + TEMPO);
      p = chordToPentatonic(chord);
      if (Math.random() < 0.7) {
        for (j = _k = 0, _len2 = lastTheme.length; _k < _len2; j = ++_k) {
          k = lastTheme[j];
          if (k >= 0) {
            if (lastNote != null) {
              console.log('turning note off', lastNote, time);
              MIDI.noteOff(2, lastNote, time);
            }
            MIDI.noteOn(2, p[k], 127, time);
            lastNote = p[k];
          }
          if (j % 2 === 0) {
            time += 1 / 3 * TEMPO * 4 / NOTES_PER_MEASURE;
          } else {
            time += 1 / 6 * TEMPO * 4 / NOTES_PER_MEASURE;
          }
        }
      } else {
        lastTheme.length = 0;
        for (j = _l = 0; 0 <= NOTES_PER_MEASURE ? _l < NOTES_PER_MEASURE : _l > NOTES_PER_MEASURE; j = 0 <= NOTES_PER_MEASURE ? ++_l : --_l) {
          themeNoteProbability = Math.random() > 0.5 ? 1 : 0.3;
          if (Math.random() < themeNoteProbability) {
            note = p[k = Math.floor(Math.random() * p.length)];
            lastTheme.push(k);
            if (lastNote != null) {
              MIDI.noteOff(2, lastNote, time);
            }
            MIDI.noteOn(2, note, 127, time);
            lastNote = note;
          } else {
            lastTheme.push(-1);
          }
          if (j % 2 === 0) {
            time += 1 / 3 * TEMPO * 4 / NOTES_PER_MEASURE;
          } else {
            time += 1 / 6 * TEMPO * 4 / NOTES_PER_MEASURE;
          }
        }
      }
    }
    return setTimeout(addNotes, time * 1000);
  };

}).call(this);

//# sourceMappingURL=webfft.js.map
