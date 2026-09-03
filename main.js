const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) throw new Error("WebGL 2 não suportado.");

// Configuração WebGL
const vertexShaderSource = `#version 300 es
in vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 4.0;
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 outColor;
void main() {
    outColor = uColor;
}`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getUniformLocation(program, "uColor");

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.clearColor(0.9, 0.9, 0.9, 1.0);
gl.useProgram(program);

const cores = [
    [0.0, 0.0, 0.0, 1.0], // 0: Preto
    [1.0, 0.0, 0.0, 1.0], // 1: Vermelho
    [0.0, 1.0, 0.0, 1.0], // 2: Verde
    [0.0, 0.0, 1.0, 1.0], // 3: Azul
    [1.0, 1.0, 0.0, 1.0], // 4: Amarelo
    [1.0, 0.0, 1.0, 1.0], // 5: Magenta
    [0.0, 1.0, 1.0, 1.0], // 6: Ciano
    [1.0, 0.5, 0.0, 1.0], // 7: Laranja
    [0.5, 0.0, 0.5, 1.0], // 8: Roxo
    [0.5, 0.5, 0.5, 1.0]  // 9: Cinza
];

// Estados do programa
let corAtual = cores[3]; // Inicia azul[cite: 3]
let modoAtual = 'r';     // 'r' = reta, 't' = triângulo[cite: 3]
let estadoDoClique = 0;  // Contador de cliques
let cliques = [];        // Armazena posições dos cliques
let pontosDaFiguraAtual = []; // Pixels finais calculados

// Eventos de Teclado
window.addEventListener('keydown', function(evento) {
    let tecla = evento.key.toLowerCase();
    
    // Troca de modo para reta ou triângulo[cite: 3]
    if (tecla === 'r' || tecla === 't') {
        modoAtual = tecla;
        estadoDoClique = 0; // Reinicia ciclo de cliques
        cliques = [];
    } 
    // Troca de cor[cite: 3]
    else if (tecla >= '0' && tecla <= '9') {
        corAtual = cores[parseInt(tecla)];
        desenharNaGPU(); // Atualiza cor da figura atual na tela
    }
});

// Eventos de Mouse
canvas.addEventListener('mousedown', function(evento) {
    // Registra o clique atual, o buffer lá 
    cliques.push({ x: evento.offsetX, y: evento.offsetY });
    estadoDoClique++;
    
    // Lógica para Reta (2 cliques)
    if (modoAtual === 'r' && estadoDoClique === 2) {
        pontosDaFiguraAtual = []; // Limpa figura anterior[cite: 3]
        calcularBresenham(cliques[0].x, cliques[0].y, cliques[1].x, cliques[1].y);
        desenharNaGPU();
        
        // Reset para próxima reta
        estadoDoClique = 0;
        cliques = [];
    } 
    // Lógica para Triângulo (3 cliques)
    else if (modoAtual === 't' && estadoDoClique === 3) {
        pontosDaFiguraAtual = []; // Limpa figura anterior[cite: 3]
        
        // Traça 3 retas conectando os 3 vértices[cite: 3]
        calcularBresenham(cliques[0].x, cliques[0].y, cliques[1].x, cliques[1].y);
        calcularBresenham(cliques[1].x, cliques[1].y, cliques[2].x, cliques[2].y);
        calcularBresenham(cliques[2].x, cliques[2].y, cliques[0].x, cliques[0].y);
        
        desenharNaGPU();
        
        // Reset para próximo triângulo
        estadoDoClique = 0;
        cliques = [];
    }
});

// Algoritmo de Bresenham (Matemática de Pixels)
function calcularBresenham(x1, y1, x2, y2) {
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    let erro = dx - dy;

    while (true) {
        // Armazena pixel calculado no array global da figura
        pontosDaFiguraAtual.push(x1, y1);

        if (x1 === x2 && y1 === y2) break;

        let e2 = 2 * erro;
        if (e2 > -dy) { erro -= dy; x1 += sx; }
        if (e2 < dx) { erro += dx; y1 += sy; }
    }
}

// Envio para o WebGL
function desenharNaGPU() {
    if (pontosDaFiguraAtual.length === 0) return;

    let verticesWebGL = [];

    // Normalização (Pixels -> Coordenadas WebGL)
    for (let i = 0; i < pontosDaFiguraAtual.length; i += 2) {
        let glX = (pontosDaFiguraAtual[i] / (canvas.width / 2)) - 1.0;
        let glY = -((pontosDaFiguraAtual[i + 1] / (canvas.height / 2)) - 1.0);
        verticesWebGL.push(glX, glY);
    }

    // Passos de renderização
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesWebGL), gl.STATIC_DRAW);
    
    gl.clear(gl.COLOR_BUFFER_BIT); // Limpa tela
    gl.uniform4f(colorLocation, corAtual[0], corAtual[1], corAtual[2], corAtual[3]);
    
    // Desenha utilizando apenas pontos (sem GL_LINES)[cite: 3]
    gl.drawArrays(gl.POINTS, 0, verticesWebGL.length / 2); 
}

// Inicialização: Linha azul (0,0) a (0,0)[cite: 3]
modoAtual = 'r';
calcularBresenham(0, 0, 0, 0);
desenharNaGPU();