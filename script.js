// --- 🎵 CONFIGURAÇÃO DOS SEUS ARQUIVOS MP3 e IMAGENS 🎵 ---
const ARQUIVOS_DE_AUDIO = {
    musicaFundo: 'sounds/music.mp3',
    passoNormal: 'sounds/walk.mp3',
    passoCorrer: 'sounds/run.mp3', 
    passoAgua: 'sounds/walk_water.mp3',
    lanterna: 'sounds/click_lantern.mp3',
    portaAbrir: 'sounds/open_door.mp3',  
    portaFechar: 'sounds/close_door.mp3',
    pulo: 'sounds/jump.mp3'
};

const CAMINHO_QUADRO_IMAGEM = 'img/tumoritus.jpeg';

// --- CONFIGURAÇÃO INICIAL DO ESPAÇO 3D ---
const container = document.getElementById('canvas-container');
const instrucoes = document.getElementById('instrucoes');
const promptInteracao = document.getElementById('prompt-interacao');
const btnFullscreen = document.getElementById('btn-fullscreen');
const controlesMobileDiv = document.getElementById('controles-mobile');

const cena = new THREE.Scene();

const corDia = new THREE.Color(0xa0c4ff);
const corNoite = new THREE.Color(0x0a0a1a);
const corOcaso = new THREE.Color(0xd97706);

cena.background = corDia.clone(); 
cena.fog = new THREE.FogExp2(0xa0c4ff, 0.006); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const cameraContainer = new THREE.Group();
cena.add(cameraContainer);
cameraContainer.add(camera);

const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true; 
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderizador.domElement);

// Detecta se é dispositivo móvel/touch
const ehTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
if (ehTouch) {
    controlesMobileDiv.style.display = 'block';
}

// --- TELA CHEIA (FULLSCREEN) ---
btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Erro ao ativar Fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// --- 🔊 GERENCIADOR DE ÁUDIO ---
const ouvinteAudio = new THREE.AudioListener();
camera.add(ouvinteAudio);

const carregadorAudio = new THREE.AudioLoader();

const somMusicaFundo = new THREE.Audio(ouvinteAudio);
const somPassoNormal = new THREE.Audio(ouvinteAudio);
const somPassoCorrer = new THREE.Audio(ouvinteAudio);
const somPassoAgua = new THREE.Audio(ouvinteAudio);
const somLanterna = new THREE.Audio(ouvinteAudio);
const somPortaAbrir = new THREE.Audio(ouvinteAudio);
const somPortaFechar = new THREE.Audio(ouvinteAudio);
const somPulo = new THREE.Audio(ouvinteAudio);

let audiosCarregados = false;

function carregarTodosOsAudios() {
    if (audiosCarregados) return;

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.musicaFundo, (buffer) => {
        somMusicaFundo.setBuffer(buffer);
        somMusicaFundo.setLoop(true);
        somMusicaFundo.setVolume(0.3);
        somMusicaFundo.play();
    }, undefined, (err) => console.log("Aviso: Áudio ocultado"));

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.passoNormal, (buffer) => {
        somPassoNormal.setBuffer(buffer);
        somPassoNormal.setLoop(true);
        somPassoNormal.setVolume(0.5);
    });

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.passoCorrer, (buffer) => {
        somPassoCorrer.setBuffer(buffer);
        somPassoCorrer.setLoop(true);
        somPassoCorrer.setVolume(0.6);
    });

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.passoAgua, (buffer) => {
        somPassoAgua.setBuffer(buffer);
        somPassoAgua.setLoop(true);
        somPassoAgua.setVolume(0.6);
    });

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.lanterna, (buffer) => {
        somLanterna.setBuffer(buffer);
        somLanterna.setVolume(0.4);
    });

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.portaAbrir, (buffer) => {
        somPortaAbrir.setBuffer(buffer);
        somPortaAbrir.setVolume(0.6);
    });

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.portaFechar, (buffer) => {
        somPortaFechar.setBuffer(buffer);
        somPortaFechar.setVolume(0.6);
    });

    carregadorAudio.load(ARQUIVOS_DE_AUDIO.pulo, (buffer) => {
        somPulo.setBuffer(buffer);
        somPulo.setVolume(0.5);
    });

    audiosCarregados = true;
}

// --- CONTROLES E INPUTS (MISTO: MOUSE/TECLADO E TOUCH DE OLHAR) ---
const controles = new THREE.PointerLockControls(cameraContainer, document.body);

instrucoes.addEventListener('click', () => { 
    if(!ehTouch) controles.lock();
    else instrucoes.style.display = 'none';
    carregarTodosOsAudios();
});

