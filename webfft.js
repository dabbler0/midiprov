(function() {
  var CircleVis, NOTES_PER_MEASURE, TEMPO, THRESHOLD, WINDOW_SIZE, addCircles, addNotes, canvas, chordToFrequencies, chordToPentatonic, ctx, gold, lastNote, lastTheme, objects, pitchToFrequency, time, weightedAvg, white;

  WINDOW_SIZE = 2048;

  THRESHOLD = 1;

  MIDI.loadPlugin({
    soundfontUrl: 'bower_components/midi/soundfont/',
    instruments: ['acoustic_grand_piano', 'synth_drum', 'alto_sax'],
    callback: function() {
      MIDI.programChange(0, 0);
      MIDI.programChange(1, 118);
      MIDI.programChange(2, 65);
      return addNotes();
    }
  });

  canvas = document.getElementById('main');

  ctx = canvas.getContext('2d');

  white = [256, 256, 256];

  gold = [218, 165, 32];

  weightedAvg = function(a, b, p) {
    var el_, i, _i, _len, _results;
    _results = [];
    for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
      el_ = a[i];
      _results.push(Math.round(a[i] * (1 - p) + b[i] * p));
    }
    return _results;
  };

  CircleVis = (function() {
    function CircleVis() {
      this.location = {
        x: Math.random() * (canvas.width - 80) + 40,
        y: Math.random() * (canvas.height - 80) + 40
      };
      this.radius = Math.random() * 20 + 20;
    }

    CircleVis.prototype.tick = function() {
      return this.radius -= 0.2;
    };

    CircleVis.prototype.render = function(ctx) {
      ctx.globalAlpha = this.radius / 40;
      ctx.fillStyle = "rgb(" + (weightedAvg(white, gold, (40 - this.radius) / 35).join(',')) + ")";
      ctx.beginPath();
      ctx.arc(this.location.x, this.location.y, this.radius, 0, 2 * Math.PI);
      return ctx.fill();
    };

    return CircleVis;

  })();

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

  objects = [];

  addCircles = function() {
    var _i, _results;
    _results = [];
    for (_i = 1; _i <= 100; _i++) {
      _results.push(objects.push(new CircleVis()));
    }
    return _results;
  };

  setInterval((function() {
    var newObjects, object, _i, _len;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    newObjects = [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      object.tick();
      object.render(ctx);
      if (object.radius > 5) {
        newObjects.push(object);
      }
    }
    return objects = newObjects;
  }), 25);

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
      setTimeout((function() {
        return addCircles();
      }), time * 1000);
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
        if (Math.random() > 0.5) {
          themeNoteProbability = 1;
        } else {
          themeNoteProbability = 0.3;
        }
        if (NOTES_PER_MEASURE !== 1) {
          for (j = _l = 0; 0 <= NOTES_PER_MEASURE ? _l < NOTES_PER_MEASURE : _l > NOTES_PER_MEASURE; j = 0 <= NOTES_PER_MEASURE ? ++_l : --_l) {
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
    }
    return setTimeout(addNotes, time * 1000);
  };

}).call(this);

//# sourceMappingURL=webfft.js.map
