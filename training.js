export const modes = {
  gentle:{name:'No equipment',hint:'Walking, dancing & easy mobility',icon:'↗'},
  bodyweight:{name:'Bodyweight',hint:'Strength using your own body',icon:'◈'},
  weights:{name:'Dumbbells',hint:'Light weights & controlled movement',icon:'↔'}
};
const nhs='https://www.nhs.uk/live-well/exercise/strength-exercises/';
export const movements = {
  chair:{name:'Sit to stand',pace:'Try a few comfortable repetitions',how:['Use a firm, non-sliding chair, feet flat.','Lean forward a little; rise slowly.','Sit back down with control.'],easier:'Use your hands for support, or skip this movement.',tip:'Keep your gaze ahead.',demo:nhs,source:'NHS illustrated guide'},
  wall:{name:'Wall push-up',pace:'A few slow repetitions',how:['Put your palms on a wall at chest height.','Bend your elbows, bringing your body toward the wall.','Gently push back, keeping your back straight.'],easier:'Stand closer to the wall.',tip:'Move slowly; keep breathing.',demo:nhs,source:'NHS illustrated guide'},
  calf:{name:'Supported calf raise',pace:'A few controlled repetitions',how:['Hold a stable chair for balance.','Lift your heels gently.','Lower them slowly.'],easier:'Use a smaller movement or stay seated.',tip:'Keep your support steady.',demo:nhs,source:'NHS illustrated guide'},
  squat:{name:'Supported mini-squat',pace:'A few comfortable repetitions',how:['Hold a stable chair, feet apart.','Bend your knees a little while keeping your back straight.','Return gently to standing.'],easier:'Make the bend smaller, or skip it.',tip:'Stay within a comfortable range.',demo:nhs,source:'NHS illustrated guide'},
  curl:{name:'Light dumbbell curl',pace:'A few easy repetitions on each side',how:['Hold light dumbbells with arms at your sides.','Bend your elbows slowly.','Lower the weights without swinging.'],easier:'Sit down or practice without weights.',tip:'Keep your upper arms still.',demo:nhs,source:'NHS illustrated guide'},
  row:{name:'Supported dumbbell row',pace:'A few controlled repetitions on each side',how:['Support one hand and knee on a sturdy bench; hold a light dumbbell in your other hand.','Keep your back neutral and your abdomen gently braced. Pull the elbow up close to your side.','Lower the weight slowly. Repeat on the other side if comfortable.'],easier:'Practice the movement without a weight. Skip it if you do not have stable support.',tip:'Keep your shoulders level; avoid twisting.',demo:'https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/bent-over-row/vid-20084680',source:'Mayo Clinic video'},
  stroll:{name:'An easy walk or roll',pace:'A few minutes, or less if you prefer',how:['Choose a familiar, accessible place.','Set a pace where you feel comfortable.','Turn back whenever you like.'],easier:'Try a short indoor route or choose rest.',tip:'You decide the distance.'},
  dance:{name:'Move to one song',pace:'Part of a song is enough',how:['Clear a little space.','Choose music you enjoy.','Try gentle steps or seated movements.'],easier:'Small seated movements are welcome.',tip:'This is for enjoyment, not performance.'},
  mobility:{name:'Gentle shoulder movement',pace:'Slow and comfortable',how:['Find a comfortable sitting or standing position.','Try small, slow shoulder rolls.','Let your arms relax between movements.'],easier:'Make the circles smaller or take a break.',tip:'No forcing or stretching into pain.'}
};
export const routines = {
  walk:{name:'A little fresh air',mode:'gentle',time:'5 min',gear:'Nothing needed',description:'An easy walk or roll, at your pace.',moves:['stroll']},
  dance:{name:'One-song reset',mode:'gentle',time:'3 min',gear:'A song you like',description:'A small mood-lifting movement break.',moves:['dance']},
  stretch:{name:'Unwind & move',mode:'gentle',time:'3 min',gear:'Nothing needed',description:'Gentle movement for a quieter day.',moves:['mobility']},
  strength:{name:'Bodyweight basics',mode:'bodyweight',time:'5–10 min',gear:'A wall + stable chair',description:'Learn three simple strength movements.',moves:['chair','wall','calf']},
  bodylegs:{name:'Steady foundations',mode:'bodyweight',time:'5–8 min',gear:'A stable chair',description:'Comfortable, supported lower-body moves.',moves:['squat','calf']},
  dumbbells:{name:'Your first dumbbells',mode:'weights',time:'5–10 min',gear:'Light dumbbells + sturdy bench',description:'Two movements with an emphasis on control.',moves:['curl','row']}
};
export function completeSession(state,run,date) {
  const routine=routines[run.workout];
  if(!routine || !run.id || !Array.isArray(run.done)) throw Error('Invalid workout session.');
  const done=[...new Set(run.done)].filter(index=>Number.isInteger(index)&&index>=0&&index<routine.moves.length);
  if(!done.length) return false;
  state.sessions??=[];
  if(state.sessions.some(session=>session.id===run.id)) return false;
  state.sessions.push({id:run.id,date,workout:run.workout,completed:done.length,total:routine.moves.length});
  return true;
}
export function weeklyStats(state,days) {
  const sessions=(state.sessions||[]).filter(s=>days.includes(s.date));
  return {sessions:sessions.length,notes:state.logs.filter(n=>days.includes(n.date)).length,
    energy:days.map(date=>({date,value:state.days[date]?.energy||null})),
    modes:Object.fromEntries(Object.keys(modes).map(mode=>[mode,sessions.filter(s=>routines[s.workout]?.mode===mode).length]))};
}
