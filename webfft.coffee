WINDOW_SIZE = 2048
THRESHOLD = 1
MIDI.loadPlugin
  soundfontUrl: 'bower_components/midi/soundfont/'
  instruments: ['acoustic_grand_piano', 'synth_drum', 'alto_sax']
  callback: ->
    MIDI.programChange 0, 0
    MIDI.programChange 1, 118
    MIDI.programChange 2, 65
    addNotes()

canvas = document.getElementById 'main'
ctx = canvas.getContext '2d'

white = [256, 256, 256]
gold = [218, 165, 32]

weightedAvg = (a, b, p) -> Math.round(a[i] * (1 - p) + b[i] * p) for el_, i in a

class CircleVis
  constructor: ->
    @location = {
      x: Math.random() * (canvas.width - 80) + 40
      y: Math.random() * (canvas.height - 80) + 40
    }
    @radius = Math.random() * 20 + 20

  tick: ->
    @radius -= 0.2

  render: (ctx) ->
    ctx.globalAlpha = @radius / 40
    ctx.fillStyle = "rgb(#{weightedAvg(white, gold, (40 - @radius) / 35).join(',')})"
    ctx.beginPath()

    ctx.arc @location.x, @location.y, @radius, 0, 2 * Math.PI

    ctx.fill()

pitchToFrequency = (pitch) ->
  m = /^(\^\^|\^|__|_|=|)([A-Ga-g])(,+|'+|)$/.exec(pitch)
  n = {C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2,c:3,d:5,e:7,f:8,g:10,a:12,b:14}
  a = '^^':2, '^':1, '':0, '_':-1, '__':-2
  semitone = n[m[2]] + a[m[1]] + (if /,/.test(m[3]) then -12 else 12) * m[3].length

  return semitone + 69

chordToFrequencies = (chord) ->
  n = {C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}
  a = '^':1, '_':-1
  s = {
    '': [0, 4, 7] # Major triad
    'm': [0, 3, 7] # Minor triad

    '7': [0, 4, 7, 11] # Major 7
    'd7': [0, 4, 7, 10] # Dominant 7
    'm7': [0, 3, 7, 10] # Minor 7
    '07': [0, 3, 6, 10] # Half-diminished 7
  }

  m = 0
  if chord[0] of a
    m = a[chord[0]]
    chord = chord[1...]

  c = s[chord[1...]]; x = n[chord[0]]
  return ((((x + m + k + 9) % 12) - 9) + 69 for k in c)

chordToPentatonic = (chord) ->
  n = {C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}
  a = '^':1, '_':-1
  s = {
    '': [-12, -10, -8, -5, 0, 2, 4, 7]#, 9] # Major blues scale //pentatonic
    'm': [-12, -9, -7, -5, 0, 3, 5, 7]#, 10] # Minor blues scale //pentatonic
  }

  m = 0
  if chord[0] of a
    m = a[chord[0]]
    chord = chord[1..]

  c = s[if chord[1] is 'm' then 'm' else '']; x = n[chord[0]]
  return (((x + m + k + 9) - 9) + 69 for k in c)

objects = []
addCircles = ->
  for [1..100]
    objects.push new CircleVis()

setInterval (->
  ctx.clearRect 0, 0, canvas.width, canvas.height
  newObjects = []
  for object in objects
    object.tick()
    object.render(ctx)
    if object.radius > 5
      newObjects.push object

  objects = newObjects
), 25

TEMPO = 1
time = 0
NOTES_PER_MEASURE = 4
lastTheme = (0 for [0...NOTES_PER_MEASURE])
lastNote = null
addNotes = ->
  time = 0
  console.log 'adding more notes'
  # Satin doll:
  for chord, i in 'Dm7 Gd7 Dm7 Gd7 Em7 Ad7 Em7 Ad7 Am7 Dd7 _Am7 _Dd7 C7 C7 Dm7 Gd7 Dm7 Gd7 Em7 Ad7 Em7 Ad7 Am7 Dd7 _Am7 _Dd7 C7 C7 Gm7 Gm7 Cd7 Cd7 F7 F7 Am7 Am7 Dd7 Dd7 Gd7 Gd7 Dm7 Gd7 Dm7 Gd7 Em7 Ad7 Em7 Ad7 Am7 Dd7 _Am7 _Dd7 C7 C7'.split ' '
    setTimeout (->
      addCircles()), time * 1000
    c = chordToFrequencies chord

    for note in c
      if Math.random() > 0.5
        MIDI.noteOn 0, note, 80, time
        MIDI.noteOff 0, note, time + 2 * TEMPO
      else
        MIDI.noteOn 0, note, 80, time
        MIDI.noteOff 0, note, time + TEMPO / 4
        MIDI.noteOn 0, note, 80, time + TEMPO / 2
        MIDI.noteOff 0, note, time + 2 * TEMPO
    
    MIDI.noteOn 1, 50, 127, time
    MIDI.noteOff 1, 50, time

    MIDI.noteOn 1, 50, 80, time + TEMPO / 2
    MIDI.noteOff 1, 50, time + TEMPO
    
    p = chordToPentatonic chord
    
    if Math.random() < 0.7
      for k, j in lastTheme
        if k >= 0
          if lastNote? then console.log 'turning note off', lastNote, time; MIDI.noteOff 2, lastNote, time
          MIDI.noteOn 2, p[k], 127, time

          lastNote = p[k]

        if j % 2 is 0
          time += 1/3 * TEMPO * 4 / NOTES_PER_MEASURE
        else
          time += 1/6 * TEMPO * 4 / NOTES_PER_MEASURE

    else
      lastTheme.length = 0

      if Math.random() > 0.5
        themeNoteProbability = 1
      else
        themeNoteProbability = 0.3

      unless NOTES_PER_MEASURE is 1 then for j in [0...NOTES_PER_MEASURE]
        if Math.random() < themeNoteProbability
          note = p[k = Math.floor Math.random() * p.length]
          
          lastTheme.push k

          if lastNote? then MIDI.noteOff 2, lastNote, time
          MIDI.noteOn 2, note, 127, time

          lastNote = note

        else
          lastTheme.push -1

        if j % 2 is 0
          time += 1/3 * TEMPO * 4 / NOTES_PER_MEASURE
        else
          time += 1/6 * TEMPO * 4 / NOTES_PER_MEASURE

  setTimeout addNotes, time * 1000
