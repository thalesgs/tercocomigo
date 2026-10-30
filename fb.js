/* Terço Comigo — ligação com o Firebase (versão web, fora do Claude).
   O app foi escrito para o banco e a identificação do Claude (window.claude.use("db"/"user")).
   Aqui as mesmas funções são entregues pelo Firebase: banco Firestore e entrada anônima,
   com a opção de entrar com Google para guardar o histórico e usar em outro aparelho. */
(function(){
  const CONFIG={
    apiKey:"AIzaSyDVXFC1x0ZeGnkwXgTohDtEdvaXFPDM_F8",
    authDomain:"terco-comigo.firebaseapp.com",
    projectId:"terco-comigo",
    storageBucket:"terco-comigo.firebasestorage.app",
    messagingSenderId:"48356241800",
    appId:"1:48356241800:web:8c8f5029452564f740ca3d"
  };
  /* Quem vê o Painel de testes e pode cadastrar a lista de paróquias */
  const OWNER="thalesgiorge@gmail.com";
  const LSN="terco-nome";
  const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};

  let auth=null,db=null,me=null;
  const ready=(async()=>{
    if(!window.firebase)return false;
    try{
      firebase.initializeApp(CONFIG);
      auth=firebase.auth();db=firebase.firestore();
      try{db.settings({ignoreUndefinedProperties:true,merge:true})}catch(e){}
      /* Espera o Firebase recuperar quem já entrou neste aparelho; só cria uma entrada anônima nova se não houver ninguém */
      me=await new Promise(res=>{let asked=false;const off=auth.onAuthStateChanged(u=>{
        if(u){off();res(u);return}
        if(!asked){asked=true;auth.signInAnonymously().catch(()=>{off();res(null)})}})});
      if(!me)return false;
      /* Perfil público mínimo: só o nome que a pessoa escolheu e a foto do Google, se entrou com ele */
      const name=nome();
      db.doc("perfis/"+me.uid).set({name:name||"",avatarUrl:me.photoURL||"",em:Date.now()},{merge:true}).catch(()=>{});
      if(isOwner())semear();
      return true}catch(e){console.warn("firebase",e);return false}
  })();

  function nome(){return lsGet(LSN)||(me&&me.displayName)||""}
  function isOwner(){return !!(me&&me.email&&me.email.toLowerCase()===OWNER&&me.emailVerified!==false)}
  function avatar(n){const l=(n||"✠").trim().charAt(0).toUpperCase();
    return "data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#f4ecda"/><text x="32" y="43" font-family="Georgia,serif" font-size="30" text-anchor="middle" fill="#a3221b">${l.replace(/[<&>"]/g,"")}</text></svg>`)}

  /* Primeira vez que o dono entra com o Google: cadastra as paróquias da diocese, se o banco estiver vazio */
  async function semear(){try{const s=await db.collection("paroquias").limit(1).get();if(!s.empty)return;
    const r=await fetch("paroquias-seed.json");const all=await r.json();const b=db.batch();
    Object.entries(all).forEach(([id,d])=>b.set(db.doc("paroquias/"+id),d));await b.commit()}catch(e){console.warn("semear",e)}}

  const userCap={
    id:async()=>me.uid,
    me:async()=>{const n=nome();return{id:me.uid,name:n,avatarUrl:me.photoURL||avatar(n),isOwner:isOwner()}},
    isOwner:async()=>isOwner(),
    profiles:async ids=>{const out={};await Promise.all([].concat(ids).filter(Boolean).map(async id=>{
      try{const s=await db.doc("perfis/"+id).get();const d=s.exists?s.data():{};out[id]={id,name:d.name||"",avatarUrl:d.avatarUrl||avatar(d.name)}}catch(e){}}));return out}
  };

  window.claude={use:async n=>{const ok=await ready;if(!ok)return null;
    if(n==="db")return db;if(n==="user")return userCap;return null}};

  /* Conta: nome nas alavancas, entrar com Google, sair */
  window.TC={
    info:()=>({anon:!me||me.isAnonymous,email:me&&me.email,name:nome()}),
    setName:async n=>{n=String(n||"").trim().slice(0,40);lsSet(LSN,n);if(db&&me)await db.doc("perfis/"+me.uid).set({name:n},{merge:true})},
    google:async()=>{const p=new firebase.auth.GoogleAuthProvider();
      try{if(me&&me.isAnonymous)await me.linkWithPopup(p);else await auth.signInWithPopup(p)}
      catch(e){if(e&&e.code==="auth/credential-already-in-use"&&e.credential)await auth.signInWithCredential(e.credential);else throw e}
      location.reload()},
    sair:async()=>{await auth.signOut();location.reload()}
  };
})();
