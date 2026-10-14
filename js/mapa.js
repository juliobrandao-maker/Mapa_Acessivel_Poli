// ==========================================
// 1. CAPTURA DO LOCAL VIA QR CODE (URL)
// ==========================================
// Exemplo: se o link for .../?origem=bloco_a
const parametrosURL = new URLSearchParams(window.location.search);
const pontoOrigem = parametrosURL.get('origem') || 'entrada_principal';

const statusLocal = document.getElementById('status-local');

// Nomes amigáveis dos pontos do campus
const nomesLocais = {
    entrada_principal: "Entrada Principal (Portão)",
    bloco_a: "Bloco A",
    bloco_b: "Bloco B",
    biblioteca: "Biblioteca",
    diretoria: "Diretoria / Escolaridade",
    laboratorios: "Laboratórios",
    cantina: "Cantina / Vivência"
};

// Exibe na tela onde o aluno está
statusLocal.textContent = `📍 Você está em: ${nomesLocais[pontoOrigem] || "Local Desconhecido"}`;


// ==========================================
// 2. CONFIGURAÇÃO DO MAPA (LEAFLET.JS)
// ==========================================
// L.CRS.Simple faz o mapa usar coordenadas simples [y, x] de uma imagem
const mapa = L.map('mapa', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2
});

// Resolução simulada da imagem do mapa (largura x altura em pixels)
const larguraImagem = 1200;
const alturaImagem = 800;
const limitesMapa = [[0, 0], [alturaImagem, larguraImagem]];

// Imagem temporária via URL para testes (placeholder)
const urlImagemMapa = 'https://via.placeholder.com/1200x800/003366/FFFFFF?text=Planta+Baixa+POLI+UPE';

L.imageOverlay(urlImagemMapa, limitesMapa).addTo(mapa);
mapa.fitBounds(limitesMapa);


// ==========================================
// 3. COORDENADAS DOS PONTOS DO CAMPUS (Y, X)
// ==========================================
// Posição aproximada na imagem do mapa [vertical, horizontal]
const coordenadas = {
    entrada_principal: [100, 200],
    bloco_a: [250, 400],
    bloco_b: [450, 600],
    biblioteca: [600, 300],
    diretoria: [300, 800],
    laboratorios: [500, 950],
    cantina: [200, 1000]
};

// Marca o ponto inicial onde o aluno está
if (coordenadas[pontoOrigem]) {
    L.marker(coordenadas[pontoOrigem]).addTo(mapa)
        .bindPopup(`<b>Você está aqui:</b><br>${nomesLocais[pontoOrigem]}`)
        .openPopup();
}


// ==========================================
// 4. LÓGICA DE TRAÇAR A ROTA
// ==========================================
let linhaRotaAtual = null; // Guarda a linha desenhada no mapa

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

    // Se já existir uma rota desenhada, remove ela antes de desenhar a nova
    if (linhaRotaAtual) {
        mapa.removeLayer(linhaRotaAtual);
    }

    // Desenha uma linha de rota destacada (Amarela/Verde de alto contraste com borda)
    linhaRotaAtual = L.polyline([pontoInicio, pontoFim], {
        color: '#ff0055',    // Cor da linha
        weight: 6,           // Espessura
        opacity: 0.8,        // Transparência
        dashArray: '10, 10'  // Linha tracejada para facilitar a visualização
    }).addTo(mapa);

    // Ajusta o zoom do mapa para mostrar todo o trajeto da rota
    mapa.fitBounds(linhaRotaAtual.getBounds(), { padding: [50, 50] });
});