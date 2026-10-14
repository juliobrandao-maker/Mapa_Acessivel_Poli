// ==========================================
// 1. CAPTURA DO LOCAL VIA QR CODE (URL)
// ==========================================
const parametrosURL = new URLSearchParams(window.location.search);
const pontoOrigem = parametrosURL.get('origem') || 'entrada';

const statusLocal = document.getElementById('status-local');

const nomesLocais = {
    entrada: "Entrada Principal",
    bloco_a: "Bloco A (Auditório / NAPSI)",
    biblioteca: "Biblioteca",
    bloco_b: "Bloco B (Escolaridade / Tesouraria)",
    bloco_c: "Bloco C (ECOMP)",
    bloco_d: "Bloco D",
    bloco_e: "Bloco E / DEX",
    bloco_f: "Bloco F (LIP 1 / LIP 2)",
    bloco_g: "Bloco G (LIP 7)",
    bloco_i: "Bloco I (DATP)",
    bloco_j: "Bloco J (LIP 5 / LIP 6)",
    bloco_k: "Bloco K",
    quadra: "Quadra / Estacionamento",
    praca: "Praça Central"
};

statusLocal.textContent = `📍 Você está em: ${nomesLocais[pontoOrigem] || "Local Desconhecido"}`;


// ==========================================
// 2. CONFIGURAÇÃO DO MAPA
// ==========================================
const mapa = L.map('mapa', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2
});

const larguraImagem = 1000;
const alturaImagem = 460;
const limitesMapa = [[0, 0], [alturaImagem, larguraImagem]];

// Certifica-te de que o ficheiro na pasta assets tem exatamente este nome
const urlImagemMapa = 'assets/Planta_Poli.jpeg';

const overlayImagem = L.imageOverlay(urlImagemMapa, limitesMapa).addTo(mapa);
mapa.fitBounds(limitesMapa);


// ==========================================
// 3. REDE DE NÓS (CORREDORES E BLOCOS)
// ==========================================
const pontos = {
    // Destinos
    entrada: [30, 310],
    quadra: [100, 200],
    bloco_a: [280, 180],
    biblioteca: [230, 420],
    bloco_b: [100, 520],
    bloco_g: [200, 560],
    bloco_f: [200, 650],
    bloco_i: [380, 450],
    bloco_k: [330, 640],
    bloco_e: [280, 760],
    bloco_d: [250, 860],
    bloco_j: [120, 820],
    bloco_c: [170, 940],
    praca: [330, 510],

    // Nós de cruzamento de corredores (Waypoints)
    c_portao: [80, 310],
    c_quadra: [80, 200],
    c_biblio: [140, 420],
    c_corredor_sul_1: [80, 520],
    c_corredor_sul_2: [80, 650],
    c_corredor_sul_3: [80, 820],
    c_corredor_norte_1: [320, 450],
    c_corredor_norte_2: [320, 640],
    c_corredor_norte_3: [280, 860],
    c_praca: [270, 510]
};

// Grafo de conexões dos corredores
const grafo = {
    entrada: ['c_portao'],
    c_portao: ['entrada', 'c_quadra', 'c_corredor_sul_1', 'c_biblio'],
    c_quadra: ['c_portao', 'quadra', 'bloco_a'],
    quadra: ['c_quadra'],
    bloco_a: ['c_quadra'],

    c_biblio: ['c_portao', 'biblioteca', 'c_praca'],
    biblioteca: ['c_biblio'],

    c_corredor_sul_1: ['c_portao', 'bloco_b', 'bloco_g', 'c_corredor_sul_2'],
    bloco_b: ['c_corredor_sul_1'],
    bloco_g: ['c_corredor_sul_1'],

    c_corredor_sul_2: ['c_corredor_sul_1', 'bloco_f', 'c_corredor_sul_3'],
    bloco_f: ['c_corredor_sul_2'],

    c_corredor_sul_3: ['c_corredor_sul_2', 'bloco_j', 'bloco_c'],
    bloco_j: ['c_corredor_sul_3'],
    bloco_c: ['c_corredor_sul_3'],

    c_praca: ['c_biblio', 'praca', 'c_corredor_norte_1'],
    praca: ['c_praca'],

    c_corredor_norte_1: ['c_praca', 'bloco_i', 'c_corredor_norte_2'],
    bloco_i: ['c_corredor_norte_1'],

    c_corredor_norte_2: ['c_corredor_norte_1', 'bloco_k', 'bloco_e', 'c_corredor_norte_3'],
    bloco_k: ['c_corredor_norte_2'],
    bloco_e: ['c_corredor_norte_2'],

    c_corredor_norte_3: ['c_corredor_norte_2', 'bloco_d'],
    bloco_d: ['c_corredor_norte_3']
};

// Marcador da Origem Atual
if (pontos[pontoOrigem]) {
    L.marker(pontos[pontoOrigem]).addTo(mapa)
        .bindPopup(`<b>Você está aqui:</b><br>${nomesLocais[pontoOrigem]}`)
        .openPopup();
}

// Marcadores clicáveis nos destinos
Object.keys(nomesLocais).forEach(chave => {
    if (chave !== pontoOrigem && pontos[chave]) {
        const marker = L.circleMarker(pontos[chave], {
            radius: 8,
            color: '#38bdf8',
            fillColor: '#0284c7',
            fillOpacity: 0.8
        }).addTo(mapa);

        marker.bindPopup(`
            <b>${nomesLocais[chave]}</b><br>
            <button class="btn-pop-rota" onclick="tracarRotaDireta('${chave}')">Traçar Rota para cá</button>
        `);
    }
});


// ==========================================
// 4. ALGORITMO DE NAVEGAÇÃO POR CORREDORES
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
        opacity: 0.9,
        dashArray: '8, 8'
    }).addTo(mapa);

    mapa.fitBounds(linhaRotaAtual.getBounds(), { padding: [40, 40] });
}

window.tracarRotaDireta = function(destinoKey) {
    document.getElementById('select-destino').value = destinoKey;
    desenharRota(destinoKey);
    mapa.closePopup();
};

document.getElementById('btn-tracar-rota').addEventListener('click', function() {
    const destino = document.getElementById('select-destino').value;
    if (!destino) {
        alert("Por favor, selecione um destino!");
        return;
    }
    desenharRota(destino);
});