controles.addEventListener('lock', () => { instrucoes.style.display = 'none'; });
controles.addEventListener('unlock', () => { 
    if(!ehTouch) {
        instrucoes.style.display = 'block'; 
        promptInteracao.style.display = 'none'; 
        pararSonsDeMovimento();
    }
});
cena.add(controles.getObject());

// Controle de Olhar no Mobile arrastando o dedo na tela vazia
let toqueIniciado = false;
let anteriorToqueX = 0, anteriorToqueY = 0;

window.addEventListener('touchstart', (e) => {
    // Só move a câmera se o toque não for em cima dos botões ou joystick
    if (e.target.tagName !== 'BUTTON' && !document.getElementById('zona-joystick').contains(e.target)) {
        toqueIniciado = true;
        anteriorToqueX = e.touches[0].pageX;
        anteriorToqueY = e.touches[0].pageY;
    }
}, {passive: true});

window.addEventListener('touchmove', (e) => {
    if (!toqueIniciado) return;
    const atualX = e.touches[0].pageX;
    const atualY = e.touches[0].pageY;
    
    const movX = atualX - anteriorToqueX;
    const movY = atualY - anteriorToqueY;

    cameraContainer.rotation.y -= movX * 0.005;
    camera.rotation.x -= movY * 0.005;
    camera.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, camera.rotation.x));

    anteriorToqueX = atualX;
    anteriorToqueY = atualY;
}, {passive: true});

window.addEventListener('touchend', () => { toqueIniciado = false; });

let moverFrente = false, moverTras = false, moverEsquerda = false, moverDireita = false, podeSaltar = false, correndo = false;
let lanternaLigada = false;
const velocidade = new THREE.Vector3();
const direcao = new THREE.Vector3();

const ALTURA_JOGADOR = 2.0;
const FORCA_SALTO = 14.0;
const GRAVIDADE = 38.0;
let VELOCIDADE_BASE = 90.0; 

let temporizadorBobbing = 0;
let audioAtualTocando = null;

// Parâmetros da Cabana e Porta
let portaObjeto = null;
let portaAberta = false;
let anguloAlvoPorta = 0;
let cabanaX = -15, cabanaZ = -20;

// Inputs via Teclado (PC)
const noKeyDown = (evento) => {
    switch (evento.code) {
        case 'KeyW': moverFrente = true; break;
        case 'KeyS': moverTras = true; break;
        case 'KeyA': moverEsquerda = true; break;
        case 'KeyD': moverDireita = true; break;
        case 'ShiftLeft': correndo = true; break;
        case 'KeyF': alternarLanterna(); break;
        case 'KeyE': tentarInteragirPorta(); break;
        case 'Space': executarPulo(); break;
    }
};

const noKeyUp = (evento) => {
    switch (evento.code) {
        case 'KeyW': moverFrente = false; break;
        case 'KeyS': moverTras = false; break;
        case 'KeyA': moverEsquerda = false; break;
        case 'KeyD': moverDireita = false; break;
        case 'ShiftLeft': correndo = false; break;
    }
};

document.addEventListener('keydown', noKeyDown);
document.addEventListener('keyup', noKeyUp);

// --- MAPEAMENTO DOS BOTÕES DE TOQUE (MOBILE) ---
function alternarLanterna() {
    lanternaLigada = !lanternaLigada;
    luzLanterna.visible = lanternaLigada;
    if (somLanterna.buffer) {
        if (somLanterna.isPlaying) somLanterna.stop();
        somLanterna.play();
    }
}

function executarPulo() {
    if (podeSaltar) {
        velocidade.y += FORCA_SALTO;
        podeSaltar = false;
        pararSonsDeMovimento();
        if (somPulo.buffer) {
            if (somPulo.isPlaying) somPulo.stop();
            somPulo.play();
        }
    }
}

// Eventos de Toque dos botões criados
document.getElementById('btn-lanterna').addEventListener('touchstart', (e) => { e.preventDefault(); alternarLanterna(); });
document.getElementById('btn-pulo').addEventListener('touchstart', (e) => { e.preventDefault(); executarPulo(); });
document.getElementById('btn-interagir').addEventListener('touchstart', (e) => { e.preventDefault(); tentarInteragirPorta(); });

const bCorrida = document.getElementById('btn-corrida');
bCorrida.addEventListener('touchstart', (e) => { 
    e.preventDefault();
    correndo = !correndo; // Funciona em modo alternável (clica ativa/clica desativa)
    if(correndo) bCorrida.classList.add('btn-ativo');
    else bCorrida.classList.remove('btn-ativo');
});

