// ==========================================
// 1. CAPTURA DO LOCAL VIA QR CODE (URL)
// ==========================================
const parametrosURL = new URLSearchParams(window.location.search);
const pontoOrigem = parametrosURL.get('origem') || 'entrada';

const statusLocal = document.getElementById('status-local');

const nomesLocais = {
    entrada: "Entrada Principal",
    quadra: "Quadra / Estacionamento",
    bloco_a: "Bloco A (Auditório / NAPSI)",
    biblioteca: "Biblioteca (LIP 3)",
    bloco_b: "Bloco B (Escolaridade / Tesouraria / Protocolo)",
    bloco_g: "Bloco G (LIP 7)",
    bloco_f: "Bloco F (LIP 1 / LIP 2)",
    praca: "Praça Central",
    bloco_j: "Bloco J (LIP 5 / LIP 6)",
    bloco_c: "Bloco C (ECOMP)",
    bloco_i: "Bloco I (DATP)",
    bloco_k: "Bloco K",
    bloco_e: "Bloco E / DEX",
    bloco_d: "Bloco D"
};

statusLocal.textContent = `📍 Você está em: ${nomesLocais[pontoOrigem] || "Local Desconhecido"}`;


// ==========================================
// 2. CONFIGURAÇÃO DO MAPA & CANVAS (16:9 - 1000x562)
// ==========================================
const mapa = L.map('mapa', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2
});

const larguraImagem = 1000;
const alturaImagem = 562;
const limitesMapa = [[0, 0], [alturaImagem, larguraImagem]];

// Caminho para a nova imagem em Dark Mode
const urlImagemMapa = 'assets/Planta_Poli.png';

const overlayImagem = L.imageOverlay(urlImagemMapa, limitesMapa).addTo(mapa);
mapa.fitBounds(limitesMapa);


// ==========================================
// 3. COORDENADAS RECALIBRADAS [Y, X]
// ==========================================
const pontos = {
    // --- DESTINOS PRINCIPAIS ---
    entrada: [45, 325],
    quadra: [145, 200],
    bloco_a: [345, 185],
    biblioteca: [280, 420],
    bloco_b: [145, 545],
    bloco_g: [280, 560],
    bloco_f: [280, 658],
    praca: [275, 795],
    bloco_j: [140, 828],
    bloco_c: [185, 935],
    bloco_i: [450, 435],
    bloco_k: [410, 620],
    bloco_e: [348, 768],
    bloco_d: [315, 862],

    // --- CORREDORES E WAYPOINTS (NÓS DE PASSAGEM) ---
    c_entrada: [65, 325],        // Corredor de entrada
    c_quadra_sul: [145, 310],    // Cruzamento Quadra / Bloco B
    c_quadra_norte: [280, 310],  // Cruzamento Quadra / Bloco A / Biblioteca
    c_bloco_a: [345, 290],       // Entrada do Bloco A
    c_sul_1: [215, 390],         // Corredor Sul (Oeste do Bloco B)
    c_sul_2: [215, 545],         // Corredor Sul (Centro do Bloco B)
    c_sul_3: [215, 680],         // Corredor Sul (Leste do Bloco B)
    c_sul_4: [215, 780],         // Cruzamento Bloco B / Bloco J / Praça
    c_biblio_acesso: [245, 420], // Acesso Biblioteca Sul
    c_praca_sup: [360, 518],     // Praça Superior (Entre Biblioteca e Bloco I/K)
    c_norte_1: [395, 435],       // Corredor Norte (Bloco I)
    c_norte_2: [365, 620],       // Corredor Norte (Bloco K)
    c_norte_3: [310, 768],       // Corredor Norte (Bloco E)
    c_norte_4: [280, 862],       // Corredor Norte (Bloco D)
    c_bloco_c: [185, 885]        // Corredor de Acesso ao Bloco C
};

