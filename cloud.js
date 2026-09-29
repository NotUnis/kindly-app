import {cloudConfig} from './cloud-config.js';
import {validData} from './core.js';
export function cloudPayload(profile){return {name:profile.name,data:structuredClone(profile.data)};}
export function validPayload(p){return p&&typeof p.name==='string'&&p.name.length<=100&&validData(p.data);}
export class SaveConflict extends Error{constructor(){super('Another device has newer progress. Load its copy first; your current profile will stay on this device.');}}
export async function pushSave(client,profile,userId){
 const revision=profile.cloud?.userId===userId?profile.cloud.revision:0;
 const {data,error}=await client.rpc('kindly_save',{p_payload:cloudPayload(profile),p_revision:revision});
 if(error){if(error.code==='23505')throw new SaveConflict();throw Error('Cloud save failed. Your local progress is safe. Try again when connected.');}
 if(!data?.length)throw new SaveConflict();
 return data[0];
}
let client;
export async function getCloud(){
 if(!cloudConfig.url||!cloudConfig.key)throw Error('Account setup is not finished yet. Local backups still work.');
 if(!client){const {createClient}=await import('./supabase.js');client=createClient(cloudConfig.url,cloudConfig.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});}
 return client;
}