// --- CONFIGURAÇÃO DO JOYSTICK VIRTUAL (NIPPLEJS) ---
let gerenciadorJoystick;
if(ehTouch) {
    gerenciadorJoystick = nipplejs.create({
        zone: document.getElementById('zona-joystick'),
        mode: 'static',
        position: { left: '75px', bottom: '75px' },
        color: 'white',
        size: 110
    });

    gerenciadorJoystick.on('move', (evt, data) => {
        if (!data.vector) return;
        
        // Limpa os estados de movimento base anterior
        moverFrente = false; moverTras = false; moverEsquerda = false; moverDireita = false;

        const limiteForca = 0.2;
        if (data.vector.y > limiteForca) moverFrente = true;
        if (data.vector.y < -limiteForca) moverTras = true;
        if (data.vector.x < -limiteForca) moverEsquerda = true;
        if (data.vector.x > limiteForca) moverDireita = true;
    });

    gerenciadorJoystick.on('end', () => {
        moverFrente = false; moverTras = false; moverEsquerda = false; moverDireita = false;
    });
}

function pararSonsDeMovimento() {
    if (somPassoNormal.isPlaying) somPassoNormal.stop();
    if (somPassoCorrer.isPlaying) somPassoCorrer.stop();
    if (somPassoAgua.isPlaying) somPassoAgua.stop();
    audioAtualTocando = null;
}

// --- LANTERNA ---
const luzLanterna = new THREE.SpotLight(0xfffdd0, 2.5, 40, Math.PI / 6, 0.5, 1);
luzLanterna.castShadow = true;
luzLanterna.visible = false;
camera.add(luzLanterna);
luzLanterna.position.set(0, 0, 0);
luzLanterna.target = new THREE.Object3D();
camera.add(luzLanterna.target);
luzLanterna.target.position.set(0, 0, -1);

// --- GERADORES DE TEXTURAS ---
function gerarTexturaGrama() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#2e8b57'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 20000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#3cb371' : '#228b22';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }
    const textura = new THREE.CanvasTexture(canvas);
    textura.wrapS = THREE.RepeatWrapping; textura.wrapT = THREE.RepeatWrapping;
    textura.repeat.set(60, 60); return textura;
}

function gerarTexturaTronco() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#6d3c24'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 800; i++) {
        ctx.fillStyle = Math.random() > 0.4 ? '#4a2615' : '#572d19';
        ctx.fillRect(Math.random() * 512, 0, Math.random() * 6 + 2, 512);
    }
    return new THREE.CanvasTexture(canvas);
}

function gerarTexturaAgua() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#1d4ed8'; ctx.fillRect(0, 0, 256, 256);
    for(let i=0; i<40; i++) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        let yFixo = Math.random() * 256;
        ctx.moveTo(0, yFixo); ctx.lineTo(256, yFixo); ctx.stroke();
    }
    const textura = new THREE.CanvasTexture(canvas);
    textura.wrapS = THREE.RepeatWrapping; textura.wrapT = THREE.RepeatWrapping;
    textura.repeat.set(8, 8); return textura;
}

const texturaGrama = gerarTexturaGrama();
const texturaTronco = gerarTexturaTronco();
const texturaAgua = gerarTexturaAgua();

// --- ILUMINAÇÃO ---
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.5);
cena.add(luzAmbiente);

const luzSol = new THREE.DirectionalLight(0xfffaed, 0.9);
luzSol.castShadow = true;
luzSol.shadow.mapSize.width = 2048; luzSol.shadow.mapSize.height = 2048;
cena.add(luzSol);

const geoSol = new THREE.SphereGeometry(6, 16, 16);
const matSol = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
const meshSol = new THREE.Mesh(geoSol, matSol);
cena.add(meshSol);

const geoLua = new THREE.SphereGeometry(4, 16, 16);
const matLua = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
const meshLua = new THREE.Mesh(geoLua, matLua);
cena.add(meshLua);

// --- DIMENSÕES DA PONTE ---
const ponteX = 20; const ponteZ = -6; const larguraPonte = 5; const comprimentoPonte = 94; 
const NIVEL_DA_AGUA = -2.0; const alturaPonteY = NIVEL_DA_AGUA + 2.8; 

