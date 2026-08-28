const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

const vertices = new Float32Array([
     0.0,  0.6, //top
    -0.8, -0.8, //esq
     0.8, -0.8 //dir
]);


const buffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
    outColor = uColor; // O shader agora pinta usando a cor que chegar na variável
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

const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);
const colorLocation = gl.getUniformLocation(program, "uColor");


function desenhar(pontos, r, g, b) {
  
    gl.bufferData(gl.ARRAY_BUFFER, pontos, gl.STATIC_DRAW);
    
    gl.uniform4f(colorLocation, r, g, b, 1.0);
    
    gl.drawArrays(gl.TRIANGLES, 0, pontos.length / 2);
}


function criarCirculo(xCentro, yCentro, raio) {
    let pontos = [];
    let fatias = 30; 
    
    for (let i = 0; i < fatias; i++) {
        let angulo1 = (i * 2 * Math.PI) / fatias;
        let angulo2 = ((i + 1) * 2 * Math.PI) / fatias;

        pontos.push(xCentro, yCentro); 
        pontos.push(xCentro + Math.cos(angulo1) * raio, yCentro + Math.sin(angulo1) * raio); // Ponto 2: Borda
        pontos.push(xCentro + Math.cos(angulo2) * raio, yCentro + Math.sin(angulo2) * raio); // Ponto 3: Borda seguinte
    }
    
    return new Float32Array(pontos);
}

//Robô

const corpoRobo = new Float32Array([
    -0.3,  0.2,   // Canto superior esquerdo
    -0.3, -0.3,   // Canto inferior esquerdo
     0.3, -0.3,   // Canto inferior direito

    -0.3,  0.2,   // Canto superior esquerdo
     0.3, -0.3,   // Canto inferior direito
     0.3,  0.2    // Canto superior direito
]);
desenhar(corpoRobo, 0.5, 0.5, 0.5);

const cabecaRobo = new Float32Array([
    -0.2,  0.6,
    -0.2,  0.25,
     0.2,  0.25,

    -0.2,  0.6, //mesmo ponto do top de t1
     0.2,  0.25,//mesmo ponto do dir
     0.2,  0.6,//linha do top de t1 mas lado trocado (x)
]);
desenhar(cabecaRobo, 0.7, 0.7, 0.7);

const bocaRobo = new Float32Array([
    -0.1, 0.35, //top
    -0.1, 0.30, //esq
     0.1,0.30, //dir
     
     -0.1, 0.35,
     0.1, 0.30, 
     0.1,0.35, 
]);

desenhar(bocaRobo, 0.4, 0.4, 0.4);

const bracoEsq = new Float32Array([
    -0.45,  0.15,
    -0.45, -0.2,
    -0.35, -0.2,

    -0.45,  0.15,
    -0.35, -0.2,
    -0.35,  0.15
]);
desenhar(bracoEsq, 0.4, 0.4, 0.4);

const bracoDir = new Float32Array([
     0.35,  0.15,
     0.35, -0.2,
     0.45, -0.2,

     0.35,  0.15,
     0.45, -0.2,
     0.45,  0.15
]);
desenhar(bracoDir, 0.4, 0.4, 0.4);

const pernaEsq = new Float32Array([
    -0.2,  -0.3,
    -0.2,  -0.7,
    -0.05, -0.7,

    -0.2,  -0.3,
    -0.05, -0.7,
    -0.05, -0.3
]);
desenhar(pernaEsq, 0.3, 0.3, 0.3); 

const pernaDir = new Float32Array([
     0.05, -0.3,
     0.05, -0.7,
     0.2,  -0.7,

     0.05, -0.3,
     0.2,  -0.7,
     0.2,  -0.3
]);
desenhar(pernaDir, 0.3, 0.3, 0.3);

const olhoEsq = criarCirculo(-0.08, 0.45, 0.04);
desenhar(olhoEsq, 1.0, 0.0, 0.0); 

const olhoDir = criarCirculo(0.08, 0.45, 0.04);
desenhar(olhoDir, 1.0, 0.0, 0.0);
