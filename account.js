import {getCloud,pushSave,validPayload} from './cloud.js';
import {cloudConfig} from './cloud-config.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user=null,busy=false,message='';let hooks;
export function accountPanel(){
 const profile=hooks?.profile();
 const ready=!!cloudConfig.url;
 return `<section class="card spaced" id="account-panel"><span class="eyebrow">YOUR ACCOUNT</span><h2>Your wins, on every device.</h2><p class="muted">Optional sign-in. Sync the current profile between Safari, your Home Screen app, and PC.</p>${!ready?'<p class="note">Account setup is in progress. Use a local backup for now.</p>':user?`<p>Signed in as <strong>${esc(user.email)}</strong></p><p class="form-note">${profile?.cloud?.userId===user.id?'Linked profile · last synced '+esc(new Date(profile.cloud.syncedAt).toLocaleString()):'This profile is only on this device until you save it to your account.'}</p><div class="actions"><button data-cloud="save" ${busy?'disabled':''}>Save this profile to account</button><button data-cloud="load" ${busy?'disabled':''}>Load account progress</button><button data-cloud="logout" ${busy?'disabled':''}>Sign out</button></div><p class="form-note">Sync is manual: save after making changes, then load on your other device. Loading creates a separate profile and keeps existing entries. Only this profile is uploaded—not other people’s profiles.</p><details><summary>Delete my cloud progress</summary><p>Your device copies stay here. This deletes the online save, not your sign-in account.</p><label class="field">Type DELETE to confirm<input id="cloud-delete-confirm" autocomplete="off"></label><button class="danger" data-cloud="delete" ${busy?'disabled':''}>Delete cloud progress</button></details>`:`<form id="account-form" class="fields"><label class="field">Email<input type="email" name="email" autocomplete="email" required maxlength="254"></label><label class="field">Password<input type="password" name="password" autocomplete="current-password" minlength="8" required></label><div class="actions"><button name="intent" value="login" class="primary" ${busy?'disabled':''}>Sign in</button><button name="intent" value="signup" ${busy?'disabled':''}>Create account</button></div><p class="form-note">Creating an account sends a confirmation email. Confirm it, then return here to sign in. Passwords are handled by Supabase, never saved in your export.</p></form>`}<p class="note">${user?'Saving to your account sends this profile’s name, check-ins, meal notes, workouts, and preferences to Kindly’s Supabase database. Other signed-in users cannot read your save. The app owner manages the database.':'Local mode stays available. Signing in sends your email and password to Supabase; it does not upload progress until you choose Save.'}</p><p role="status" class="form-note">${esc(message|| (busy?'Working…':''))}</p></section>`;
}
function refresh(){const panel=document.querySelector('#account-panel');if(panel)panel.outerHTML=accountPanel();}
export async function initAccount(callbacks){
 hooks=callbacks;
 if(cloudConfig.url){try{const c=await getCloud();const {data}=await c.auth.getSession();user=data.session?.user||null;c.auth.onAuthStateChange((_e,s)=>{user=s?.user||null;refresh();});refresh();}catch{message='Offline or sign-in unavailable. Your local progress is safe.';refresh();}}
 document.addEventListener('submit',async e=>{
  if(e.target.id!=='account-form')return;e.preventDefault();if(busy)return;
  const data=new FormData(e.target),intent=e.submitter?.value||'login';busy=true;message='';refresh();
  try{const c=await getCloud();const credentials={email:String(data.get('email')).trim(),password:String(data.get('password'))};const result=intent==='signup'?await c.auth.signUp(credentials):await c.auth.signInWithPassword(credentials);if(result.error)throw result.error;user=result.data.user&&result.data.session?result.data.user:null;message=intent==='signup'?'Check your email to confirm your account, then sign in here.':'Signed in. Load your account progress, or save this device’s current profile.';}catch(err){message=err.message||'Sign-in failed. Try again.';}finally{busy=false;refresh();}
 });
 document.addEventListener('click',async e=>{
  const action=e.target.closest('[data-cloud]')?.dataset.cloud;if(!action||busy)return;
  const confirm=document.querySelector('#cloud-delete-confirm')?.value;
  if(action==='delete'&&confirm!=='DELETE'){message='Type DELETE before deleting the online save.';refresh();return;}
  busy=true;message='';refresh();
  try{
   const c=await getCloud();const {data,error}=await c.auth.getUser();if(error||!data.user)throw Error('Please sign in again.');user=data.user;
   if(action==='logout'){const {error}=await c.auth.signOut({scope:'local'});if(error)throw error;user=null;message='Signed out. Local profiles remain on this device.';}
   if(action==='save'){const profile=hooks.profile();const row=await pushSave(c,profile,user.id);hooks.link(profile.id,{userId:user.id,revision:row.revision,syncedAt:row.updated_at});message='Saved to your account. On your other device, choose Load account progress.';}
   if(action==='load'){const {data:row,error}=await c.from('kindly_saves').select('*').eq('user_id',user.id).maybeSingle();if(error)throw error;if(!row)throw Error('No online save yet. Save progress from your original device first.');if(!validPayload(row.payload))throw Error('The online save could not be read. Your local profiles were kept.');hooks.restore(row.payload,{userId:user.id,revision:row.revision,syncedAt:row.updated_at});message='Loaded into a separate profile. Your previous local spaces are still available.';}
   if(action==='delete'){const {error}=await c.from('kindly_saves').delete().eq('user_id',user.id);if(error)throw error;hooks.unlink(user.id);message='Cloud progress deleted. Local copies and your sign-in account remain.';}
  }catch(err){message=err.message||'Could not connect. Your local progress is safe.';}finally{busy=false;refresh();}
 });
}