// --- MONTAGEM DO TERRENO ---
const tamanhoMapa = 400; const segmentos = 100; 
const gTerreno = new THREE.PlaneGeometry(tamanhoMapa, tamanhoMapa, segmentos, segmentos);
const posicoes = gTerreno.attributes.position;
for (let i = 0; i < posicoes.count; i++) {
    const x = posicoes.getX(i); const y = posicoes.getY(i);
    let altura = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 1.2;
    const rotaRioPrincipal = Math.sin(x * 0.02) * 50; 
    const distanciaAoRio = Math.abs(y - rotaRioPrincipal);
    const rotaCorrego = Math.cos(y * 0.03) * 30 + 60;
    const distanciaAoCorrego = Math.abs(x - rotaCorrego);

    if (distanciaAoRio < 25) altura -= Math.cos((distanciaAoRio / 25) * Math.PI / 2) * 6.5; 
    if (distanciaAoCorrego < 12) altura -= Math.cos((distanciaAoCorrego / 12) * Math.PI / 2) * 4.0;
    if (Math.sqrt(x*x + y*y) > 70 && distanciaAoRio > 32) {
        altura += Math.abs(Math.sin(x * 0.015) * Math.cos(y * 0.015)) * 22 * ((Math.sqrt(x*x + y*y) - 70) / 130);
    }
    if (Math.abs(x - ponteX) < 4) {
        const distN = Math.sqrt(Math.pow(x - ponteX, 2) + Math.pow(y - (ponteZ - comprimentoPonte/2), 2));
        if (distN < 10) altura = altura * (1 - Math.cos((distN / 10) * Math.PI / 2)) + ((alturaPonteY - 1.5) * Math.cos((distN / 10) * Math.PI / 2));
        const distS = Math.sqrt(Math.pow(x - ponteX, 2) + Math.pow(y - (ponteZ + comprimentoPonte/2), 2));
        if (distS < 10) altura = altura * (1 - Math.cos((distS / 10) * Math.PI / 2)) + ((alturaPonteY - 1.5) * Math.cos((distS / 10) * Math.PI / 2));
    }
    posicoes.setZ(i, altura);
}
gTerreno.computeVertexNormals(); 
const terreno = new THREE.Mesh(gTerreno, new THREE.MeshStandardMaterial({ map: texturaGrama, roughness: 0.85 }));
terreno.rotation.x = -Math.PI / 2; terreno.receiveShadow = true; cena.add(terreno);

// --- PLANO DA ÁGUA ---
const agua = new THREE.Mesh(new THREE.PlaneGeometry(tamanhoMapa, tamanhoMapa), new THREE.MeshStandardMaterial({ map: texturaAgua, color: 0x2563eb, roughness: 0.05, transparent: true, opacity: 0.8 }));
agua.rotation.x = -Math.PI / 2; agua.position.y = NIVEL_DA_AGUA; cena.add(agua);

function obterAlturaTerreno(x, z) {
    const raioX = (x + tamanhoMapa / 2) / tamanhoMapa * segmentos;
    const raioZ = (z + tamanhoMapa / 2) / tamanhoMapa * segmentos;
    const col = Math.floor(raioX); const lin = Math.floor(raioZ);
    if (col < 0 || col >= segmentos || lin < 0 || lin >= segmentos) return 0;
    let h = gTerreno.attributes.position.getZ(lin * (segmentos + 1) + col) || 0;
    return h < NIVEL_DA_AGUA ? NIVEL_DA_AGUA : h;
}

// --- CONSTRUÇÃO DA PONTE ---
const ponteGrupo = new THREE.Group();
const mMadeira = new THREE.MeshStandardMaterial({ map: texturaTronco, roughness: 0.8 });

const pisoPonte = new THREE.Mesh(new THREE.BoxGeometry(larguraPonte, 0.3, comprimentoPonte), mMadeira);
pisoPonte.castShadow = true; pisoPonte.receiveShadow = true; ponteGrupo.add(pisoPonte);

const corrimaoEsq = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, comprimentoPonte), mMadeira);
corrimaoEsq.position.set(-larguraPonte/2 + 0.1, 1.0, 0); ponteGrupo.add(corrimaoEsq);
const corrimaoDir = corrimaoEsq.clone(); corrimaoDir.position.x = larguraPonte/2 - 0.1; ponteGrupo.add(corrimaoDir);

for(let zOffset = -comprimentoPonte/2; zOffset <= comprimentoPonte/2; zOffset += 4) {
    const pEsq = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), mMadeira);
    pEsq.position.set(-larguraPonte/2 + 0.1, 0.5, zOffset); pEsq.castShadow = true; ponteGrupo.add(pEsq);
    const pDir = pEsq.clone(); pDir.position.x = larguraPonte/2 - 0.1; ponteGrupo.add(pDir);
}

const numDegraus = 5; const profundidadeDegrau = 0.8; const totalEspaçoEscada = numDegraus * profundidadeDegrau;
for (let i = 1; i <= numDegraus; i++) {
    const gDegrau = new THREE.BoxGeometry(larguraPonte, 0.4, profundidadeDegrau);
    const altY = -(i * 0.35); const distZ = (i * profundidadeDegrau) - (profundidadeDegrau/2);
    const dN = new THREE.Mesh(gDegrau, mMadeira); dN.position.set(0, altY, -comprimentoPonte/2 - distZ); dN.castShadow = true; dN.receiveShadow = true; ponteGrupo.add(dN);
    const dS = new THREE.Mesh(gDegrau, mMadeira); dS.position.set(0, altY, comprimentoPonte/2 + distZ); dS.castShadow = true; dS.receiveShadow = true; ponteGrupo.add(dS);
}
ponteGrupo.position.set(ponteX, alturaPonteY, ponteZ); cena.add(ponteGrupo);

