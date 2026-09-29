import {loadStore,dayFor} from './core.js';

// Import into separate spaces: never overwrite existing device history.
export function importBackup(current, raw, makeId=()=>crypto.randomUUID()) {
  if(typeof raw!=='string'||raw.length>5_000_000)throw Error('Choose a Kindly JSON backup smaller than 5 MB.');
  const loaded=loadStore({getItem:()=>raw});
  if(loaded.error||!raw.trim())throw Error('This file is not a valid Kindly backup. Nothing was changed.');
  const next=structuredClone(current);
  const imported=loaded.store.profiles.map(p=>({id:makeId(),name:p.name+' (restored)',data:p.data}));
  if(new Set([...next.profiles,...imported].map(p=>p.id)).size!==next.profiles.length+imported.length)throw Error('Could not create separate restored profiles. Try again.');
  next.profiles.push(...imported);
  next.activeId=imported[loaded.store.profiles.findIndex(p=>p.id===loaded.store.activeId)].id;
  return next;
}

export function recordMissedCheckin(state,date,today){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>today||date<'2000-01-01')throw Error('Choose a real date between 2000 and today.');
  dayFor(state,date).goals.care.done=true;
}
