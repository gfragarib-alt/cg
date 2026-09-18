const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// SHADERS
// --------------------------------------------------

const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform mat3 u_transform;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 outColor;

void main() {
    outColor = uColor;
}
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}

// --------------------------------------------------
// CONFIGURAÇÃO DOS ATRIBUTOS
// --------------------------------------------------

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

const positionLocation = gl.getAttribLocation(program, "aPosition");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
const colorLocation = gl.getUniformLocation(program, "uColor");
const transformLocation = gl.getUniformLocation(program, "u_transform");

// --------------------------------------------------
// FUNÇÃO DE DESENHO ATUALIZADA
// --------------------------------------------------

function desenhar(pontos, r, g, b, matrizTransformacao) {
    gl.bufferData(gl.ARRAY_BUFFER, pontos, gl.STATIC_DRAW);
    gl.uniform4f(colorLocation, r, g, b, 1.0);
    
    gl.uniformMatrix3fv(transformLocation, false, matrizTransformacao);
    
    gl.drawArrays(gl.TRIANGLES, 0, pontos.length / 2);
}

function criarCirculo(xCentro, yCentro, raio) {
    let pontos = [];
    let fatias = 30; 
    for (let i = 0; i < fatias; i++) {
        let angulo1 = (i * 2 * Math.PI) / fatias;
        let angulo2 = ((i + 1) * 2 * Math.PI) / fatias;
        pontos.push(xCentro, yCentro); 
        pontos.push(xCentro + Math.cos(angulo1) * raio, yCentro + Math.sin(angulo1) * raio); 
        pontos.push(xCentro + Math.cos(angulo2) * raio, yCentro + Math.sin(angulo2) * raio); 
    }
    return new Float32Array(pontos);
}

// --------------------------------------------------
// VÉRTICES DO ROBÔ ORIGINAL (tarefa1)
// --------------------------------------------------

const corpoRobo = new Float32Array([
    -0.3,  0.2,   -0.3, -0.3,    0.3, -0.3,
    -0.3,  0.2,    0.3, -0.3,    0.3,  0.2 
]);

const cabecaRobo = new Float32Array([
    -0.2,  0.6,   -0.2,  0.25,   0.2,  0.25,
    -0.2,  0.6,    0.2,  0.25,   0.2,  0.6,
]);

const bocaRobo = new Float32Array([
    -0.1, 0.35,   -0.1, 0.30,    0.1, 0.30, 
    -0.1, 0.35,    0.1, 0.30,    0.1, 0.35, 
]);

const bracoEsq = new Float32Array([
    -0.45,  0.15, -0.45, -0.2,  -0.35, -0.2,
    -0.45,  0.15, -0.35, -0.2,  -0.35,  0.15
]);

const bracoDir = new Float32Array([
     0.35,  0.15,  0.35, -0.2,   0.45, -0.2,
     0.35,  0.15,  0.45, -0.2,   0.45,  0.15
]);

const pernaEsq = new Float32Array([
    -0.2,  -0.3,  -0.2,  -0.7,  -0.05, -0.7,
    -0.2,  -0.3,  -0.05, -0.7,  -0.05, -0.3
]);

const pernaDir = new Float32Array([
     0.05, -0.3,   0.05, -0.7,   0.2,  -0.7,
     0.05, -0.3,   0.2,  -0.7,   0.2,  -0.3
]);

const olhoEsq = criarCirculo(-0.08, 0.45, 0.04);
const olhoDir = criarCirculo(0.08, 0.45, 0.04);

// --------------------------------------------------
// LÓGICA DE ANIMAÇÃO COM PIVÔS
// --------------------------------------------------

function matrizDoMembro(txGlobal, pivotX, pivotY, angulo) {
    let m = m3.translation(txGlobal, 0.0);
    m = m3.multiply(m, m3.translation(pivotX, pivotY));
    m = m3.multiply(m, m3.rotation(angulo));
    m = m3.multiply(m, m3.translation(-pivotX, -pivotY));
    return m;
}

let tx = 0.0;
let velocidade = 0.005;
let tempo = 0.0;

function animarCena() {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    tx += velocidade;
    if (tx > 0.6 || tx < -0.6) {
        velocidade = -velocidade;
    }
    
    tempo += 0.1;
    let anguloBalanco = Math.sin(tempo) * 0.5;

    let matrizGlobal = m3.translation(tx, 0.0);

    desenhar(corpoRobo, 0.5, 0.5, 0.5, matrizGlobal);
    desenhar(cabecaRobo, 0.7, 0.7, 0.7, matrizGlobal);
    desenhar(bocaRobo, 0.4, 0.4, 0.4, matrizGlobal);
    desenhar(olhoEsq, 1.0, 0.0, 0.0, matrizGlobal);
    desenhar(olhoDir, 1.0, 0.0, 0.0, matrizGlobal);

    let mBracoEsq = matrizDoMembro(tx, -0.4, 0.15, anguloBalanco);
    desenhar(bracoEsq, 0.4, 0.4, 0.4, mBracoEsq);

    let mBracoDir = matrizDoMembro(tx, 0.4, 0.15, -anguloBalanco);
    desenhar(bracoDir, 0.4, 0.4, 0.4, mBracoDir);

    let mPernaEsq = matrizDoMembro(tx, -0.125, -0.3, -anguloBalanco);
    desenhar(pernaEsq, 0.3, 0.3, 0.3, mPernaEsq);

    let mPernaDir = matrizDoMembro(tx, 0.125, -0.3, anguloBalanco);
    desenhar(pernaDir, 0.3, 0.3, 0.3, mPernaDir);

    requestAnimationFrame(animarCena);
}

animarCena();