const limitePonte = {
    minX: ponteX - larguraPonte/2 - 0.4, maxX: ponteX + larguraPonte/2 + 0.4,
    corpoMinZ: ponteZ - comprimentoPonte/2, corpoMaxZ: ponteZ + comprimentoPonte/2,
    escadaNorteFim: ponteZ - comprimentoPonte/2 - totalEspaçoEscada, escadaSulFim: ponteZ + comprimentoPonte/2 + totalEspaçoEscada,
    topoY: alturaPonteY + 0.15
};

// --- CABANA INTERATIVA ---
const alturaChaoCabana = obterAlturaTerreno(cabanaX, cabanaZ);
const grupoCabana = new THREE.Group();

const matParedesInternas = new THREE.MeshStandardMaterial({ map: texturaTronco, roughness: 0.85 });

const paredeEsq = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 5), matParedesInternas);
paredeEsq.position.set(-3, 2, 0); paredeEsq.castShadow = true; paredeEsq.receiveShadow = true; grupoCabana.add(paredeEsq);

const paredeDir = paredeEsq.clone(); paredeDir.position.x = 3; grupoCabana.add(paredeDir);

const paredeTras = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.3), matParedesInternas);
paredeTras.position.set(0, 2, -2.5); paredeTras.castShadow = true; paredeTras.receiveShadow = true; grupoCabana.add(paredeTras);

const paredeFrontalEsq = new THREE.Mesh(new THREE.BoxGeometry(2.25, 4, 0.3), matParedesInternas);
paredeFrontalEsq.position.set(-1.875, 2, 2.5); paredeFrontalEsq.castShadow = true; grupoCabana.add(paredeFrontalEsq);

const paredeFrontalDir = paredeFrontalEsq.clone(); paredeFrontalDir.position.x = 1.875; grupoCabana.add(paredeFrontalDir);

const vigaTopoPorta = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.3), matParedesInternas);
vigaTopoPorta.position.set(0, 3.4, 2.5); grupoCabana.add(vigaTopoPorta);

const pisoCabana = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 5), new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.9 }));
pisoCabana.position.set(0, 0.075, 0); pisoCabana.receiveShadow = true; grupoCabana.add(pisoCabana);

const telhado = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.9 }));
telhado.position.y = 4 + 1.25; telhado.rotation.y = Math.PI / 4; telhado.castShadow = true; grupoCabana.add(telhado);

// --- 🖼️ ADICIONANDO O QUADRO DE MADEIRA VERTICAL ---
const carregadorTextura = new THREE.TextureLoader();
carregadorTextura.load(CAMINHO_QUADRO_IMAGEM, (texturaQuadro) => {
    const grupoQuadro = new THREE.Group();
    
    const molduraMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 0.1), 
        new THREE.MeshStandardMaterial({ color: 0x2e1a08, roughness: 0.8 })
    );
    molduraMesh.castShadow = true;
    grupoQuadro.add(molduraMesh);

    const telaMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 1.4),
        new THREE.MeshStandardMaterial({ map: texturaQuadro, side: THREE.DoubleSide, roughness: 0.4 })
    );
    telaMesh.position.z = 0.051; 
    grupoQuadro.add(telaMesh);

    grupoQuadro.position.set(0, 2.1, -2.33); 
    grupoCabana.add(grupoQuadro);
}, undefined, () => console.log("Aviso: Imagem oculta"));

// Dobradiça e porta
const grupoDobradica = new THREE.Group();
grupoDobradica.position.set(-0.75, 0, 2.5); 

const meshPorta = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.8, 0.15), new THREE.MeshStandardMaterial({ color: 0x311b0b, roughness: 0.7 }));
meshPorta.position.set(0.75, 1.4, 0); 
meshPorta.castShadow = true;
grupoDobradica.add(meshPorta);
grupoCabana.add(grupoDobradica);
portaObjeto = grupoDobradica; 

grupoCabana.position.set(cabanaX, alturaChaoCabana, cabanaZ);
cena.add(grupoCabana);

function tentarInteragirPorta() {
    const posJ = controles.getObject().position;
    const dx = posJ.x - cabanaX;
    const dz = posJ.z - (cabanaZ + 2.5);
    const distPorta = Math.sqrt(dx*dx + dz*dz);

    if (distPorta < 3.5) { 
        portaAberta = !portaAberta;
        anguloAlvoPorta = portaAberta ? -Math.PI / 1.8 : 0; 
        
        if (portaAberta) {
            if (somPortaAbrir.buffer) {
                if (somPortaAbrir.isPlaying) somPortaAbrir.stop();
                somPortaAbrir.play();
            }
        } else {
            if (somPortaFechar.buffer) {
                if (somPortaFechar.isPlaying) somPortaFechar.stop();
                somPortaFechar.play();
            }
        }
    }
}

