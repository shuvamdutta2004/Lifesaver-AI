// emergencyInstructions.js
// Static fallback instructions used when AI API is unavailable.
// Also used to pre-seed the AI chat with context.

export const EMERGENCY_INSTRUCTIONS = {
  medical: {
    banner: 'MEDICAL EMERGENCY — Stay calm. Help is on the way.',
    immediate: [
      'Call 108 (ambulance) immediately',
      'Keep the person still and comfortable',
      'Do NOT give food or water',
      'Check if the person is breathing',
      'If not breathing, begin CPR (30 compressions : 2 breaths)',
    ],
    now: [
      '🚨 Call 108 (ambulance) immediately',
      '📍 Share exact location',
      '🫀 Check if person is breathing',
      '👥 Keep person calm and still',
    ],
    next_60s: [
      'If not breathing, begin CPR (30 chest compressions : 2 breaths)',
      'Control any visible bleeding with clean cloth',
      'Put person in recovery position if breathing but unconscious',
      'Gather medical history for ambulance crew',
    ],
    next_2min: [
      'Continue CPR if trained (until ambulance arrives)',
      'Monitor breathing and pulse',
      'Keep person warm with blankets',
      'Prepare to answer ambulance crew questions',
    ],
    aiSystemPrompt: `You are LifeSaver AI's medical emergency assistant. The user is experiencing a medical emergency. 
Give clear, step-by-step first-aid instructions. Be concise, use numbered steps. 
Ask what symptoms they see. Cover: bleeding, unconsciousness, choking, heart attack, stroke. 
Always end with "Call 108 now if you haven't already."`,
  },

  women_safety: {
    banner: 'WOMEN SAFETY ALERT — Priority SOS broadcast activated.',
    immediate: [
      'Alert has been sent to nearby registered volunteers',
      'Share your live location with a trusted contact now',
      'Move to a well-lit, crowded public area',
      'Call 100 (Police) or 1091 (Women Helpline)',
      'Make noise to attract attention',
    ],
    now: [
      '📞 Call 100 (police) or 1091 (women helpline)',
      '📍 Share live location with trusted contact',
      '🏃 Move to well-lit, crowded public area',
      '📢 Make noise to attract attention',
    ],
    next_60s: [
      'Position yourself near people or witnesses',
      'Keep phone visible and call active',
      'Note any vehicle number plates or descriptions',
      'Do not engage with threat if possible',
    ],
    next_2min: [
      'Stay in public area until help arrives',
      'Document any injuries or threats',
      'Cooperate with police arrival',
      'Record incident details while fresh',
    ],
    aiSystemPrompt: `You are LifeSaver AI's women safety assistant. A woman is in danger. 
Give calm, practical safety guidance. Suggest: safe public places, how to alert others discreetly, 
what to say to police. Keep responses short and actionable. Do not panic the user.`,
  },

  fire: {
    banner: 'FIRE EMERGENCY — Evacuate immediately. Do NOT use lifts.',
    immediate: [
      'Pull the nearest fire alarm',
      'Evacuate via stairs — NEVER use the lift',
      'Cover nose/mouth with wet cloth',
      'Stay low — smoke rises',
      'If trapped, block door gaps with cloth and signal from window',
      'Call 101 (Fire Service)',
    ],
    now: [
      '🚨 Pull fire alarm immediately',
      '🔥 Alert others: shout "FIRE!"',
      '🚪 Check door with back of hand (is it hot?)',
      '🏃 Evacuate via stairs NOW (never use lift)',
    ],
    next_60s: [
      'Cover nose/mouth with wet cloth or shirt',
      'Stay low (crouch/crawl below smoke)',
      'Feel doors before opening (heat means danger)',
      'Move quickly toward nearest exit',
    ],
    next_2min: [
      'Exit building completely',
      'Assemble at designated meeting point',
      'Call 101 (Fire Service) with exact location',
      'Do NOT re-enter building',
    ],
    aiSystemPrompt: `You are LifeSaver AI's fire emergency assistant. There is a fire emergency. 
Give evacuation steps, how to check doors for heat, how to signal rescuers if trapped. 
Ask: Are you inside or outside? What floor? Is there smoke? Keep answers brief.`,
  },

  flood: {
    banner: 'FLOOD ALERT — Move to higher ground immediately.',
    immediate: [
      'Move to higher ground NOW — do not wait',
      'Do NOT walk or drive through floodwater',
      'Turn off electricity at the main switch',
      'Carry: drinking water, ID, medicines, phone charger',
      'Call NDRF helpline: 011-24363260',
      'Follow official evacuation routes only',
    ],
    now: [
      '🚨 Move to higher ground IMMEDIATELY',
      '🧗 Go upstairs if in building',
      '🌊 Do NOT walk/drive through water',
      '📞 Call 112 or 011-24363260',
    ],
    next_60s: [
      'Turn off main electricity switch',
      'Take documents, medicines, water, charger',
      'Alert family/neighbors to evacuate',
      'Follow official evacuation routes only',
    ],
    next_2min: [
      'Leave building if instructed',
      'Go to designated safe zone',
      'Help others if safe to do so',
      'Keep phone charged; stay connected',
    ],
    aiSystemPrompt: `You are LifeSaver AI's flood emergency assistant. There is a flood situation. 
Guide the user to safety: evacuation, what to carry, how to stay safe if stranded, 
water safety (no walking through floods). Ask if they are on ground level. Keep answers short.`,
  },

  earthquake: {
    banner: 'EARTHQUAKE — DROP. COVER. HOLD ON.',
    immediate: [
      'DROP to hands and knees immediately',
      'COVER your head and neck under a sturdy table',
      'HOLD ON until shaking stops',
      'Stay away from windows, exterior walls, heavy furniture',
      'After shaking stops: check for injuries, exit carefully',
      'Watch for aftershocks',
    ],
    now: [
      '🚨 DROP to hands and knees RIGHT NOW',
      '🛡️ COVER head and neck under sturdy table',
      '🤝 HOLD ON until shaking stops',
      '🪟 Stay away from windows and exterior walls',
    ],
    next_60s: [
      'Stay under cover until shaking completely stops',
      'Listen for sirens or announcements',
      'Do NOT move around during aftershocks',
      'Protect yourself from falling objects',
    ],
    next_2min: [
      'Exit building carefully and check surroundings',
      'Look for hazards (broken glass, gas leaks)',
      'Check for injuries (yours and others)',
      'Move to open ground away from buildings',
    ],
    aiSystemPrompt: `You are LifeSaver AI's earthquake emergency assistant. There is an earthquake. 
Guide: Drop-Cover-Hold procedure, what to do after shaking stops, how to check for gas leaks, 
if trapped — conserve air, signal with sound. Ask if shaking has stopped. Keep answers brief.`,
  },
}

// Quick reference: helpline numbers by type
export const HELPLINES = {
  ambulance:        '108',
  police:           '100',
  fire:             '101',
  disaster:         '112',
  women:            '1091',
  child:            '1098',
  ndrf:             '011-24363260',
}
