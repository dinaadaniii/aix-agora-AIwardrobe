"use strict";
/* AGORA · Storage: IndexedDB on this device */
/* ---------- storage: IndexedDB per username, on this device ---------- */
const DB={db:null,mem:{},
    async open(){try{this.db=await new Promise((res,rej)=>{const r=indexedDB.open("agora",1);r.onupgradeneeded=()=>r.result.createObjectStore("users",{keyPath:"username"});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}catch(e){this.db=null}},
    req(mode,fn){return new Promise((res,rej)=>{try{const tx=this.db.transaction("users",mode);const st=tx.objectStore("users");const r=fn(st);tx.oncomplete=()=>res(r&&r.result);tx.onerror=()=>rej(tx.error)}catch(e){rej(e)}})},
    async all(){if(!this.db)return Object.values(this.mem);try{return await this.req("readonly",s=>s.getAll())}catch(e){return Object.values(this.mem)}},
    async get(u){if(!this.db)return this.mem[u]||null;try{return(await this.req("readonly",s=>s.get(u)))||null}catch(e){return this.mem[u]||null}},
    async put(user){this.mem[user.username]=user;if(!this.db)return;try{await this.req("readwrite",s=>s.put(user))}catch(e){toast("Couldn't save on this device. Storage may be full or blocked.")}},
    async del(u){delete this.mem[u];if(!this.db)return;try{await this.req("readwrite",s=>s.delete(u))}catch(e){}},
};
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

function newUser(username,withSample,gender){
    const u={username,gender:gender||"female",created:Date.now(),city:"ansan",items:[],schedule:{},history:[],prefs:{}};
    return u;
}
