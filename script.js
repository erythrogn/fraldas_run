(function () {
  "use strict";

  const URL_API = (window.FRALDAS_CONFIG || {}).APPS_SCRIPT_URL;
  const INTERVALO_ATUALIZACAO_MS = 60000;
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const el = {
    form: document.getElementById("form-presenca"),
    telefone: document.querySelector('input[name="telefone"]'),
    mensagem: document.getElementById("mensagem"),
    botao: document.getElementById("btn-enviar"),
    tbody: document.getElementById("lista-confirmados"),
    contador: document.getElementById("contador"),
    atualizacao: document.getElementById("atualizacao"),
    btnLista: document.getElementById("btn-lista"),
    listaCorpo: document.getElementById("lista-corpo"),
    btnAtualizar: document.getElementById("btn-atualizar"),
    confete: document.getElementById("confete"),
  };

  let assinaturaAtual = "";
  let listaAtual = [];
  let valorContador = 0;
  let buscando = false;

  const apiConfigurada = () => Boolean(URL_API) && !URL_API.startsWith("COLE_");

  function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function horaAtual() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function telefoneValido(telefone) {
    const digitos = telefone.replace(/\D/g, "");
    return digitos.length >= 10 && digitos.length <= 11;
  }

  /* Máscara simples: (91) 99999-9999 */
  el.telefone.addEventListener("input", function () {
    const digitos = el.telefone.value.replace(/\D/g, "").slice(0, 11);
    let formatado = digitos;
    if (digitos.length > 7) {
      formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    } else if (digitos.length > 2) {
      formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    }
    el.telefone.value = formatado;
  });

  function mostrarMensagem(texto, tipo) {
    el.mensagem.textContent = texto;
    el.mensagem.className = "mensagem " + (tipo || "");
    // Força a reanimação mesmo quando a mensagem já estava visível.
    void el.mensagem.offsetWidth;
    el.mensagem.classList.add("visivel");
  }

  /* Contador que sobe até o novo valor */
  function animarContador(valorFinal) {
    const inicio = valorContador;
    valorContador = valorFinal;

    if (reduzirMovimento || inicio === valorFinal) {
      el.contador.textContent = valorFinal;
      return;
    }

    const duracao = 500;
    const t0 = performance.now();

    function passo(agora) {
      const p = Math.min((agora - t0) / duracao, 1);
      el.contador.textContent = Math.round(inicio + (valorFinal - inicio) * p);
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);

    el.contador.classList.remove("pop");
    void el.contador.offsetWidth;
    el.contador.classList.add("pop");
  }

  function renderizarLista(lista) {
    if (lista.length === 0) {
      el.tbody.innerHTML =
        '<tr><td colspan="3" class="vazio">Ainda não há confirmações. Seja o primeiro.</td></tr>';
      return;
    }

    el.tbody.innerHTML = lista
      .map(
        (atleta, i) => `
          <tr style="--i: ${i}">
            <td class="num">${String(i + 1).padStart(2, "0")}</td>
            <td>${escaparHtml(atleta.nome)}</td>
            <td><span class="selo">${escaparHtml(atleta.modalidade)}</span></td>
          </tr>`
      )
      .join("");
  }

  function mostrarCarregando() {
    el.tbody.innerHTML = '<tr><td colspan="3" class="vazio carregando">Carregando...</td></tr>';
  }

  /* Busca a lista. Roda em segundo plano e só redesenha se algo mudou. */
  async function buscarConfirmados() {
    if (!apiConfigurada()) {
      el.contador.textContent = "–";
      el.atualizacao.textContent = "Configure a URL do Apps Script em config.js para ver a lista.";
      return;
    }
    if (buscando) return;

    buscando = true;

    try {
      const resposta = await fetch(URL_API);
      const json = await resposta.json();
      if (!json.ok) throw new Error(json.erro || "Resposta inválida");

      const novaAssinatura = JSON.stringify(json.confirmados || []);
      if (novaAssinatura !== assinaturaAtual) {
        assinaturaAtual = novaAssinatura;
        listaAtual = json.confirmados || [];
        renderizarLista(listaAtual);
      }

      animarContador(listaAtual.length);
      el.atualizacao.textContent = "Atualizado às " + horaAtual();
    } catch (erro) {
      if (listaAtual.length === 0 && !assinaturaAtual) {
        el.tbody.innerHTML =
          '<tr><td colspan="3" class="vazio">Não foi possível carregar a lista agora.</td></tr>';
        el.atualizacao.textContent = "Tentaremos de novo em instantes.";
      } else {
        el.atualizacao.textContent = "Não foi possível atualizar agora. Mostrando a última lista.";
      }
    } finally {
      buscando = false;
    }
  }

  function alternarLista() {
    const estavaAberta = !el.listaCorpo.hidden;
    el.listaCorpo.hidden = estavaAberta;
    el.btnLista.setAttribute("aria-expanded", String(!estavaAberta));
    el.btnLista.textContent = estavaAberta ? "Ver lista" : "Fechar lista";
  }

  /* Confete simples ao confirmar */
  function soltarConfete() {
    if (reduzirMovimento) return;

    const cores = ["#6a2d9c", "#ffd23f", "#ff8fc1", "#8fd3f4", "#ffffff"];
    const fragmento = document.createDocumentFragment();

    for (let i = 0; i < 60; i++) {
      const papel = document.createElement("span");
      papel.className = "papel";
      papel.style.left = Math.random() * 100 + "vw";
      papel.style.background = cores[i % cores.length];
      papel.style.setProperty("--dx", (Math.random() - 0.5) * 240 + "px");
      papel.style.setProperty("--giro", Math.random() * 720 - 360 + "deg");
      papel.style.animationDelay = Math.random() * 0.25 + "s";
      fragmento.appendChild(papel);
    }

    el.confete.appendChild(fragmento);
    setTimeout(() => {
      el.confete.innerHTML = "";
    }, 3000);
  }

  el.form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    if (!apiConfigurada()) {
      mostrarMensagem("O site ainda não está conectado à planilha.", "erro");
      return;
    }

    if (!el.form.checkValidity()) {
      el.form.reportValidity();
      return;
    }

    const dadosForm = new FormData(el.form);
    const telefone = dadosForm.get("telefone").trim();

    if (!telefoneValido(telefone)) {
      mostrarMensagem("Informe um telefone válido com DDD.", "erro");
      return;
    }

    const dados = {
      nome: dadosForm.get("nome").trim(),
      telefone: telefone,
      modalidade: dadosForm.get("modalidade"),
      entregaFralda: dadosForm.get("entregaFralda") === "on",
      mimo: dadosForm.get("mimo") === "on",
      tamanhoFralda: dadosForm.get("tamanhoFralda"),
    };

    el.botao.disabled = true;
    el.botao.classList.add("carregando");
    mostrarMensagem("Enviando sua confirmação...", "");

    try {
      // text/plain evita a requisição de preflight (CORS) do Apps Script.
      const resposta = await fetch(URL_API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(dados),
      });
      const retorno = await resposta.json();

      if (retorno.ok) {
        mostrarMensagem("Presença confirmada. Te esperamos dia 13/12, às 06h00.", "ok");
        el.form.reset();
        soltarConfete();
        buscarConfirmados();
      } else {
        mostrarMensagem(retorno.erro || "Não foi possível confirmar. Tente novamente.", "erro");
      }
    } catch (erro) {
      mostrarMensagem("Erro de conexão. Verifique sua internet e tente de novo.", "erro");
    } finally {
      el.botao.disabled = false;
      el.botao.classList.remove("carregando");
    }
  });

  el.btnLista.addEventListener("click", alternarLista);
  el.btnAtualizar.addEventListener("click", buscarConfirmados);

  /* Entrada das seções ao rolar */
  if ("IntersectionObserver" in window && !reduzirMovimento) {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("visivel");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((n) => observador.observe(n));
  } else {
    document.querySelectorAll(".reveal").forEach((n) => n.classList.add("visivel"));
  }

  /* Carregamento em segundo plano: a lista é buscada ao abrir a página,
     fica pronta quando alguém clicar em "Ver lista" e é atualizada sozinha. */
  mostrarCarregando();
  buscarConfirmados();
  setInterval(buscarConfirmados, INTERVALO_ATUALIZACAO_MS);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") buscarConfirmados();
  });
})();
