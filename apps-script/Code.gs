/**
 * Fraldas Run Ayana Cecília 2026 — backend em Google Apps Script.
 *
 * Grava cada confirmação de presença em uma aba de uma Planilha Google
 * e devolve a lista de confirmados para o site.
 *
 * Como usar: veja o README.md na raiz do projeto.
 */

const NOME_ABA = "Confirmações";
const CABECALHO = [
  "Data/Hora",
  "Nome completo",
  "Telefone/WhatsApp",
  "Modalidade",
  "Entrega fralda",
  "Tamanho da fralda",
  "Mimo",
];

/** Retorna a aba de confirmações, criando-a com cabeçalho se não existir. */
function obterAba() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(NOME_ABA);

  if (!aba) {
    aba = planilha.insertSheet(NOME_ABA);
    aba.appendRow(CABECALHO);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight("bold");
    aba.setFrozenRows(1);
  }
  return aba;
}

/** Lê as linhas da planilha e devolve a lista de confirmados. */
function listarConfirmados() {
  const aba = obterAba();
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return [];

  const linhas = aba.getRange(2, 1, ultimaLinha - 1, CABECALHO.length).getValues();

  return linhas
    .filter((l) => l[1] !== "")
    .map((l) => ({
      nome: l[1],
      modalidade: l[3],
      tamanhoFralda: l[5],
      mimo: l[6] === "Sim",
    }));
}

/** GET: devolve a lista de confirmados em JSON (usado pelo site). */
function doGet() {
  return responderJson({ ok: true, confirmados: listarConfirmados() });
}

/** POST: registra uma nova confirmação de presença. */
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const erro = validar(dados);
    if (erro) return responderJson({ ok: false, erro: erro });

    const telefoneNormalizado = normalizarTelefone(dados.telefone);
    const aba = obterAba();
    const ultimaLinha = aba.getLastRow();

    // Evita duplicidade pelo telefone.
    if (ultimaLinha >= 2) {
      const telefones = aba.getRange(2, 3, ultimaLinha - 1, 1).getValues();
      const jaExiste = telefones.some((t) => normalizarTelefone(t[0]) === telefoneNormalizado);
      if (jaExiste) {
        return responderJson({ ok: false, erro: "Este telefone já está confirmado." });
      }
    }

    aba.appendRow([
      new Date(),
      dados.nome,
      dados.telefone,
      dados.modalidade,
      dados.entregaFralda ? "Sim" : "Não",
      dados.tamanhoFralda,
      dados.mimo ? "Sim" : "Não",
    ]);

    return responderJson({ ok: true });
  } catch (erro) {
    return responderJson({ ok: false, erro: "Dados inválidos." });
  }
}

function validar(dados) {
  if (!dados.nome || dados.nome.trim().length < 3) return "Informe o nome completo.";
  if (!dados.telefone) return "Informe o telefone.";
  if (!["3 km", "5 km"].includes(dados.modalidade)) return "Escolha 3 km ou 5 km.";
  if (!dados.entregaFralda) return "Confirme a entrega do pacote de fralda.";
  if (!["P", "M", "G", "XG"].includes(dados.tamanhoFralda)) return "Escolha o tamanho da fralda.";
  return null;
}

function normalizarTelefone(telefone) {
  return String(telefone).replace(/\D/g, "");
}

function responderJson(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  );
}
