const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// =========================================================
// CONFIGURAÇÃO INICIAL DO WEBGL (Shaders e Buffer)
// =========================================================

const vertexShaderSource = `#version 300 es
in vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 4.0; // Aumentamos o tamanho do ponto para enxergar melhor na tela
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

gl.clearColor(0.9, 0.9, 0.9, 1.0); // Fundo cinza bem claro
gl.useProgram(program);


// Índice de 10 cores (Teclas de 0 a 9)
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

let corAtual = cores[3]; // A tarefa exige começar com a cor azul

let estadoDoClique = 0; 
let x0 = 0, y0 = 0, xend = 0, yend = 0;

// Array para guardar todos os pixels da reta atual (útil para trocar a cor sem precisar clicar de novo)
let pontosDaRetaAtual = [];


// =========================================================
// EVENTOS DE MOUSE E TECLADO
// =========================================================

canvas.addEventListener('mousedown', function(evento) {
    if (estadoDoClique === 0) {
        // 2. PRIMEIRO CLIQUE (Ponto de Partida)
        x0 = evento.offsetX;
        y0 = evento.offsetY;
        estadoDoClique = 1; // Prepara a memória para o próximo clique
        
    } else if (estadoDoClique === 1) {
        // 3. SEGUNDO CLIQUE (Ponto Final)
        xend = evento.offsetX;
        yend = evento.offsetY;
        
        // 4. Executa o algoritmo usando os Pixels Inteiros!
        calcularBresenham(x0, y0, xend, yend);
        
        estadoDoClique = 0; // Zera a memória para a próxima reta
    }
});

window.addEventListener('keydown', function(evento) {
    let tecla = evento.key;
    // Verifica se a tecla apertada é um número entre 0 e 9
    if (tecla >= '0' && tecla <= '9') {
        let indice = parseInt(tecla);
        corAtual = cores[indice]; // Atualiza a cor
        desenharNaGPU(); // Pinta a reta que já está na memória com a nova cor
    }
});


// =========================================================
// D. ALGORITMO DE BRESENHAM (Matemática de Pixels)
// =========================================================

function calcularBresenham(x1, y1, x2, y2) {
    pontosDaRetaAtual = []; // Limpa a reta antiga

    // Esta é a versão generalizada de Bresenham. 
    // Ela condensa todos os cenários dos slides (m < 1, m > 1, m negativo, etc)[cite: 3].
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    
    // Define a direção de crescimento (se vai pra frente ou pra trás)
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    
    // Fator de decisão iterativo (O 'p' dos slides)[cite: 3]
    let erro = dx - dy;

    while (true) {
        // Guarda o Pixel Inteiro no array
        pontosDaRetaAtual.push(x1, y1);

        // Se chegou no ponto final, encerra o laço
        if (x1 === x2 && y1 === y2) break;

        // Cálculos de decisão para saber qual pixel pintar em seguida
        let e2 = 2 * erro;
        if (e2 > -dy) { 
            erro -= dy; 
            x1 += sx; 
        }
        if (e2 < dx) { 
            erro += dx; 
            y1 += sy; 
        }
    }

    // Após calcular todos os pixels, manda desenhar
    desenharNaGPU();
}

function desenharNaGPU() {
    if (pontosDaRetaAtual.length === 0) return;

    let verticesWebGL = [];

    for (let i = 0; i < pontosDaRetaAtual.length; i += 2) {
        let pixelX = pontosDaRetaAtual[i];
        let pixelY = pontosDaRetaAtual[i + 1];

        // Regra de 3 para normalizar X
        let glX = (pixelX / (canvas.width / 2)) - 1.0;
        
        // Regra de 3 para normalizar Y (Com o SINAL NEGATIVO na frente!)
        let glY = -((pixelY / (canvas.height / 2)) - 1.0);

        verticesWebGL.push(glX, glY);
    }

    // 1. Atualiza o Buffer na Placa de Vídeo
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesWebGL), gl.STATIC_DRAW);

    // 2. Apaga a tela (O "Wipe")
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 3. Define a Cor Atual
    gl.uniform4f(colorLocation, corAtual[0], corAtual[1], corAtual[2], corAtual[3]);

    // 4. Manda desenhar ponto por ponto usando o algoritmo (NÃO usa GL_LINES)[cite: 3]
    // O último parâmetro divide por 2 porque cada ponto usa 2 coordenadas (X e Y)
    gl.drawArrays(gl.POINTS, 0, verticesWebGL.length / 2); 
}

calcularBresenham(0, 0, 0, 0);
