const CAMINHOES = {
  leve: {
    nome: "300 a 5.550 — VW/9.170 DRC 4x2",
    minimo: 350,
    multiplicador: 3,
    divisor: 110,
    pesoMin: 300,
    pesoMax: 5550,
  },
  medio: {
    nome: "7.100 a 10.000 — VW 13-180",
    minimo: 500,
    multiplicador: 2,
    divisor: 105,
    pesoMin: 7100,
    pesoMax: 10000,
  },

  pesado: {
    nome: "11.000 a 22.390 — VM-360 8x2R BITRUCK",
    minimo: 1600,
    multiplicador: 2,
    divisor: 95,
    pesoMin: 11000 ,
    pesoMax: 22390 ,
  }
};

const $ = (id) => document.getElementById(id);
let ultimoCalculo = null;

function moneyBR(value){
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderErro(msg){
  $("resultado").innerHTML = `<div class="erro">${msg}</div>`;
}

function formatPhoneBR(value){
  const d = String(value || "").replace(/\D/g, "").slice(0, 11);

  // 11 dígitos: (##) #####-####
  if (d.length >= 11){
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
  }

  // 10 dígitos: (##) ####-####
  if (d.length >= 10){
    return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6,10)}`;
  }

  // parcial
  if (d.length >= 3){
    return `(${d.slice(0,2)}) ${d.slice(2)}`;
  }

  if (d.length >= 1){
    return `(${d}`;
  }

  return "";
}

function bindPhoneMask(id){
  const el = $(id);
  el.addEventListener("input", () => {
    const before = el.value;
    el.value = formatPhoneBR(before);
  });
}

bindPhoneMask("clienteTel");
bindPhoneMask("motoristaTel");

function renderResultado({ origem, destino, caminhaoNome, km, peso, bruto, minimo, total, aplicadoMinimo }){
  const badge = aplicadoMinimo
    ? `<span class="badge warn">Aplicado mínimo</span>`
    : `<span class="badge ok">Cálculo normal</span>`;

  $("resultado").innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      ${badge}
      <span class="badge">KM: ${km}</span>
      <span class="badge">Peso: ${peso.toLocaleString("pt-BR")} kg</span>
    </div>

    <hr />

    <div><strong>De:</strong> ${origem}</div>
    <div><strong>Para:</strong> ${destino}</div>
    <div style="margin-top:8px;"><strong>Caminhão:</strong> ${caminhaoNome}</div>

    <hr />

    <div><strong>Valor calculado:</strong> ${moneyBR(bruto)}</div>
    <div><strong>Mínimo do caminhão:</strong> ${moneyBR(minimo)}</div>

    <div style="margin-top:10px; font-size:18px;">
      <strong>Total do frete:</strong> ${moneyBR(total)}
    </div>
  `;
}

function calcularFrete({ km, peso, conf }){
  const bruto = (km * 0.12 * (peso * conf.multiplicador)) / conf.divisor;
  const total = bruto < conf.minimo ? conf.minimo : bruto;
  return { bruto, total, aplicadoMinimo: bruto < conf.minimo };
}

function textoRecibo(d){
  const agora = new Date();
  const data = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return `RECIBO DE FRETE - VPC
Data: ${data}  Hora: ${hora}

Cliente: ${d.cliente || "-"}
Tel Cliente: ${d.clienteTel || "-"}

Motorista: ${d.motorista || "-"}
Tel Motorista: ${d.motoristaTel || "-"}

De: ${d.origem}
Para: ${d.destino}

Caminhão: ${d.caminhaoNome}
Peso: ${d.peso.toLocaleString("pt-BR")} kg
Distância: ${d.km} km

Valor calculado: ${moneyBR(d.bruto)}
Mínimo do caminhão: ${moneyBR(d.minimo)}
TOTAL DO FRETE: ${moneyBR(d.total)}

Observação: ${d.aplicadoMinimo ? "Aplicado valor mínimo." : "Não Tem Valor Fiscal."}
`;
}

function mostrarRecibo(dados){
  const txt = textoRecibo(dados);
  const box = $("reciboBox");
  box.style.display = "block";

  box.innerHTML = `
    <div class="badge">Recibo</div>
    <hr />
    <pre style="white-space:pre-wrap; margin:0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; color: rgba(255,255,255,0.9);">${txt}</pre>

    <div class="recibo-actions">
      <button class="btn primary" id="btnImprimir">Imprimir / PDF</button>
      <button class="btn" id="btnCompartilhar">Compartilhar</button>
    </div>
  `;

  document.getElementById("btnImprimir").onclick = () => {
    const safe = txt.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Recibo</title>
      <meta charset="utf-8">
      <style>
        body{ font-family: Arial, sans-serif; padding: 24px; }
        pre{ white-space: pre-wrap; font-size: 14px; }
      </style>
      </head><body><pre>${safe}</pre></body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  document.getElementById("btnCompartilhar").onclick = async () => {
    try{
      if (navigator.share){
        await navigator.share({ title: "Recibo de Frete", text: txt });
      } else {
        await navigator.clipboard.writeText(txt);
        alert("Seu aparelho não tem compartilhar direto aqui. Copiei o recibo.");
      }
    } catch(e){}
  };
}

function limpar(){
  $("cliente").value = "";
  $("clienteTel").value = "";
  $("motorista").value = "";
  $("motoristaTel").value = "";

  $("origem").value = "";
  $("destino").value = "";
  $("peso").value = "";
  $("km").value = "";
  $("caminhao").value = "leve";

  $("resultado").innerHTML = `Preencha os dados e toque em <strong>Calcular frete</strong>.`;
  $("reciboBox").style.display = "none";
  $("reciboBox").innerHTML = "";

  ultimoCalculo = null;
  $("btnRecibo").disabled = true;
  $("btnCopiar").disabled = true;
}

function calcular(){
  const cliente = $("cliente").value.trim();
  const clienteTel = $("clienteTel").value.trim();
  const motorista = $("motorista").value.trim();
  const motoristaTel = $("motoristaTel").value.trim();

  const origem = $("origem").value.trim();
  const destino = $("destino").value.trim();
  const caminhaoKey = $("caminhao").value;
  const peso = Number($("peso").value);
  const km = Number($("km").value);

  if (!origem || !destino) return renderErro("Informe origem e destino.");
  if (km < 50) return renderErro("Distância mínima: 50 KM.");
  if (!Number.isFinite(peso) || peso <= 0) return renderErro("Informe o peso (KG).");

  const conf = CAMINHOES[caminhaoKey];
  if (!conf) return renderErro("Caminhão inválido.");

  if (peso < conf.pesoMin || peso > conf.pesoMax){
    return renderErro(`Peso fora da faixa do caminhão (${conf.pesoMin.toLocaleString("pt-BR")} a ${conf.pesoMax.toLocaleString("pt-BR")} kg).`);
  }

  const { bruto, total, aplicadoMinimo } = calcularFrete({ km, peso, conf });

  renderResultado({
    origem,
    destino,
    caminhaoNome: conf.nome,
    km,
    peso,
    bruto,
    minimo: conf.minimo,
    total,
    aplicadoMinimo
  });

  ultimoCalculo = {
    cliente, clienteTel, motorista, motoristaTel,
    origem, destino, caminhaoNome: conf.nome, km, peso, bruto,
    minimo: conf.minimo, total, aplicadoMinimo
  };

  $("btnRecibo").disabled = false;
  $("btnCopiar").disabled = false;
}

$("btnCalcular").addEventListener("click", calcular);
$("btnLimpar").addEventListener("click", limpar);

$("btnRecibo").addEventListener("click", () => {
  if (!ultimoCalculo) return;
  mostrarRecibo(ultimoCalculo);
});

$("btnCopiar").addEventListener("click", async () => {
  if (!ultimoCalculo) return;
  const txt = textoRecibo(ultimoCalculo);
  await navigator.clipboard.writeText(txt);
  alert("Recibo copiado! Agora é só colar no WhatsApp.");
});

// PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $("btnInstall").hidden = false;
});

$("btnInstall").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("btnInstall").hidden = true;
});
