class Scene {
    constructor(gl, program) {
        this.renderer = new Renderer(gl, program);

        // Objetos da cena
        this.helicopterBody = new HelicopterBody();
        this.helicopterTopShaft = new HelicopterTopShaft();
        this.helicopterTail = new HelicopterTail();
        this.helicopterPropellers = new HelicopterPropellers();
        this.helicopterTailPropeller = new HelicopterTailPropeller();

        // Variáveis de posição (controladas pelo teclado)
        this.tx = 0.0;
        this.ty = 0.0;
        
        // Ângulo de giro contínuo das hélices
        this.anguloHelices = 0.0;

        // Captura das teclas do teclado (setinhas ou WASD)
        document.addEventListener('keydown', (event) => {
            const velocidadeVoo = 0.05;
            
            if (event.key === 'ArrowUp' || event.key === 'w') {
                this.ty += velocidadeVoo;
            }
            if (event.key === 'ArrowDown' || event.key === 's') {
                this.ty -= velocidadeVoo;
            }
            if (event.key === 'ArrowLeft' || event.key === 'a') {
                this.tx -= velocidadeVoo;
            }
            if (event.key === 'ArrowRight' || event.key === 'd') {
                this.tx += velocidadeVoo;
            }
        });
    }

    update() {
        // 1. Faz o ângulo das hélices aumentar sem parar
        this.anguloHelices += 0.2; 

        // 2. Calcula a matriz global do helicóptero (posição atual)
        let matrizGlobal = m4.translation(this.tx, this.ty, 0.0);

        // Dica de CG: Gira o helicóptero um pouquinho de lado e para baixo 
        // só para a gente conseguir ver que ele é 3D. 
        matrizGlobal = m4.multiply(matrizGlobal, m4.xRotation(0.3));
        matrizGlobal = m4.multiply(matrizGlobal, m4.yRotation(-0.4));

        // 3. Atualiza as partes "duras" do helicóptero (elas não giram, só andam)
        this.helicopterBody.update(matrizGlobal);
        this.helicopterTopShaft.update(matrizGlobal);
        this.helicopterTail.update(matrizGlobal);

        // 4. Hélice Principal (Gira como um peão no eixo Y)
        // Multiplica a matriz global por uma rotação em Y
        let matrizHelicePrincipal = m4.multiply(matrizGlobal, m4.yRotation(this.anguloHelices));
        this.helicopterPropellers.update(matrizHelicePrincipal);

        // 5. Hélice da Cauda (Gira como um ventilador no eixo X)
        // Gira 2 vezes mais rápido que a principal para dar um efeito legal
        let matrizHeliceCauda = m4.multiply(matrizGlobal, m4.xRotation(this.anguloHelices * 2.0));
        this.helicopterTailPropeller.update(matrizHeliceCauda);
    }

    draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

        this.helicopterBody.draw(this.renderer);
        this.helicopterTopShaft.draw(this.renderer);
        this.helicopterTail.draw(this.renderer);
        this.helicopterPropellers.draw(this.renderer);
        this.helicopterTailPropeller.draw(this.renderer);
    }

    execute() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.execute());
    }

    init() {
        requestAnimationFrame(() => this.execute());
    }
}