// --- PARTÍCULAS DA FOGUEIRA ---
const fogueiraX = -15, fogueiraZ = -13;
const alturaChaoFogo = obterAlturaTerreno(fogueiraX, fogueiraZ);

const mPedras = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
for(let a=0; a<Math.PI*2; a+=Math.PI/4) {
    const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), mPedras);
    p.position.set(fogueiraX + Math.cos(a)*0.6, alturaChaoFogo + 0.1, fogueiraZ + Math.sin(a)*0.6); cena.add(p);
}

const countParticulas = 35;
const geoParticula = new THREE.BufferGeometry();
const posParticulas = new Float32Array(countParticulas * 3);
const dadosParticulas = [];

for(let i=0; i<countParticulas; i++) {
    posParticulas[i*3] = fogueiraX + (Math.random() - 0.5) * 0.3;
    posParticulas[i*3+1] = alturaChaoFogo + Math.random() * 2;
    posParticulas[i*3+2] = fogueiraZ + (Math.random() - 0.5) * 0.3;
    dadosParticulas.push({ vY: Math.random() * 1.5 + 1.0, vX: (Math.random()-0.5)*0.2, vZ: (Math.random()-0.5)*0.2 });
}
geoParticula.setAttribute('position', new THREE.BufferAttribute(posParticulas, 3));
const matParticula = new THREE.PointsMaterial({ color: 0xff4500, size: 0.25, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
const sistemaFumaça = new THREE.Points(geoParticula, matParticula);
cena.add(sistemaFumaça);

const luzFogo = new THREE.PointLight(0xff7700, 2.0, 10);
luzFogo.position.set(fogueiraX, alturaChaoFogo + 0.5, fogueiraZ); cena.add(luzFogo);

// --- NUVENS ---
const grupoNuvens = new THREE.Group();
const matNuven = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
for(let n=0; n<12; n++) {
    const nuvem = new THREE.Group(); const pedacos = Math.floor(Math.random()*3 + 3);
    for(let p=0; p<pedacos; p++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(6+p*2, 3, 5), matNuven);
        b.position.set(p*2.5 - (pedacos), Math.random()*0.5, (Math.random()-0.5)*2); nuvem.add(b);
    }
    nuvem.position.set((Math.random()-0.5)*300, 45 + Math.random()*15, (Math.random()-0.5)*300); grupoNuvens.add(nuvem);
}
cena.add(grupoNuvens);

// --- ELEMENTOS DO CENÁRIO (ÁRVORES E ROCHAS) ---
const objetosMundo = [];
objetosMundo.push({ x: cabanaX - 3, z: cabanaZ, raio: 0.5, topoY: alturaChaoCabana + 4 }); 
objetosMundo.push({ x: cabanaX + 3, z: cabanaZ, raio: 0.5, topoY: alturaChaoCabana + 4 }); 
objetosMundo.push({ x: cabanaX, z: cabanaZ - 2.5, raio: 0.5, topoY: alturaChaoCabana + 4 }); 

function criarArvore(x, z) {
    if (Math.abs(x - ponteX) < 8 && Math.abs(z - ponteZ) < 56) return;
    if (Math.abs(x - cabanaX) < 8 && Math.abs(z - cabanaZ) < 8) return;
    if (obterAlturaTerreno(x, z) <= NIVEL_DA_AGUA) return;
    const group = new THREE.Group(); const altT = 4.5;
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, altT, 16), new THREE.MeshStandardMaterial({ map: texturaTronco, roughness: 0.95 }));
    tronco.position.y = altT / 2; tronco.castShadow = true; group.add(tronco);
    const mFolhas = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.33 + (Math.random()*0.04-0.02), 0.6, 0.25), roughness: 0.7 });
    for(let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(2.4 - (i*0.45), 2.8, 12), mFolhas);
        f.position.y = altT - 0.5 + (i*1.2); f.castShadow = true; group.add(f);
    }
    const h = obterAlturaTerreno(x, z); group.position.set(x, h, z); cena.add(group);
    objetosMundo.push({ x: x, z: z, raio: 1.1, topoY: h + altT + 3.5 });
}

function criarRocha(x, z) {
    if (Math.abs(x - ponteX) < 6 && Math.abs(z - ponteZ) < 52) return;
    if (Math.abs(x - cabanaX) < 7 && Math.abs(z - cabanaZ) < 7) return;
    const s = Math.random() * 2 + 1.5;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), new THREE.MeshStandardMaterial({ color: 0x6e6e6e, roughness: 0.9 }));
    r.scale.set(1.3, Math.random()*0.4+0.7, Math.random()*0.4+1);
    const h = obterAlturaTerreno(x, z); r.position.set(x, h + (s*0.3), z); r.castShadow = true; cena.add(r);
    objetosMundo.push({ x: x, z: z, raio: s*1.2, topoY: h + (s*1.1) });
}

