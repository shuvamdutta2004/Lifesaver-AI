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
