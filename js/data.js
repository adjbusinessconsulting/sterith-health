/* Sterith Workout — data layer: exercise database, seed data, storage helpers */
(function (global) {
  'use strict';

  // ---- Default exercise library ---------------------------------------------
  // Each category has a name, an id, and a list of common exercises.
  // "type" hints the tracker at what fields matter: "strength" (weight+reps)
  // or "cardio" (time+distance). Everything is still editable by the user.
  const DEFAULT_LIBRARY = [
    { id: 'chest', name: 'Chest', builtin: true, type: 'strength', exercises: [
      'Barbell Bench Press', 'Incline Barbell Press', 'Dumbbell Bench Press',
      'Incline Dumbbell Press', 'Dumbbell Flies', 'Machine Flies (Pec Deck)',
      'Machine Chest Press', 'Cable Crossover', 'Decline Bench Press', 'Push Ups'
    ]},
    { id: 'back', name: 'Back', builtin: true, type: 'strength', exercises: [
      'Deadlift', 'Pull Ups', 'Lat Pulldown', 'Wide Grip Pulldown',
      'Bent Over Barbell Row', 'Seated Cable Row', 'T-Bar Row',
      'Single Arm Dumbbell Row', 'Machine Row', 'Face Pull', 'Machine Pullback'
    ]},
    { id: 'shoulder', name: 'Shoulder', builtin: true, type: 'strength', exercises: [
      'Overhead Barbell Press', 'Machine Shoulder Press', 'Dumbbell Shoulder Press',
      'Arnold Press', 'Lateral Raises', 'Machine Lateral Raises', 'Cable Lateral Raise',
      'Front Raises', 'Rear Delt Fly', 'Upright Row', 'Shrugs'
    ]},
    { id: 'arms', name: 'Arms', builtin: true, type: 'strength', exercises: [
      'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
      'Cable Curl', 'Machine Curls', 'Tricep Pushdown', 'Cable Overhead Tri Extension',
      'Skull Crushers', 'Close Grip Bench Press', 'Dips'
    ]},
    { id: 'leg', name: 'Leg', builtin: true, type: 'strength', exercises: [
      'Barbell Squat', 'Leg Press', 'Hack Squat', 'Leg Extension', 'Leg Curl',
      'Romanian Deadlift', 'Walking Lunges', 'Bulgarian Split Squat',
      'Hip Thrust', 'Goblet Squat', 'Calf Raises'
    ]},
    { id: 'abs', name: 'Abs', builtin: true, type: 'strength', exercises: [
      'Crunches', 'Sit Ups', 'Plank', 'Hanging Leg Raise', 'Lying Leg Raise',
      'Cable Crunch', 'Russian Twist', 'Bicycle Crunch', 'Abs Machine', 'Mountain Climbers'
    ]},
    { id: 'cardio', name: 'Cardio', builtin: true, type: 'cardio', exercises: [
      'Treadmill Run', 'Outdoor Running', 'Cycling', 'Rowing Machine',
      'Elliptical', 'Stair Climber', 'Jump Rope', 'Incline Walk', 'Swimming'
    ]}
  ];

  // ---- Storage keys ---------------------------------------------------------
  const K = {
    library: 'sterith_library',
    routines: 'sterith_routines',
    logs: 'sterith_logs',
    weight: 'sterith_weight',
    checkins: 'sterith_checkins',
    profile: 'sterith_profile',
    settings: 'sterith_settings',
    draft: 'sterith_session_draft'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Build the library on first run: default categories + exercises turned into
  // objects with ids so they can be individually referenced / customised.
  function seedLibrary() {
    const lib = DEFAULT_LIBRARY.map(function (cat) {
      return {
        id: cat.id,
        name: cat.name,
        builtin: cat.builtin,
        type: cat.type,
        exercises: cat.exercises.map(function (name) {
          return { id: uid(), name: name, builtin: true };
        })
      };
    });
    write(K.library, lib);
    return lib;
  }

  const Store = {
    K: K,
    uid: uid,

    getLibrary: function () {
      let lib = read(K.library, null);
      if (!lib) lib = seedLibrary();
      return lib;
    },
    saveLibrary: function (lib) { write(K.library, lib); },

    getRoutines: function () { return read(K.routines, []); },
    saveRoutines: function (r) { write(K.routines, r); },

    getLogs: function () { return read(K.logs, []); },
    saveLogs: function (l) { write(K.logs, l); },

    getWeight: function () { return read(K.weight, []); },
    saveWeight: function (w) { write(K.weight, w); },

    getCheckins: function () { return read(K.checkins, []); },
    saveCheckins: function (c) { write(K.checkins, c); },

    getProfile: function () {
      return read(K.profile, { name: '', address: '', whatsapp: '', height: '', heightUnit: 'cm', gender: '' });
    },
    saveProfile: function (p) { write(K.profile, p); },

    getSettings: function () {
      return read(K.settings, { unit: 'kg' }); // weight unit for lifts + bodyweight
    },
    saveSettings: function (s) { write(K.settings, s); },

    getDraft: function () { return read(K.draft, null); },
    saveDraft: function (d) { write(K.draft, d); },
    clearDraft: function () { localStorage.removeItem(K.draft); },

    exportAll: function () {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        library: this.getLibrary(),
        routines: this.getRoutines(),
        logs: this.getLogs(),
        weight: this.getWeight(),
        checkins: this.getCheckins(),
        profile: this.getProfile(),
        settings: this.getSettings()
      };
    },
    importAll: function (data) {
      if (!data || typeof data !== 'object') throw new Error('Invalid file');
      if (data.library) write(K.library, data.library);
      if (data.routines) write(K.routines, data.routines);
      if (data.logs) write(K.logs, data.logs);
      if (data.weight) write(K.weight, data.weight);
      if (data.checkins) write(K.checkins, data.checkins);
      if (data.profile) write(K.profile, data.profile);
      if (data.settings) write(K.settings, data.settings);
    }
  };

  global.SterithStore = Store;
})(window);