for (let i = 0; i < 130; i++) {
    let x = (Math.random() - 0.5) * 340; let z = (Math.random() - 0.5) * 340;
    if (Math.abs(x) > 12 || Math.abs(z) > 12) { if (Math.random() > 0.45) { criarArvore(x, z); } else { criarRocha(x, z); } }
}

controles.getObject().position.set(0, obterAlturaTerreno(0,0) + ALTURA_JOGADOR, 15);

// --- PROCESSAMENTO DA ANIMAÇÃO (LOOP) ---
const relogio = new THREE.Clock();
let tempoCiclo = 0.5; 

function animar() {
    requestAnimationFrame(animar);
    const delta = relogio.getDelta();

    if (texturaAgua) { texturaAgua.offset.x -= 0.6 * delta; texturaAgua.offset.y += 0.05 * delta; }

    if (portaObjeto) {
        portaObjeto.rotation.y = THREE.MathUtils.lerp(portaObjeto.rotation.y, anguloAlvoPorta, 10 * delta);
    }

    // Ciclo Dia/Noite
    tempoCiclo += delta * 0.015; if(tempoCiclo > Math.PI * 2) tempoCiclo = 0;
    const anguloSol = tempoCiclo; 
    
    const sX = Math.cos(anguloSol) * 160;
    const sY = Math.sin(anguloSol) * 160;
    const sZ = 50;
    
    luzSol.position.set(sX, sY, sZ);
    meshSol.position.set(sX, sY, sZ);
    meshLua.position.set(-sX, -sY, -sZ);

    const alturaSol = Math.sin(anguloSol);
    if (alturaSol > 0.2) {
        cena.background.lerp(corDia, delta * 2); cena.fog.color.lerp(corDia, delta * 2);
        luzSol.intensity = alturaSol * 0.9; luzAmbiente.intensity = 0.5;
    } else if (alturaSol <= 0.2 && alturaSol > -0.2) {
        cena.background.lerp(corOcaso, delta * 2); cena.fog.color.lerp(corOcaso, delta * 2);
        luzSol.intensity = 0.3;
    } else {
        cena.background.lerp(corNoite, delta * 2); cena.fog.color.lerp(corNoite, delta * 2);
        luzSol.intensity = 0.0; luzAmbiente.intensity = 0.12;
    }

    grupoNuvens.children.forEach(n => { n.position.x += 2.0 * delta; if(n.position.x > 200) n.position.x = -200; });
    const pos = sistemaFumaça.geometry.attributes.position.array;
    for(let i=0; i<countParticulas; i++) {
        pos[i*3+1] += dadosParticulas[i].vY * delta; pos[i*3] += dadosParticulas[i].vX * delta; pos[i*3+2] += dadosParticulas[i].vZ * delta;
        if(pos[i*3+1] > alturaChaoFogo + 4.5) {
            pos[i*3+1] = alturaChaoFogo + 0.2; pos[i*3] = fogueiraX + (Math.random() - 0.5) * 0.3; pos[i*3+2] = fogueiraZ + (Math.random() - 0.5) * 0.3;
        }
    }
    sistemaFumaça.geometry.attributes.position.needsUpdate = true;
    luzFogo.intensity = 1.5 + Math.sin(Date.now() * 0.02) * 0.4;

    // DINÂMICA DO PERSONAGEM (FÍSICA)
    velocidade.x -= velocidade.x * 10.0 * delta;
    velocidade.z -= velocidade.z * 10.0 * delta;
    velocidade.y -= GRAVIDADE * delta; 

    direcao.z = Number(moverFrente) - Number(moverTras);
    direcao.x = Number(moverDireita) - Number(moverEsquerda);
    direcao.normalize();

    const posJogador = controles.getObject().position;
    let alturaDoChaoReal = obterAlturaTerreno(posJogador.x, posJogador.z);
    
    const dxPorta = posJogador.x - cabanaX;
    const dzPorta = posJogador.z - (cabanaZ + 2.5);
    const distDaPorta = Math.sqrt(dxPorta*dxPorta + dzPorta*dzPorta);

    promptInteracao.style.display = distDaPorta < 3.5 ? 'block' : 'none';

    if (Math.abs(posJogador.x - cabanaX) < 2.8 && Math.abs(posJogador.z - cabanaZ) < 2.3) {
        alturaDoChaoReal = alturaChaoCabana + 0.15;
        if (!portaAberta && posJogador.z > cabanaZ + 2.1) {
            controles.getObject().position.z = cabanaZ + 2.1;
        }
    }

    let estaNaAgua = false; let noPisoDaPonte = false;

    if (posJogador.x >= limitePonte.minX && posJogador.x <= limitePonte.maxX) {
        if (posJogador.z >= limitePonte.corpoMinZ && posJogador.z <= limitePonte.corpoMaxZ) noPisoDaPonte = true;
        else if (posJogador.z >= limitePonte.escadaNorteFim && posJogador.z <= limitePonte.escadaSulFim) noPisoDaPonte = true;
    }

    if (alturaDoChaoReal <= NIVEL_DA_AGUA && !noPisoDaPonte && (posJogador.y - ALTURA_JOGADOR) <= NIVEL_DA_AGUA + 0.2) {
        estaNaAgua = true;
    }

    const redutorAgua = estaNaAgua ? 0.45 : 1.0;
    const multiplicadorVelocidade = correndo ? 1.7 : 1.0;

    if (moverFrente || moverTras) velocidade.z -= direcao.z * VELOCIDADE_BASE * multiplicadorVelocidade * redutorAgua * delta;
    if (moverEsquerda || moverDireita) velocidade.x -= direcao.x * VELOCIDADE_BASE * multiplicadorVelocidade * redutorAgua * delta;

    if (estaNaAgua) velocidade.x += 18.0 * delta; 

    const posAntigaX = controles.getObject().position.x;
    const posAntigaZ = controles.getObject().position.z;

    controles.moveRight(-velocidade.x * delta);
    controles.moveForward(-velocidade.z * delta);

    let alturaPisoAtual = alturaDoChaoReal + ALTURA_JOGADOR;

    if (posJogador.x >= limitePonte.minX && posJogador.x <= limitePonte.maxX) {
        if (posJogador.z >= limitePonte.corpoMinZ && posJogador.z <= limitePonte.corpoMaxZ) {
            alturaPisoAtual = limitePonte.topoY + ALTURA_JOGADOR;
        } else if (posJogador.z >= limitePonte.escadaNorteFim && posJogador.z < limitePonte.corpoMinZ) {
            const t = (posJogador.z - limitePonte.escadaNorteFim) / totalEspaçoEscada; 
            alturaPisoAtual = obterAlturaTerreno(posJogador.x, posJogador.z) + (limitePonte.topoY - obterAlturaTerreno(posJogador.x, posJogador.z)) * t + ALTURA_JOGADOR;
        } else if (posJogador.z > limitePonte.corpoMaxZ && posJogador.z <= limitePonte.escadaSulFim) {
            const t = (limitePonte.escadaSulFim - posJogador.z) / totalEspaçoEscada;
            alturaPisoAtual = obterAlturaTerreno(posJogador.x, posJogador.z) + (limitePonte.topoY - obterAlturaTerreno(posJogador.x, posJogador.z)) * t + ALTURA_JOGADOR;
        }
    }

    for (let i = 0; i < objetosMundo.length; i++) {
        const obj = objetosMundo[i];
        const dx = posJogador.x - obj.x; const dz = posJogador.z - obj.z;
        if (Math.sqrt(dx*dx + dz*dz) < obj.raio) {
            if (posJogador.y - ALTURA_JOGADOR >= obj.topoY - 0.6) {
                alturaPisoAtual = obj.topoY + ALTURA_JOGADOR;
            } else {
                controles.getObject().position.x = posAntigaX;
                controles.getObject().position.z = posAntigaZ;
                break;
            }
        }
    }

    posJogador.y += (velocidade.y * delta);

    if (posJogador.y < alturaPisoAtual) {
        velocidade.y = 0;
        posJogador.y = alturaPisoAtual;
        podeSaltar = true;
    }

    // --- 🎵 GERENCIAMENTO DE ÁUDIO 🎵 ---
    const estaAndando = moverFrente || moverTras || moverEsquerda || moverDireita;
    
    if (estaAndando && podeSaltar) {
        const freqModificador = correndo ? 14.5 : 9.5;
        temporizadorBobbing += delta * freqModificador;
        camera.position.y = Math.sin(temporizadorBobbing) * (correndo ? 0.12 : 0.06);
        camera.position.x = Math.cos(temporizadorBobbing * 0.5) * (correndo ? 0.07 : 0.04);

        let somAlvo = somPassoNormal;
        if (estaNaAgua) {
            somAlvo = somPassoAgua;
        } else if (correndo) {
            somAlvo = somPassoCorrer;
        }

        if (audioAtualTocando && audioAtualTocando !== somAlvo) {
            audioAtualTocando.stop();
        }

        if (somAlvo.buffer && !somAlvo.isPlaying) {
            somAlvo.play();
        }
        audioAtualTocando = somAlvo;

    } else {
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 8 * delta);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 8 * delta);
        pararSonsDeMovimento();
    }

    renderizador.render(cena, camera);
}

animar();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});