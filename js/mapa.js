// ==========================================
// 1. CAPTURA DO LOCAL VIA QR CODE (URL)
// ==========================================
const parametrosURL = new URLSearchParams(window.location.search);
const pontoOrigem = parametrosURL.get('origem') || 'entrada';

const statusLocal = document.getElementById('status-local');

// Nomes amigáveis de todos os blocos do campus POLI
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

// Atualiza a indicação do local no ecrã
statusLocal.textContent = `📍 Você está em: ${nomesLocais[pontoOrigem] || "Local Desconhecido"}`;


// ==========================================
// 2. CONFIGURAÇÃO DO MAPA COM A PLANTA REAL
// ==========================================
const mapa = L.map('mapa', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2
});

// Dimensões proporcionais da imagem da planta
const larguraImagem = 1000;
const alturaImagem = 460;
const limitesMapa = [[0, 0], [alturaImagem, larguraImagem]];

// Ficheiro da planta na pasta assets (atualizado para .jpg)
const urlImagemMapa = 'assets/Planta_Poli.jpeg';

L.imageOverlay(urlImagemMapa, limitesMapa).addTo(mapa);
mapa.fitBounds(limitesMapa);


// ==========================================
// 3. COORDENADAS APROXIMADAS DOS BLOCOS (Y, X)
// ==========================================
const coordenadas = {
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
    praca: [330, 510]
};

// Adiciona o marcador de posição atual
if (coordenadas[pontoOrigem]) {
    L.marker(coordenadas[pontoOrigem]).addTo(mapa)
        .bindPopup(`<b>Você está aqui:</b><br>${nomesLocais[pontoOrigem]}`)
        .openPopup();
}


// ==========================================
// 4. LÓGICA DE TRAÇAR A ROTA
// ==========================================
let linhaRotaAtual = null;

document.getElementById('btn-tracar-rota').addEventListener('click', function() {
    const destinoSelecionado = document.getElementById('select-destino').value;

    if (!destinoSelecionado) {
        alert("Por favor, selecione um destino no menu!");
        return;
    }

    const pontoInicio = coordenadas[pontoOrigem];
    const pontoFim = coordenadas[destinoSelecionado];

    if (!pontoInicio || !pontoFim) {
        alert("Ponto de origem ou destino não encontrado!");
        return;
    }

    if (linhaRotaAtual) {
        mapa.removeLayer(linhaRotaAtual);
    }

    linhaRotaAtual = L.polyline([pontoInicio, pontoFim], {
        color: '#ff0055',
        weight: 6,
        opacity: 0.85,
        dashArray: '10, 10'
    }).addTo(mapa);

    mapa.fitBounds(linhaRotaAtual.getBounds(), { padding: [50, 50] });
});


// ==========================================
// 5. FERRAMENTA DE DESENVOLVEDOR (Ajuste fino de Coordenadas)
// Clique em qualquer sala/bloco no mapa para ver a coordenada [Y, X] no ecrã
// ==========================================
mapa.on('click', function(e) {
    const y = Math.round(e.latlng.lat);
    const x = Math.round(e.latlng.lng);
    console.log(`Ponto clicado -> Coordenadas: [${y}, ${x}]`);

    L.popup()
        .setLatLng(e.latlng)
        .setContent(`Coordenadas: <b>[${y}, ${x}]</b>`)
        .openOn(mapa);
});