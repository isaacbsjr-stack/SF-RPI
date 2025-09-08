let entregas = [];
let historico = [];
let ultimoIndiceSeparado = null;

const colunasObrigatorias = [
  "Sequencia",
  "Codigo do produto",
  "Placa do Veiculo",
  "Destinatário Nome",
  "Destinatário Endereço",
  "Destinatário Endereço Número",
  "Destinatario Bairro",
  "Destinatario Cidade",
  "Destinatario Estado",
  "Nº da Nota Fiscal",
  "Nota Fiscal/Volumes",
  "Entregas",
  "Produtos/Quantidade"
];

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheetRaw = workbook.Sheets[sheetName];

    const cabecalho = XLSX.utils.sheet_to_json(sheetRaw, { header: 1 })[0] || [];
    const faltando = colunasObrigatorias.filter(col => !cabecalho.includes(col));
    if (faltando.length > 0) {
      alert("A planilha está faltando as seguintes colunas obrigatórias:\n\n" + faltando.join("\n"));
      return;
    }
    const sheet = XLSX.utils.sheet_to_json(sheetRaw);
    const placasUnicas = [...new Set(sheet.map(row => row["Placa do Veiculo"]))];
    const mapaChaves = gerarChaves(placasUnicas);
    entregas = [];
    let linhasInvalidas = 0;
    sheet.forEach(row => {
      let camposFaltando = colunasObrigatorias.filter(col => !row[col] && row[col] !== 0);
      if (camposFaltando.length > 0) {
        linhasInvalidas++;
        return;
      }
      let entrega = {};
      colunasObrigatorias.forEach(col => {
        entrega[col] = row[col];
      });
      entrega.separado = 0;
      entrega.saldo = Number(entrega["Produtos/Quantidade"]) - entrega.separado;
      entrega.chave = mapaChaves[entrega["Placa do Veiculo"]];
      entregas.push(entrega);
    });
    atualizarTabela();
    atualizarBarrasTotais();
    salvarDados();
    if (linhasInvalidas > 0) {
      alert(`${linhasInvalidas} linha(s) da planilha foram ignoradas por falta de dados obrigatórios.`);
    }
  };
  reader.readAsArrayBuffer(file);
}

