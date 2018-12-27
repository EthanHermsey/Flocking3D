
class Engine{

    constructor(dim){
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( dim / - 2, dim / 2, dim / 2, dim / - 2, 1, 1000 );
        this.camera.position.set(0,0,100);

        
        this.ARR_TO_TEX = this.newShaderMaterial(engineShader, arrToTexShader);

        this.CALCULATE_ACCELERATIONS = this.newShaderMaterial(engineShader, accelerationShader.replace(/#DIM#/g, dim + ".0"));
        this.CALCULATE_VELOCITIES = this.newShaderMaterial(engineShader, velocityShader);
        this.CALCULATE_POSITIONS = this.newShaderMaterial(engineShader, positionShader);

        var bufferGeo = new THREE.PlaneBufferGeometry(dim, dim);
        this.bufferObject = new THREE.Mesh(bufferGeo, this.ARR_TO_TEX);
        this.scene.add(this.bufferObject);

        this.dim = dim;
        this.renderSizeSet = false;
    }

    arrayToTexture(data){
    
    let bufferTexture = this.newRenderTarget();
    let dataTex = this.arrayToDataTexture( data );
        
    this.render(this.ARR_TO_TEX, bufferTexture, dataTex);
    
    return bufferTexture;   

    }

    arrayToDataTexture(data){
        var dataTex = new THREE.DataTexture(data, this.dim, this.dim, THREE.RGBFormat, THREE.FloatType);
        dataTex.needsUpdate = true;
        return dataTex;
    }

    newRenderTarget(){
        return new THREE.WebGLRenderTarget(this.dim, this.dim, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat, type: THREE.FloatType});
    }

    newShaderMaterial(vertex, fragment){
        return new THREE.ShaderMaterial({
            uniforms: {
                source: {value: ''},
                radius: {value: objRadius},
                delta: {value: delta},
                perceptionRadius: {value: ''},
                maxSpeed: {value: maxNodeSpeed},
                maxForce: {value: ''},
                alignStrength: {value: ''},
                separateStrength: {value: ''},
                cohereStrength: {value: ''}
            },
            vertexShader: vertex,
            fragmentShader: fragment
        });
    }

    render(material, target, source){

        this.bufferObject.material = material;
        this.bufferObject.material.uniforms.source.value = source;
        if (material != this.ARR_TO_TEX){
            this.bufferObject.material.uniforms.delta.value = delta;
            this.bufferObject.material.uniforms.perceptionRadius.value = perceptionSlider.value();
            this.bufferObject.material.uniforms.maxForce.value = steeringStrengthSlider.value();
            this.bufferObject.material.uniforms.alignStrength.value = alignStrengthSlider.value();
            this.bufferObject.material.uniforms.separateStrength.value = separationStrengthSlider.value();
            this.bufferObject.material.uniforms.cohereStrength.value = cohesionStrengthSlider.value();
        }
        this.bufferObject.material.needsUpdate = true;

        renderer.render(this.scene, this.camera, target);
    }
}