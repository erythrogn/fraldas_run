(function () {
  "use strict";

  const URL_API = (window.FRALDAS_CONFIG || {}).APPS_SCRIPT_URL;
  const form = document.getElementById("form-presenca");
  const mensagem = document.getElementById("mensagem");
  const botao = document.getElementById("btn-enviar");
  const tbody = document.getElementById("lista-confirmados");
  const contador = document.getElementById("contador");
  const btnAtualizar = document.getElementById("btn-atualizar");

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + (tipo || "");
  }

  function apiConfigurada() {
    return URL_API && !URL_API.startsWith("COLE_");
  }

  function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function telefoneValido(telefone) {
    const digitos = telefone.replace(/\D/g, "");
    return digitos.length >= 10 && digitos.length <= 13;
  }

  async function enviarPresenca(dados) {
    // text/plain evita a requisição de preflight (CORS) do Apps Script.
    const resposta = await fetch(URL_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(dados),
    });
    return resposta.json();
  }

  async function carregarConfirmados() {
    if (!apiConfigurada()) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="vazio">Configure a URL do Apps Script em config.js</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="5" class="vazio">Carregando...</td></tr>';

    try {
      const resposta = await fetch(URL_API);
      const json = await resposta.json();
      const lista = json.confirmados || [];

      contador.textContent = lista.length;

      if (lista.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="vazio">Ninguém confirmou ainda. Seja o primeiro! 💜</td></tr>';
        return;
      }

      tbody.innerHTML = lista
        .map(
          (atleta, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escaparHtml(atleta.nome)}</td>
              <td>${escaparHtml(atleta.modalidade)}</td>
              <td>${escaparHtml(atleta.tamanhoFralda)}</td>
              <td>${atleta.mimo ? "Sim" : "Não"}</td>
            </tr>`
        )
        .join("");
    } catch (erro) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="vazio">Não foi possível carregar a lista agora.</td></tr>';
    }
  }

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    if (!apiConfigurada()) {
      mostrarMensagem("Site ainda não configurado: falta a URL do Apps Script.", "erro");
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const telefone = formData.get("telefone").trim();

    if (!telefoneValido(telefone)) {
      mostrarMensagem("Informe um telefone válido com DDD.", "erro");
      return;
    }

    const dados = {
      nome: formData.get("nome").trim(),
      telefone: telefone,
      modalidade: formData.get("modalidade"),
      entregaFralda: formData.get("entregaFralda") === "on",
      mimo: formData.get("mimo") === "on",
      tamanhoFralda: formData.get("tamanhoFralda"),
    };

    botao.disabled = true;
    mostrarMensagem("Enviando sua confirmação...", "");

    try {
      const retorno = await enviarPresenca(dados);

      if (retorno.ok) {
        mostrarMensagem("Presença confirmada! Nos vemos no dia 13/12 às 06h00 💜", "ok");
        form.reset();
        carregarConfirmados();
      } else {
        mostrarMensagem(retorno.erro || "Não foi possível confirmar. Tente novamente.", "erro");
      }
    } catch (erro) {
      mostrarMensagem("Erro de conexão. Verifique sua internet e tente de novo.", "erro");
    } finally {
      botao.disabled = false;
    }
  });

  btnAtualizar.addEventListener("click", carregarConfirmados);

  carregarConfirmados();
})();