function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  entregas.forEach(entrega => {
    let saldo = Number(entrega["Produtos/Quantidade"]) - entrega.separado;
    let progresso = Math.min(100, (entrega.separado / Number(entrega["Produtos/Quantidade"])) * 100);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entrega["Sequencia"]}</td>
      <td>${entrega["Codigo do produto"]}</td>
      <td>${entrega["Destinatário Nome"]}</td>
      <td>${entrega["Destinatario Cidade"]}</td>
      <td>${entrega["Produtos/Quantidade"]}</td>
      <td>${entrega.separado}</td>
      <td>${saldo}</td>
      <td>
        <div class="progress-container" style="height:18px; width:100%;">
          <div class="progress-bar" style="width:${progresso}%">${progresso.toFixed(0)}%</div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function confirmarCodigo() {
  const codigo = document.getElementById("codigoInput").value.trim();
  if (!codigo) return;
  const idx = entregas.findIndex(e => 
    e["Codigo do produto"] == codigo && 
    (Number(e["Produtos/Quantidade"]) - e.separado) > 0
  );
  const entregaObj = idx >= 0 ? entregas[idx] : null;
  if (entregaObj) {
    entregaObj.separado += 1;
    ultimoIndiceSeparado = idx;
    const timestamp = new Date().toLocaleString();
    historico.unshift(`${timestamp} - ${codigo} - ${entregaObj["Destinatário Nome"]} - ${entregaObj["Destinatario Cidade"]}`);
    atualizarTabela();
    atualizarHistorico();
    atualizarBarrasTotais();
    salvarDados();
    if (document.getElementById("habilitarImpressao").checked) {
      abrirEtiqueta();
    }
  } else {
    alert("Produto totalmente separado ou código não encontrado!");
    if (document.getElementById("habilitarImpressao").checked) {
      abrirEtiquetaPS();
    }
  }
  document.getElementById("codigoInput").value = "";
}

function abrirEtiquetaPS() {
  window.open("etiquetaPS.html", "_blank");
}

function atualizarHistorico() {
  const ul = document.getElementById("historico");
  ul.innerHTML = "";
  historico.slice(0, 10).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
}

function atualizarBarrasTotais() {
  let totalCaixas = entregas.length;
  let caixasSeparadas = entregas.filter(e => e.separado >= Number(e["Produtos/Quantidade"])).length;
  let totalItens = entregas.reduce((acc, e) => acc + Number(e["Produtos/Quantidade"]), 0);
  let itensSeparados = entregas.reduce((acc, e) => acc + e.separado, 0);
  const chavesUnicas = [...new Set(entregas.map(e => e.chave))];
  let totalRotas = chavesUnicas.length;
  let rotasConcluidas = chavesUnicas.filter(chave => {
    const entregasRota = entregas.filter(e => e.chave === chave);
    return entregasRota.every(e => e.separado >= Number(e["Produtos/Quantidade"]));
  }).length;
  let progressoCaixas = totalCaixas ? (caixasSeparadas / totalCaixas) * 100 : 0;
  let progressoItens = totalItens ? (itensSeparados / totalItens) * 100 : 0;
  let progressoRotas = totalRotas ? (rotasConcluidas / totalRotas) * 100 : 0;
  document.getElementById("barraCaixas").style.width = progressoCaixas + "%";
  document.getElementById("barraCaixas").textContent = progressoCaixas.toFixed(0) + "%";
  document.getElementById("contadorCaixas").textContent = `${caixasSeparadas} de ${totalCaixas} caixas`;
  document.getElementById("barraItens").style.width = progressoItens + "%";
  document.getElementById("barraItens").textContent = progressoItens.toFixed(0) + "%";
  document.getElementById("contadorItens").textContent = `${itensSeparados} de ${totalItens} itens`;
  document.getElementById("barraRotas").style.width = progressoRotas + "%";
  document.getElementById("barraRotas").textContent = progressoRotas.toFixed(0) + "%";
  document.getElementById("contadorRotas").textContent = `${rotasConcluidas} de ${totalRotas} rotas`;
}

function resetar() {
  entregas = [];
  historico = [];
  ultimoIndiceSeparado = null;
  atualizarTabela();
  atualizarHistorico();
  atualizarBarrasTotais();
  document.getElementById("inputExcel").value = "";
  localStorage.removeItem("impressoraEtiqueta");
  salvarDados();
}

function exportarCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Código,Entrega,Planejado,Separado,Saldo\n";
  entregas.forEach(e => {
    const saldo = Number(e["Produtos/Quantidade"]) - e.separado;
    csvContent += `${e["Codigo do produto"]},${e["Destinatário Nome"]},${e["Produtos/Quantidade"]},${e.separado},${saldo}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "relatorio_bips.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function abrirEtiqueta() {
  if (ultimoIndiceSeparado === null || !entregas[ultimoIndiceSeparado]) {
    alert("Nenhuma separação realizada para gerar etiqueta.");
    return;
  }
  localStorage.setItem("dadosEtiqueta", JSON.stringify(entregas[ultimoIndiceSeparado]));
  window.open("etiqueta.html", "_blank");
}

function salvarDados() {
  localStorage.setItem("entregas", JSON.stringify(entregas));
  localStorage.setItem("historico", JSON.stringify(historico));
  localStorage.setItem("ultimoIndiceSeparado", JSON.stringify(ultimoIndiceSeparado));
}

document.addEventListener('DOMContentLoaded', () => {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuarioLogado) {
    window.location.href = "index.html";
    return;
  }
  const entregasSalvas = localStorage.getItem("entregas");
  const historicoSalvo = localStorage.getItem("historico");
  const ultimoSalvo = localStorage.getItem("ultimoIndiceSeparado");
  if (entregasSalvas) entregas = JSON.parse(entregasSalvas);
  if (historicoSalvo) historico = JSON.parse(historicoSalvo);
  if (ultimoSalvo) ultimoIndiceSeparado = JSON.parse(ultimoSalvo);
  atualizarTabela();
  atualizarHistorico();
  atualizarBarrasTotais();
  const inputExcel = document.getElementById('inputExcel');
  if (usuarioLogado.perfil !== "Supervisor") {
    inputExcel.disabled = true;
    inputExcel.title = "Somente o Supervisor pode importar arquivos.";
  } else {
    inputExcel.addEventListener('change', handleFile);
  }
  if (usuarioLogado.perfil === "Operador") {
    const btnResetar = document.getElementById("btnResetar");
    if (btnResetar) btnResetar.style.display = "none";
  }
});

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "index.html";
}

function gerarChaves(placas) {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let chaves = {};
  let count = 0;
  placas.forEach(placa => {
    let letra = letras[Math.floor(count / 9)];
    let numero = (count % 9) + 1;
    chaves[placa] = `${letra}${numero}`;
    count++;
  });
  return chaves;
}

document.getElementById("codigoInput").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    confirmarCodigo();
  }
});

function baixarHistorico() {
  let historico = [];
  if (localStorage.getItem("historico")) {
    historico = JSON.parse(localStorage.getItem("historico"));
  }
  if (!historico.length) {
    alert("Nenhum bip realizado!");
    return;
  }
  let csvContent = "data:text/csv;charset=utf-8,Data/Hora;Código;Destinatário;Cidade\n";
  historico.forEach(linha => {
    csvContent += linha.replace(/ - /g, ";") + "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "historico_bips.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