// ==========================================
// 4. GRAFO DE CONEXÕES DOS CORREDORES
// ==========================================
const grafo = {
    entrada: ['c_entrada'],
    c_entrada: ['entrada', 'c_quadra_sul'],

    c_quadra_sul: ['c_entrada', 'quadra', 'c_sul_1', 'c_quadra_norte'],
    quadra: ['c_quadra_sul'],

    c_quadra_norte: ['c_quadra_sul', 'c_bloco_a', 'biblioteca', 'c_norte_1'],
    c_bloco_a: ['bloco_a', 'c_quadra_norte'],
    bloco_a: ['c_bloco_a'],

    c_sul_1: ['c_quadra_sul', 'bloco_b', 'c_biblio_acesso', 'c_sul_2'],
    c_biblio_acesso: ['c_sul_1', 'biblioteca'],
    biblioteca: ['c_biblio_acesso', 'c_praca_sup'],

    c_sul_2: ['c_sul_1', 'bloco_b', 'bloco_g', 'c_sul_3'],
    bloco_b: ['c_sul_1', 'c_sul_2', 'c_sul_3'],
    bloco_g: ['c_sul_2'],

    c_sul_3: ['c_sul_2', 'bloco_f', 'c_sul_4'],
    bloco_f: ['c_sul_3'],

    c_sul_4: ['c_sul_3', 'bloco_j', 'praca', 'c_bloco_c', 'c_norte_3'],
    bloco_j: ['c_sul_4'],
    praca: ['c_sul_4'],
    c_bloco_c: ['c_sul_4', 'bloco_c'],
    bloco_c: ['c_bloco_c'],

    c_praca_sup: ['biblioteca', 'c_norte_1', 'c_norte_2'],

    c_norte_1: ['c_quadra_norte', 'bloco_i', 'c_praca_sup', 'c_norte_2'],
    bloco_i: ['c_norte_1'],

    c_norte_2: ['c_norte_1', 'bloco_k', 'c_praca_sup', 'c_norte_3'],
    bloco_k: ['c_norte_2'],

    c_norte_3: ['c_norte_2', 'bloco_e', 'c_sul_4', 'c_norte_4'],
    bloco_e: ['c_norte_3'],

    c_norte_4: ['c_norte_3', 'bloco_d'],
    bloco_d: ['c_norte_4']
};


// ==========================================
// 5. MARCADORES NO MAPA
// ==========================================

// Ponto de Origem Atual
if (pontos[pontoOrigem]) {
    L.marker(pontos[pontoOrigem]).addTo(mapa)
        .bindPopup(`<b>Você está aqui:</b><br>${nomesLocais[pontoOrigem]}`)
        .openPopup();
}

// Marcadores clicáveis para cada Bloco
Object.keys(nomesLocais).forEach(chave => {
    if (chave !== pontoOrigem && pontos[chave]) {
        const marker = L.circleMarker(pontos[chave], {
            radius: 8,
            color: '#38bdf8',
            fillColor: '#0284c7',
            fillOpacity: 0.9,
            weight: 2
        }).addTo(mapa);

        marker.bindPopup(`
            <div style="text-align: center;">
                <b>${nomesLocais[chave]}</b><br>
                <button class="btn-pop-rota" onclick="tracarRotaDireta('${chave}')">Traçar Rota para cá</button>
            </div>
        `);
    }
});


// ==========================================
// 6. ALGORITMO DE BUSCA DE ROTA
// ==========================================
function encontrarCaminho(inicio, fim) {
    let fila = [[inicio]];
    let visitados = new Set([inicio]);

    while (fila.length > 0) {
        let caminho = fila.shift();
        let noAtual = caminho[caminho.length - 1];

        if (noAtual === fim) {
            return caminho.map(no => pontos[no]);
        }

        for (let vizinho of (grafo[noAtual] || [])) {
            if (!visitados.has(vizinho)) {
                visitados.add(vizinho);
                fila.push([...caminho, vizinho]);
            }
        }
    }
    return [pontos[inicio], pontos[fim]];
}

let linhaRotaAtual = null;

function desenharRota(destino) {
    const coordsCaminho = encontrarCaminho(pontoOrigem, destino);

    if (linhaRotaAtual) {
        mapa.removeLayer(linhaRotaAtual);
    }

    linhaRotaAtual = L.polyline(coordsCaminho, {
        color: '#facc15', // Amarelo de alto contraste
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '10, 8'
    }).addTo(mapa);

    mapa.fitBounds(linhaRotaAtual.getBounds(), { padding: [40, 40] });
}

window.tracarRotaDireta = function(destinoKey) {
    const selectDestino = document.getElementById('select-destino');
    if (selectDestino) selectDestino.value = destinoKey;
    desenharRota(destinoKey);
    mapa.closePopup();
};

const btnTracar = document.getElementById('btn-tracar-rota');
if (btnTracar) {
    btnTracar.addEventListener('click', function() {
        const destino = document.getElementById('select-destino').value;
        if (!destino) {
            alert("Por favor, selecione um destino!");
            return;
        }
        desenharRota(destino);
    });
}