/* Terço Comigo (versão web): boas-vindas na primeira visita e convite para pôr o app na tela inicial
   depois do primeiro terço concluído. */
(function(){
  const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
  const $=id=>document.getElementById(id);
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const standalone=()=>{try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}};
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);

  function sheet(id,html){let el=$(id);if(!el){el=document.createElement("div");el.id=id;el.className="modal";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");document.body.append(el)}
    el.innerHTML=`<article class="page"><button class="mclose" type="button" aria-label="Fechar" data-x>✕</button>${html}</article>`;el.hidden=false;
    el.querySelector("[data-x]").onclick=()=>{el.hidden=true};return el}

  /* 1) Primeira visita: como a pessoa quer ser chamada (ou Google). Fechar no X = usar sem conta. */
  async function boasVindas(){
    if(lsGet("terco-bv")||!window.TC)return;
    const ok=window.claude&&await window.claude.use("db");if(!ok)return;
    const c=TC.info();if(!c.anon||c.name){lsSet("terco-bv","1");return}
    const el=sheet("bv",`<p class="rub">Bem-vindo</p><h2>Que bom rezar com você</h2>
      <p class="oratio">Como você quer ser chamado? Seu nome aparece só nas alavancas de oração, para quem pediu saber que você rezou.</p>
      <label class="col">Seu nome<input id="bv-n" maxlength="40" placeholder="Ex.: Maria Aparecida" autocomplete="given-name"></label>
      <button class="btn red" id="bv-ok" type="button">Começar a rezar</button>
      <button class="btn ghost" id="bv-g" type="button">Entrar com Google</button>
      <span class="small">Com o Google, seus terços e alavancas ficam guardados para usar em outro celular. Se preferir, feche e use sem conta.</span>
      <span class="small" id="bv-m" style="color:var(--rubric)"></span>`);
    const done=()=>{lsSet("terco-bv","1");el.hidden=true};
    el.querySelector("[data-x]").onclick=done;
    $("bv-ok").onclick=async()=>{const n=$("bv-n").value.trim();if(!n){$("bv-n").focus();return}
      try{await TC.setName(n)}catch(e){}done();if(typeof renderPerfil==="function"&&typeof tab!=="undefined"&&tab==="perfil")renderPerfil()};
    $("bv-g").onclick=async()=>{lsSet("terco-bv","1");try{await TC.google()}catch(e){lsSet("terco-bv","");const c=e&&e.code;
      $("bv-m").textContent=c==="auth/popup-closed-by-user"||c==="auth/cancelled-popup-request"?"":c==="auth/popup-blocked"?"O navegador bloqueou a janela do Google. Libere e tente de novo.":"Não foi possível entrar agora."+(c?` (${c})`:"")}};
  }

  /* 2) Depois do primeiro terço concluído: pôr o Terço Comigo na tela inicial */
  let deferred=null;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e});
  function telaInicial(){
    if(standalone()||lsGet("terco-a2hs"))return;
    const m=$("modal");if(m&&!m.hidden){setTimeout(telaInicial,3000);return}
    lsSet("terco-a2hs","1");
    const passos=deferred?`<button class="btn red" id="a2-i" type="button">Adicionar à tela inicial</button>`
      :ios?`<ol class="small" style="margin:0;padding-left:1.2em;line-height:1.6"><li>Toque no botão <b>Compartilhar</b> (o quadrado com a seta para cima). No Safari ele fica na barra de baixo; no Chrome, na barra do endereço.</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li></ol>`
      :`<ol class="small" style="margin:0;padding-left:1.2em;line-height:1.6"><li>Toque no menu do navegador (os três pontinhos).</li><li>Escolha <b>Adicionar à tela inicial</b> ou <b>Instalar app</b>.</li></ol>`;
    const el=sheet("a2",`<p class="rub">Para rezar todo dia</p><h2>Tenha o Terço Comigo na tela inicial</h2>
      <p class="oratio">Ele ganha um ícone como os outros aplicativos e abre direto, em tela cheia.</p>${passos}
      <button class="btn ghost" id="a2-n" type="button">Agora não</button>`);
    $("a2-n").onclick=()=>{el.hidden=true};
    if($("a2-i"))$("a2-i").onclick=async()=>{try{deferred.prompt();await deferred.userChoice}catch(e){}deferred=null;el.hidden=true};
    try{typeof track==="function"&&track(x=>{x.telaInicialSugerida=1})}catch(e){}
  }
  function vigiarFim(){const card=$("card");if(!card)return;
    new MutationObserver(()=>{if(card.classList.contains("end")&&!lsGet("terco-a2hs")&&!standalone())setTimeout(telaInicial,8000)}).observe(card,{attributes:true,attributeFilter:["class"]})}

  window.addEventListener("load",()=>{setTimeout(boasVindas,900);vigiarFim()});
})();
