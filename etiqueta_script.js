const entrega = JSON.parse(localStorage.getItem("dadosEtiqueta"));
function imprimirEtiqueta() {
  const impressoraSalva = localStorage.getItem("impressoraEtiqueta");
  if (!impressoraSalva) {
    window.print();
    localStorage.setItem("impressoraEtiqueta", "padrao");
  } else {
    window.print();
  }
  setTimeout(() => window.close(), 500);
}
if (!entrega) {
  document.body.innerHTML = "<h2>Dados da etiqueta não encontrados.</h2>";
} else {
  const destinatario = entrega["Destinatário Nome"];
  const endereco = `${entrega["Destinatário Endereço"]}, ${entrega["Destinatário Endereço Número"]}`;
  const bairro = entrega["Destinatario Bairro"];
  const cidade = entrega["Destinatario Cidade"];
  const estado = entrega["Destinatario Estado"];
  const notaFiscal = entrega["Nº da Nota Fiscal"];
  const codigoProduto = entrega["Codigo do produto"];
  const sequencia = entrega["Sequencia"];
  const chave = entrega.chave;
  const dataHora = new Date().toLocaleString();
  document.getElementById("conteudoEtiqueta").innerHTML = `
    <div class="etiqueta">
      <div class="chave">${chave}</div>
      <div class="info">
        <div class="destinatario">${destinatario}</div>
        <div class="cidade-bairro-estado">${cidade} - ${bairro} - ${estado}</div>
        <div class="endereco">${endereco}</div>
        <div class="bloco-espaco"></div>
        <div class="detalhes">
          <div>Seq.: ${sequencia}</div>
          <div>NF: ${notaFiscal}</div>
          <div class="codigo-produto">Código: ${codigoProduto}</div>
          <div>Data/Hora: ${dataHora}</div>
        </div>
      </div>
    </div>
  `;
  window.onload = imprimirEtiqueta;
}
