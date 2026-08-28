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



const caule = new Float32Array([
    -0.05,  0.0,   
    -0.05, -0.8,   
     0.05, -0.8,  

    -0.05,  0.0,   
     0.05, -0.8,   
     0.05,  0.0    
]);
desenhar(caule, 0.0, 0.8, 0.0); 

const petalaCima = criarCirculo(0.0, 0.25, 0.15);
desenhar(petalaCima, 1.0, 0.0, 1.0); 

const petalaBaixo = criarCirculo(0.0, -0.25, 0.15);
desenhar(petalaBaixo, 1.0, 0.0, 1.0);

const petalaDir = criarCirculo(0.25, 0.0, 0.15);
desenhar(petalaDir, 1.0, 0.0, 1.0);

const petalaEsq = criarCirculo(-0.25, 0.0, 0.15);
desenhar(petalaEsq, 1.0, 0.0, 1.0);

const miolo = criarCirculo(0.0, 0.0, 0.15);
desenhar(miolo, 1.0, 1.0, 0.0); 

