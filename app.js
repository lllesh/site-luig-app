/* bolinhas — canvas com bolinhas flutuando, física, arrastáveis.
   clica numa bolinha → cola o link → ok → ela volta pro lugar dela
   mostrando a fotinho do site. */

(() => {
  'use strict';

  const cv = document.getElementById('palco');
  const ctx = cv.getContext('2d');

  const painel  = document.getElementById('painel');
  const campo   = document.getElementById('campo');
  const form    = document.getElementById('form');
  const btFechar= document.getElementById('fechar');
  const btAbrir = document.getElementById('abrir');
  const btLimpar= document.getElementById('limpar');

  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHAVE = 'bolinhas.v1';

  let W = 0, H = 0, DPR = 1;

  /* ---------- cores: a paleta da Le, hex exato e chapado ---------- */
  const paleta = [
    '#F48591', '#FA8D85', '#FEA283', '#FFB872', '#8DA599', '#8D96C1', '#C18EA9'
  ];

  /* ---------- guardar / ler links ---------- */
  function ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch { return {}; }
  }
  function guardar(id, link) {
    const d = ler();
    if (link) d[id] = link; else delete d[id];
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch {}
  }

  /* ---------- as bolinhas ---------- */
  // exemplo do Luigi: poucas bolinhas, cada uma já com o site dele
  const LINKS_PADRAO = [
    'https://luigi.lell.ooo/',
    'https://luigi.cards/',
    'https://luigi.games/',
    'https://luigi.deskii.top/',
    'https://luigi.i-u.chat/',
    'https://luig.i-u.chat/',
    'https://lui.lell.ing/',
    'https://luigi.sk.cool/',
    'https://lingo.sk.cool/',
    'https://day.luig.app/'
  ];
  // o que cada uma tem dentro, escrito na bolinha
  const NOMES_PADRAO = [
    'mural', 'cards', 'games', 'desk', 'chat', 'chat', 'lell', 'sk', 'lingo', 'day'
  ];
  const COM_SITE = 1.25;
  const bolas = [];

  // bolinha com site cresce um tiquinho — e nunca fica pequena demais
  // pra dar pra ver a fotinho
  function raioCheio(rNu) {
    const min = Math.min(W, H);
    return Math.min(Math.max(rNu * COM_SITE, min * 0.115), min * 0.21);
  }
  let focada = null;      // bolinha aberta no painel
  let presa  = null;      // bolinha sendo arrastada
  let hover  = null;

  function quantas() {
    return LINKS_PADRAO.length;
  }

  function criar() {
    const salvos = ler();
    const total = quantas();
    const min = Math.min(W, H);
    for (let i = 0; i < total; i++) {
      const r = Math.max(20, min * (0.05 + Math.random() * 0.09));
      // localStorage guarda edição dela; sem edição, usa o link padrão do Luigi
      const link = Object.prototype.hasOwnProperty.call(salvos, i) ? salvos[i] : LINKS_PADRAO[i];
      const cheia = link ? raioCheio(r) : r;
      const b = {
        id: i,
        r: cheia, rBase: cheia, rNu: r,
        x: r + Math.random() * (W - r * 2),
        y: r + Math.random() * (H - r * 2),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        cor: paleta[i % paleta.length],
        ang: Math.random() * Math.PI * 2,
        modo: 'livre',
        entrada: 0,
        atraso: i * (reduz ? 0 : 0.9),
        link: link || null,
        nome: link ? (link === LINKS_PADRAO[i] ? NOMES_PADRAO[i] : tirarNome(link)) : null,
        pop: 0,
        voltaX: 0, voltaY: 0
      };
      bolas.push(b);
    }

    // as letras do nome, cada uma flutuando separada, junto com as bolas
    const LETRAS = ['L', 'U', 'I', 'G', 'I'];
    const rLetra = Math.max(32, min * 0.135);
    LETRAS.forEach((letra, k) => {
      const id = total + k;
      bolas.push({
        id,
        r: rLetra, rBase: rLetra, rNu: rLetra,
        x: rLetra + Math.random() * (W - rLetra * 2),
        y: rLetra + Math.random() * (H - rLetra * 2),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        cor: paleta[(total + k) % paleta.length],
        ang: Math.random() * Math.PI * 2,
        modo: 'livre',
        entrada: 0,
        atraso: (total + k) * (reduz ? 0 : 0.9),
        link: null,
        nome: null,
        pop: 0,
        voltaX: 0, voltaY: 0,
        letra
      });
    });

    // espalha um pouco antes de mostrar
    for (let k = 0; k < 90; k++) colisoes(1);
  }

  /* ---------- fotinho do site ---------- */
  function arrumaLink(v) {
    v = (v || '').trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
    try { const u = new URL(v); return u.hostname.includes('.') ? u.href : null; }
    catch { return null; }
  }

  // pra quem for colado na mão: tira um nome curto do hostname
  function tirarNome(link) {
    try {
      const host = new URL(link).hostname.replace(/^www\./, '');
      return host.split('.')[0];
    } catch { return ''; }
  }


  /* ---------- barulhinho: carrilhão de vento ----------
     nada de metálico: só senoide pura, escala pentatônica (qualquer
     combinação cai bem junta), ataque macio e rabinho comprido, com um
     ecozinho de varanda por cima */
  let ac = null, mestre = null, eco = null, sonsNoQuadro = 0, contaSons = 0;

  // ré maior pentatônica, do grave pro agudo — carrilhão nunca desafina
  const NOTAS = [293.66, 329.63, 369.99, 440.00, 493.88,
                 587.33, 659.25, 739.99, 880.00, 987.77, 1174.66, 1318.51];
  let ultimaNota = -1;

  function ligaSom() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ac) {
      ac = new AC();
      mestre = ac.createGain();
      mestre.gain.value = 0.55;
      // segura o volume quando muita bolinha bate junto — nunca estoura
      let fim = ac.destination;
      if (ac.createDynamicsCompressor) {
        const cp = ac.createDynamicsCompressor();
        cp.threshold.value = -20; cp.knee.value = 24;
        cp.ratio.value = 4; cp.attack.value = 0.006; cp.release.value = 0.28;
        cp.connect(ac.destination); fim = cp;
      }
      mestre.connect(fim);

      // eco macio, tipo carrilhão pendurado na varanda
      try {
        const conv = ac.createConvolver();
        const seg = 2.4, n = Math.floor(ac.sampleRate * seg);
        const buf = ac.createBuffer(2, n, ac.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = buf.getChannelData(ch);
          for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.8);
        }
        conv.buffer = buf;
        const morno = ac.createBiquadFilter();
        morno.type = 'lowpass'; morno.frequency.value = 2600;
        eco = ac.createGain(); eco.gain.value = 0.34;
        eco.connect(conv); conv.connect(morno); morno.connect(mestre);
      } catch (e) { eco = null; }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
  }

  // uma varetinha do carrilhão
  function vareta(f, vol, x) {
    const t = ac.currentTime;
    const dur = 1.1 + 520 / f;                     // grave soa por mais tempo
    const saida = ac.createGain();
    saida.gain.value = 1;

    // tira a aspereza: o brilho cai junto com a nota
    const filtro = ac.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.Q.value = 0.6;
    filtro.frequency.setValueAtTime(Math.min(7000, f * 6), t);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.1), t + dur * 0.7);
    saida.connect(filtro);
    filtro.connect(mestre);
    if (eco) filtro.connect(eco);

    // fundamental + oitava + doze — tudo harmônico, nada de batida metálica
    [[1, 1], [2, 0.15], [3, 0.045]].forEach(([mult, peso]) => {
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f * mult;
      osc.detune.value = (Math.random() * 12 - 6);   // um tiquinho vivo
      const pico = Math.max(0.0002, vol * peso);
      const fim = t + dur / (1 + (mult - 1) * 0.9);  // agudo apaga antes
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(pico, t + 0.014);   // ataque macio, sem estalo
      g.gain.exponentialRampToValueAtTime(0.0001, fim);
      osc.connect(g); g.connect(saida);
      osc.start(t); osc.stop(fim + 0.05);
    });

    // de que lado da tela bateu
    if (ac.createStereoPanner && x != null && W) {
      const pan = ac.createStereoPanner();
      pan.pan.value = Math.max(-0.7, Math.min(0.7, (x / W) * 1.6 - 0.8));
      saida.disconnect(); saida.connect(pan);
      pan.connect(filtro);
    }
    contaSons++;
  }

  function plop(forca, raio, x) {
    if (!ac || ac.state !== 'running') return;
    // bolinha grande = varetinha mais grave
    const p = Math.max(0, Math.min(1, (raio - 12) / 34));
    let i = Math.round((1 - p) * (NOTAS.length - 1)) + ((Math.random() * 3) | 0) - 1;
    i = Math.max(0, Math.min(NOTAS.length - 1, i));
    if (i === ultimaNota) i = Math.max(0, Math.min(NOTAS.length - 1, i + (Math.random() < 0.5 ? -1 : 1)));
    ultimaNota = i;
    const vol = Math.min(0.24, 0.05 + Math.min(forca, 8) * 0.025);
    vareta(NOTAS[i], vol, x);
  }

  const LIMIAR = 1.5;    // só toca quando é batida de verdade, não no flutuar
  let ultimoSom = -1;
  function barulho(forca, raio, x) {
    if (forca < LIMIAR || sonsNoQuadro >= 2 || !ac) return;
    if (ac.currentTime - ultimoSom < 0.075) return;   // deixa cada nota respirar
    ultimoSom = ac.currentTime;
    sonsNoQuadro++;
    plop(forca, raio, x);
  }

  /* ---------- física ---------- */
  const ATRITO = 0.99;
  const ATRITO_RAPIDO = 0.965;
  const RESTITUICAO = 0.86;
  const FORCA = reduz ? 0.004 : 0.013;

  function passo(dt, t) {
    for (const b of bolas) {
      if (b.modo === 'foco' || b.modo === 'presa') continue;

      if (b.modo === 'voltando') {
        b.x += (b.voltaX - b.x) * 0.12 * dt;
        b.y += (b.voltaY - b.y) * 0.12 * dt;
        b.r += (b.rBase - b.r) * 0.14 * dt;
        if (Math.hypot(b.voltaX - b.x, b.voltaY - b.y) < 1.2 && Math.abs(b.r - b.rBase) < 1) {
          b.r = b.rBase; b.modo = 'livre'; b.vx = 0; b.vy = 0;
        }
        continue;
      }

      // plainando: a direção gira devagarinho
      b.ang += (Math.sin(t * 0.00042 + b.id * 1.7) * 0.05) * dt;
      b.vx += Math.cos(b.ang) * FORCA * dt;
      b.vy += Math.sin(b.ang) * FORCA * dt;

      const vel = Math.hypot(b.vx, b.vy);
      const at = vel > 2 ? ATRITO_RAPIDO : ATRITO;
      b.vx *= Math.pow(at, dt);
      b.vy *= Math.pow(at, dt);

      // teto de velocidade do flutuar
      if (vel < 2) {
        const lim = 0.75;
        if (vel > lim) { b.vx *= lim / vel; b.vy *= lim / vel; }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      paredes(b);

      // aberta no painel do site: cresce até o alvo (site) sem parar de flutuar
      if (b.rBase !== b.r) b.r += (b.rBase - b.r) * 0.1 * dt;
    }
    colisoes(dt);
  }

  function paredes(b) {
    if (b.x - b.r < 0)  { b.x = b.r;     if (b.vx < -LIMIAR) barulho(-b.vx * 0.7, b.r, b.x); b.vx = Math.abs(b.vx) * RESTITUICAO; }
    if (b.x + b.r > W)  { b.x = W - b.r; if (b.vx >  LIMIAR) barulho(b.vx * 0.7, b.r, b.x);  b.vx = -Math.abs(b.vx) * RESTITUICAO; }
    if (b.y - b.r < 0)  { b.y = b.r;     if (b.vy < -LIMIAR) barulho(-b.vy * 0.7, b.r, b.x); b.vy = Math.abs(b.vy) * RESTITUICAO; }
    if (b.y + b.r > H)  { b.y = H - b.r; if (b.vy >  LIMIAR) barulho(b.vy * 0.7, b.r, b.x);  b.vy = -Math.abs(b.vy) * RESTITUICAO; }
  }

  function colisoes(dt) {
    for (let i = 0; i < bolas.length; i++) {
      const a = bolas[i];
      if (a.modo === 'foco') continue;
      for (let j = i + 1; j < bolas.length; j++) {
        const b = bolas[j];
        if (b.modo === 'foco') continue;

        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        const min = a.r + b.r;
        if (d === 0) { dx = 0.5; dy = 0.2; d = 0.54; }
        if (d >= min) continue;

        const nx = dx / d, ny = dy / d;
        const sobra = min - d;

        // massa ∝ área; quem está na mão da Le é imóvel
        const ma = a.modo === 'presa' ? Infinity : a.r * a.r;
        const mb = b.modo === 'presa' ? Infinity : b.r * b.r;
        const soma = (ma === Infinity ? 0 : 1 / ma) + (mb === Infinity ? 0 : 1 / mb);

        if (soma === 0) continue;
        const pa = ma === Infinity ? 0 : (1 / ma) / soma;
        const pb = mb === Infinity ? 0 : (1 / mb) / soma;

        a.x -= nx * sobra * pa; a.y -= ny * sobra * pa;
        b.x += nx * sobra * pb; b.y += ny * sobra * pb;

        // troca de velocidade no eixo da batida
        const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vrel < 0) {
          barulho(-vrel, Math.min(a.r, b.r), (a.x + b.x) / 2);
          const imp = -(1 + RESTITUICAO) * vrel / soma;
          if (ma !== Infinity) { a.vx -= imp * nx / ma; a.vy -= imp * ny / ma; }
          if (mb !== Infinity) { b.vx += imp * nx / mb; b.vy += imp * ny / mb; }
        }
        if (a.modo !== 'presa') paredes(a);
        if (b.modo !== 'presa') paredes(b);
      }
    }
  }

  /* ---------- desenho ---------- */
  // a carta fica no meio da tela e a bolinha escolhida vai pro maior espaço livre
  // em volta dela — em cima, ou do lado — sempre grandona
  function alvoFoco(b) {
    const larg = Math.min(W * 0.92, 660, H * 0.6);
    let topo = (H - larg * 24 / 17) / 2, esq = (W - larg) / 2, dir = esq + larg;
    if (!painel.hidden) {
      const c = painel.getBoundingClientRect();
      if (c.height > 40) { topo = c.top; esq = c.left; dir = c.right; }
    }
    const ladoEsq = esq, ladoDir = W - dir;
    const lado = Math.max(ladoEsq, ladoDir);

    if (lado >= 150) {                       // cabe do lado: vai pro lado mais perto dela
      const naEsquerda = b.voltaX < W / 2 ? ladoEsq >= 150 : ladoDir < 150;
      const faixa = naEsquerda ? ladoEsq : ladoDir;
      const r = Math.max(40, Math.min(faixa * 0.36, 112));
      const x = naEsquerda ? ladoEsq / 2 : dir + ladoDir / 2;
      return { x, y: Math.min(Math.max(b.voltaY, r + 10), H - r - 10), r };
    }
    if (topo >= 104) {                       // senão, sobe pro vão de cima
      const r = Math.max(30, Math.min(topo * 0.34, 78));
      return { x: W / 2, y: Math.max(r + 8, topo / 2), r };
    }
    return { x: b.voltaX, y: b.voltaY, r: b.rBase * 1.7 };
  }

  // escreve o nome bem gordinho (peso black), curvado seguindo a curvatura
  // de cima da bolinha — cada letra rotacionada, tangente ao círculo
  // a letra senta dentro da bolinha, reta, bem legível — fonte Excon, peso black
  // a letra senta dentro da bolinha (curva de baixo, tipo sorriso), grossa e reta em pé
  function desenhaNome(nomeOriginal, cx, cy, r) {
    const nome = nomeOriginal.toUpperCase();
    const raioTexto = r * 0.58;

    function anguloPara(tamanho) {
      ctx.font = `800 ${tamanho}px 'Excon', -apple-system, sans-serif`;
      const espaco = tamanho * 0.22;   // afasta as letras entre si
      let total = 0;
      for (const ch of nome) total += (ctx.measureText(ch).width + espaco) / raioTexto;
      return total;
    }

    // letras bem grandonas, esticadas, preenchendo quase toda a bolinha
    let tam = r * 0.95;
    let total = anguloPara(tam);
    const MAX_ARCO = 2.7;
    while ((total > MAX_ARCO || tam > r * 1.15) && tam > 8) {
      tam -= 1;
      total = anguloPara(tam);
    }

    ctx.save();
    ctx.fillStyle = '#fffbf3';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(cx, cy);
    const espaco = tam * 0.22;
    ctx.rotate(total / 2);
    for (const ch of nome) {
      const ang = (ctx.measureText(ch).width + espaco) / raioTexto;
      ctx.rotate(-ang / 2);
      ctx.save();
      ctx.translate(0, raioTexto);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      ctx.rotate(-ang / 2);
    }
    ctx.restore();
  }

  function desenhaBola(b, t) {
    const ent = reduz ? 1 : Math.min(1, Math.max(0, b.entrada));
    const e = 1 - Math.pow(1 - ent, 3);
    const respiro = reduz ? 0 : Math.sin(t * 0.0011 + b.id) * 0.012;
    let escala = (hover === b && b.modo === 'livre' ? 1.05 : 1) + respiro;
    if (b.modo === 'presa') {
      const p = movido < 9 ? Math.min(1, Math.max(0, (t - baixouT) / SEGURAR)) : 0;
      escala = 1.0 + 2.0 * (p * p) + respiro;        // segurou = cresce 3x na mão
    }
    const r = b.r * e * escala;
    if (r < 0.6) return;

    // as letras do LUIGI: sem bola atrás, só a letra flutuando, bem grande
    if (b.letra) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.28)';
      ctx.shadowBlur = r * 0.3;
      ctx.shadowOffsetY = r * 0.06;
      ctx.fillStyle = '#fffbf3';
      ctx.font = `400 ${r * 2.1}px 'Jeffesta', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.letra, b.x, b.y + r * 0.06);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.shadowColor = 'rgba(27,26,25,.14)';
    ctx.shadowBlur = r * 0.55;
    ctx.shadowOffsetY = r * 0.16;

    ctx.fillStyle = b.cor;          // cor da Le, chapada, sem clarear nada
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // toda bolinha tem borda na cor FFFBF3
    ctx.save();
    ctx.strokeStyle = '#fffbf3';
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.beginPath();
    ctx.arc(b.x, b.y, r - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // o nome do que tem dentro, bem gordinho (black), curvado seguindo a bolinha
    if (b.nome) desenhaNome(b.nome, b.x, b.y, r);

  }

  let ultimo = performance.now();

  function quadro(agora) {
    const bruto = (agora - ultimo) / 16.6667;
    ultimo = agora;
    const dt = Math.min(2.2, Math.max(0.2, bruto));
    sonsNoQuadro = 0;

    // entrada em cascata
    for (const b of bolas) {
      if (b.atraso > 0) b.atraso -= dt; else b.entrada = Math.min(1, b.entrada + 0.045 * dt);
    }

    // 2 sub-passos = física mais firme
    passo(dt / 2, agora);
    passo(dt / 2, agora);

    if (focada) {
      const a = alvoFoco(focada);
      focada.x += (a.x - focada.x) * 0.16 * dt;
      focada.y += (a.y - focada.y) * 0.16 * dt;
      focada.r += (a.r - focada.r) * 0.16 * dt;
    }

    ctx.clearRect(0, 0, W, H);
    for (const b of bolas) if (b !== focada) desenhaBola(b, agora);

    if (focada) {
      ctx.fillStyle = 'rgba(255,251,243,.5)';
      ctx.fillRect(0, 0, W, H);
      desenhaBola(focada, agora);
    }

    requestAnimationFrame(quadro);
  }

  /* ---------- tamanho ---------- */
  function medir(primeira) {
    const antesW = W, antesH = H;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth || window.innerWidth;
    H = cv.clientHeight || window.innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!primeira && antesW > 0 && antesH > 0) {
      const kx = W / antesW, ky = H / antesH;
      for (const b of bolas) {
        b.x *= kx; b.y *= ky;
        b.voltaX *= kx; b.voltaY *= ky;
        b.x = Math.min(Math.max(b.x, b.r), W - b.r);
        b.y = Math.min(Math.max(b.y, b.r), H - b.r);
      }
    }
  }

  /* ---------- pegar, arrastar, jogar ---------- */
  // o canvas agora mora dentro da cartinha, não gruda mais no canto da tela
  function posNoCanvas(ev) {
    const r = cv.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function acha(x, y) {
    for (let i = bolas.length - 1; i >= 0; i--) {
      const b = bolas[i];
      if (b.modo === 'foco') continue;
      const r = Math.max(b.r, 22);
      if ((x - b.x) ** 2 + (y - b.y) ** 2 <= r * r) return b;
    }
    return null;
  }

  const SEGURAR = 550;                 // segurou esse tanto = abre a carta pra editar
  let baixouT = 0, ultPos = null, movido = 0, relogio = null, abriuSegurando = false;

  function largaRelogio() { if (relogio) { clearTimeout(relogio); relogio = null; } }

  cv.addEventListener('pointerdown', ev => {
    ligaSom();
    if (focada) { fecharPainel(); return; }
    const { x, y } = posNoCanvas(ev);
    const b = acha(x, y);
    if (!b) return;
    cv.setPointerCapture(ev.pointerId);
    cv.classList.add('pegando');
    b.modo = 'presa';
    presa = b;
    baixouT = performance.now(); movido = 0; abriuSegurando = false;
    b.pegaX = x - b.x; b.pegaY = y - b.y;
    ultPos = { x, y };

    largaRelogio();
    if (!b.letra) {
      relogio = setTimeout(() => {
        relogio = null;
        if (presa !== b || movido >= 9) return;
        abriuSegurando = true;
        presa = null;
        b.modo = 'livre';
        b.vx = 0; b.vy = 0;
        cv.classList.remove('pegando');
        abrirPainel(b);
      }, SEGURAR);
    }
  });

  cv.addEventListener('pointermove', ev => {
    const { x, y } = posNoCanvas(ev);
    if (!presa) {
      const h = acha(x, y);
      hover = h;
      cv.style.cursor = h ? 'pointer' : 'grab';
      return;
    }
    movido += Math.hypot(x - ultPos.x, y - ultPos.y);
    if (movido >= 9) largaRelogio();
    presa.x = Math.min(Math.max(x - presa.pegaX, presa.r), W - presa.r);
    presa.y = Math.min(Math.max(y - presa.pegaY, presa.r), H - presa.r);
    presa.vx = (x - ultPos.x) * 0.85;
    presa.vy = (y - ultPos.y) * 0.85;
    ultPos = { x, y };
  });

  function solta(ev) {
    largaRelogio();
    cv.classList.remove('pegando');
    if (!presa) return;
    const b = presa;
    presa = null;
    b.modo = 'livre';
    const lim = 42;
    const v = Math.hypot(b.vx, b.vy);
    if (v > lim) { b.vx *= lim / v; b.vy *= lim / v; }
    const rapido = performance.now() - baixouT < 420;
    if (movido < 9 && rapido && !abriuSegurando) {
      b.vx *= 0.15; b.vy *= 0.15;
      // já tem site: toque curto abre o app DE VERDADE (navega pra lá, não é overlay).
      // sem site: abre a carta pra colar o link. letra: só flutua, não abre nada
      if (b.letra) { /* nada */ }
      else if (b.link) window.location.href = b.link;
      else abrirPainel(b);
    }
  }
  cv.addEventListener('pointerup', solta);
  cv.addEventListener('pointercancel', solta);
  cv.addEventListener('pointerleave', () => { if (!presa) { hover = null; } });

  /* ---------- painel ---------- */
  function abrirPainel(b) {
    focada = b;
    b.voltaX = b.x; b.voltaY = b.y;
    b.modo = 'foco';
    campo.value = b.link || '';
    btAbrir.hidden = !b.link;
    btLimpar.hidden = !b.link;
    if (b.link) btAbrir.href = b.link;
    painel.hidden = false;
    setTimeout(() => campo.focus({ preventScroll: true }), 60);
  }

  function fecharPainel() {
    if (!focada) return;
    const b = focada;
    focada = null;
    painel.hidden = true;
    campo.blur();
    b.modo = 'voltando';
    b.vx = 0; b.vy = 0;
  }

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    if (!focada) return;
    const b = focada;
    const link = arrumaLink(campo.value);
    if (campo.value.trim() && !link) {
      campo.value = '';
      campo.placeholder = 'LINK ESTRANHO… TENTA DE NOVO';
      return;
    }
    if (link !== b.link) {
      b.link = link;
      b.nome = link ? (b.nome || tirarNome(link)) : null;
      b.rBase = link ? raioCheio(b.rNu) : b.rNu;
      guardar(b.id, link);
    }
    fecharPainel();
  });

  btFechar.addEventListener('click', fecharPainel);

  btLimpar.addEventListener('click', () => {
    if (!focada) return;
    const b = focada;
    b.link = null; b.nome = null;
    b.rBase = b.rNu;
    guardar(b.id, null);
    fecharPainel();
  });

  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (focada) fecharPainel();
  });

  /* ---------- vai ---------- */
  window.addEventListener('resize', () => medir(false));
  window.addEventListener('orientationchange', () => setTimeout(() => medir(false), 220));
  document.addEventListener('gesturestart', e => e.preventDefault());
  cv.addEventListener('contextmenu', e => e.preventDefault());

  medir(true);
  criar();
  requestAnimationFrame(quadro);

  // só na minha máquina, pra eu testar as bolinhas antes de subir
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ||
      location.search.includes('teste=1')) {
    window.__bolinhas = bolas;
    window.__sons = () => contaSons;
    window.__som = { liga: ligaSom, plop, ctx: () => ac, mestre: () => mestre };
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();

/* ---------- prompt de instalar como PWA, passo a passo certo pro aparelho ---------- */
(() => {
  'use strict';
  const carta = document.getElementById('instalarCarta');
  const lista = document.getElementById('instalarPassos');
  const btOk  = document.getElementById('instalarOk');
  if (!carta || !lista || !btOk) return;

  const ua = navigator.userAgent || '';
  const iOS = /iPhone|iPad|iPod/.test(ua);
  const android = /Android/.test(ua);

  // só faz sentido "instalar na tela inicial" no celular — no desktop nem mostra
  if (!iOS && !android) return;

  const passos = iOS
    ? [
        'toque no ícone de compartilhar (o quadrado com a seta pra cima), embaixo na tela',
        'escolha "adicionar à tela de início"',
        'toque em "adicionar" no canto de cima'
      ]
    : [
        'toque nos três pontinhos (⋮) no canto de cima do navegador',
        'escolha "instalar app" (ou "adicionar à tela inicial")',
        'confirme tocando em "instalar"'
      ];

  lista.innerHTML = passos.map(p => `<li>${p}</li>`).join('');

  const jaInstalado =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const jaFechou = localStorage.getItem('luigiapp.instalarFechou') === '1';

  if (!jaInstalado && !jaFechou) {
    setTimeout(() => { carta.hidden = false; }, 900);
  }

  btOk.addEventListener('click', () => {
    carta.hidden = true;
    localStorage.setItem('luigiapp.instalarFechou', '1');
  });
})();

/* ---------- a foto do meio: estica que nem estilingue, solta e ela sai voando, bate, oscila ---------- */
(() => {
  'use strict';
  const foto = document.querySelector('.luigi-avatar-bubble');
  if (!foto) return;

  let ativo = false, sx = 0, sy = 0;
  let px = 0, py = 0;                 // posição atual (offset do centro)
  let vx = 0, vy = 0;                 // velocidade da mola
  let ultX = 0, ultY = 0, ultT = 0;   // pra medir a velocidade da mão ao soltar
  let velMaoX = 0, velMaoY = 0;
  let animando = false;

  // quanto mais estica, mais força guardada — e ao soltar ela bate nas
  // bordas da cartinha que nem bola de bilhar (rápida, ricocheteando),
  // com uma mola fraca puxando de volta pro meio até ela acalmar de vez
  const RIGIDEZ = 0.026;
  const AMORTECIMENTO = 0.985;
  const RESTITUICAO = 0.86;
  const LIMIAR_PARADA = 0.4;

  function limites() {
    const carta = document.getElementById('cartinha');
    const rc = carta.getBoundingClientRect();
    const rf = foto.getBoundingClientRect();
    // o quanto a foto pode se afastar do centro sem furar a borda da carta
    return {
      x: Math.max(10, rc.width / 2 - rf.width / 2 - 8),
      y: Math.max(10, rc.height / 2 - rf.height / 2 - 8)
    };
  }

  function parar() {
    animando = false;
  }

  function animar() {
    if (!animando) return;
    const lim = limites();

    // mola fraca: só pra ela não ficar longe pra sempre, o forte é a batida
    vx = (vx - px * RIGIDEZ) * AMORTECIMENTO;
    vy = (vy - py * RIGIDEZ) * AMORTECIMENTO;
    px += vx;
    py += vy;

    // bate na borda da carta que nem bola de bilhar
    if (px > lim.x)  { px = lim.x;  vx = -Math.abs(vx) * RESTITUICAO; }
    if (px < -lim.x) { px = -lim.x; vx =  Math.abs(vx) * RESTITUICAO; }
    if (py > lim.y)  { py = lim.y;  vy = -Math.abs(vy) * RESTITUICAO; }
    if (py < -lim.y) { py = -lim.y; vy =  Math.abs(vy) * RESTITUICAO; }

    foto.style.transform = `translate(${px}px, ${py}px)`;

    if (Math.abs(px) < LIMIAR_PARADA && Math.abs(py) < LIMIAR_PARADA &&
        Math.abs(vx) < LIMIAR_PARADA && Math.abs(vy) < LIMIAR_PARADA) {
      px = 0; py = 0;
      foto.style.transform = 'translate(0px, 0px)';
      parar();
      return;
    }
    requestAnimationFrame(animar);
  }

  foto.addEventListener('pointerdown', ev => {
    parar();
    ativo = true;
    foto.classList.add('arrastando');
    foto.setPointerCapture(ev.pointerId);
    sx = ev.clientX; sy = ev.clientY;
    ultX = ev.clientX; ultY = ev.clientY; ultT = performance.now();
    velMaoX = 0; velMaoY = 0;
    ev.stopPropagation();
  });

  foto.addEventListener('pointermove', ev => {
    if (!ativo) return;
    px = ev.clientX - sx;
    py = ev.clientY - sy;
    foto.style.transform = `translate(${px}px, ${py}px)`;

    const agora = performance.now();
    const dt = Math.max(1, agora - ultT);
    velMaoX = ((ev.clientX - ultX) / dt) * 16;
    velMaoY = ((ev.clientY - ultY) / dt) * 16;
    ultX = ev.clientX; ultY = ev.clientY; ultT = agora;
    ev.stopPropagation();
  });

  function soltar(ev) {
    if (!ativo) return;
    ativo = false;
    foto.classList.remove('arrastando');
    // sai rápido feito bola de bilhar: força da mão + o tanto que ela tava esticada
    vx = velMaoX * 2.2 + px * 0.16;
    vy = velMaoY * 2.2 + py * 0.16;
    animando = true;
    requestAnimationFrame(animar);
    ev && ev.stopPropagation();
  }
  foto.addEventListener('pointerup', soltar);
  foto.addEventListener('pointercancel', soltar);
})();
