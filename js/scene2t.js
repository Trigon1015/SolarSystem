
rooms.scene2t = function() {

lib3D2();

description = `<b>Solar System</b>
               <p>
               
               <br>
               
	       <p> <input type=range id=arm_length value=28> arm length
	       <br><input type=range id=leg_length value=40> leg length
	       <br><input type=range id=rate> rate
	       `;

code = {
'init':`























   S.material = [
      [.1,.1,.1,0,     .9,.9,.9,0,  0,0,0,5,    0,0,0,0], // PAPER
      [.1,.1,.1,0,     .2,.2,.2,0,  1,1,1,5,    0,0,0,0], // SILVER
      [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], // RED PLASTIC
      [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], // COPPER
      [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], // GOLD
      [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // LEAD
   ];
   S.nM = S.material.length;

   // TWO TRIANGLES THAT ARE NOT A TRIANGLE STRIP

   S.twoTrianglesMesh = [
      0,0,0,   0,0,1,  0,0,
      1,0,0,   0,0,1,  1,0,
      0,1,0,   0,0,1,  0,1,

      0,0,0,   0,1,0,  0,0,
      0,0,1,   0,1,0,  1,0,
      1,0,0,   0,1,0,  0,1,
   ];

   S.twoTrianglesMesh.isTriangles = true;

   // A SQUARE IS A TRIANGLE MESH WITH JUST TWO TRIANGLES

   S.squareMesh = [ -1, 1, 0,  0,0,1,  0,1,
                     1, 1, 0,  0,0,1,  1,1,
		    -1,-1, 0,  0,0,1,  0,0,
		     1,-1, 0,  0,0,1,  1,0 ];

   // GLUE TOGETHER TWO MESHES TO CREATE A SINGLE MESH

   let glueMeshes = (a,b) => {
      let mesh = a.slice();
      mesh.push(a.slice(a.length - S.VERTEX_SIZE, a.length));
      mesh.push(b.slice(0, S.VERTEX_SIZE));
      mesh.push(b);
      return mesh.flat();
   }

   // GIVEN A FUNCTION THAT MAPS (u,v) TO point AND normal,
   // AND GIVEN A MESH RESOLUTION, CREATE A PARAMETRIC MESH

   let uvMesh = (f,nu,nv,data) => {
      let mesh = [];
      for (let iv = 0 ; iv < nv ; iv++) {
         let v = iv / nv;
	 let strip = [];
         for (let iu = 0 ; iu <= nu ; iu++) {
	    let u = iu / nu;
	    strip = strip.concat(f(u,v,data));
	    strip = strip.concat(f(u,v+1/nv,data));
	 }
	 mesh = glueMeshes(mesh, strip);
      }
      return mesh;
   }

   S.uvMesh = uvMesh;

   // CREATE A UNIT SPHERE PARAMETRIC MESH

   S.sphereMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * cv, su * cv, sv,
              cu * cv, su * cv, sv,
	      u, v];
   }, 20, 10);

   // CREATE A UNIT TORUS PARAMETRIC MESH

   S.torusMesh = uvMesh((u,v,r) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * (1 + r * cv), su * (1 + r * cv), r * sv,
              cu * cv, su * cv, sv,
	      u, v];
   }, 20, 10, .4);

   // CREATE A UNIT DISK PARAMETRIC MESH

   S.diskMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      return [v * cu, v * su, 0,  0, 0, 1,   u, v];
   }, 20, 2);

   // CREATE A UNIT OPEN TUBE PARAMETRIC MESH

   S.tubeMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      return [cu, su, 2 * v - 1,   cu, su, 0,   u, v];
   }, 20, 2);

   // TRANSFORM A MESH BY A MATRIX ON THE CPU

   let transformMesh = (mesh, matrix) => {
      let result = [];
      let IMT = matrixTranspose(matrixInverse(matrix));
      for (let n = 0 ; n < mesh.length ; n += S.VERTEX_SIZE) {
         let V = mesh.slice(n, n + S.VERTEX_SIZE);
	 let P  = V.slice(0, 3);
	 let N  = V.slice(3, 6);
	 let UV = V.slice(6, 8);
	 P = matrixTransform(matrix, [P[0], P[1], P[2], 1]);
	 N = matrixTransform(IMT,    [N[0], N[1], N[2], 0]);
         result.push(P[0],P[1],P[2], N[0],N[1],N[2], UV);
      }
      return result.flat();
   }

   // A CYLINDER MESH IS A TUBE WITH TWO DISK END-CAPS GLUED TOGETHER

   let end0 = transformMesh(S.diskMesh, matrixTranslate([0,0,1]));
   let end1 = transformMesh(end0      , matrixRotx(Math.PI));
   S.cylinderMesh = glueMeshes(S.tubeMesh, glueMeshes(end0, end1));

   // A CUBE MESH IS SIX TRANSFORMED SQUARE MESHES GLUED TOGETHER

   let face0 = transformMesh(S.squareMesh, matrixTranslate([0,0,1]));
   let face1 = transformMesh(face0,        matrixRotx( Math.PI/2));
   let face2 = transformMesh(face0,        matrixRotx( Math.PI  ));
   let face3 = transformMesh(face0,        matrixRotx(-Math.PI/2));
   let face4 = transformMesh(face0,        matrixRoty(-Math.PI/2));
   let face5 = transformMesh(face0,        matrixRoty( Math.PI/2));
   S.cubeMesh = glueMeshes(face0,
                glueMeshes(face1,
                glueMeshes(face2,
                glueMeshes(face3,
                glueMeshes(face4,
		           face5)))));

   // DRAW A SINGLE MESH. WE STILL NEED TO ADD MATERIAL PROPERTIES!

   S.textures = {};

   S.drawMesh = (mesh, matrix, materialIndex, textureSrc) => {
      let gl = S.gl;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.setUniform('Matrix4fv', 'uMaterial', false, S.material[materialIndex]);

      S.setUniform('1i', 'uSampler', 0);
      S.setUniform('1f', 'uTexture', textureSrc ? 1 : 0);

      if (textureSrc) {
         if (! S.textures[textureSrc]) { // NEED TO LOAD THE TEXTURE FROM THE SERVER.
            let image = new Image();
            image.onload = function() {
               S.textures[this.textureSrc] = gl.createTexture();
               gl.bindTexture     (gl.TEXTURE_2D, S.textures[this.textureSrc]);
               gl.texImage2D      (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
               gl.texParameteri   (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
               gl.texParameteri   (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
               gl.generateMipmap  (gl.TEXTURE_2D);
            }
            image.textureSrc = textureSrc;
            image.src = textureSrc;
         }
         else {                          // TEXTURE HAS LOADED. OK TO RENDER.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, S.textures[textureSrc]);
         }
      }

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      gl.drawArrays(mesh.isTriangles ? S.gl.TRIANGLES
                                     : S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
   }

`,
fragment: `
S.setFragmentShader(\`
   const int nL = \` + S.nL + \`;
   const int nM = \` + S.nM + \`;
   uniform vec3 uBgColor;
   uniform vec3 uLd[nL];
   uniform vec3 uLc[nL];
   uniform mat4 uMaterial;

   uniform sampler2D uSampler; // INDEX OF THE TEXTURE TO BE SAMPLED
   uniform float uTexture;     // ARE WE RENDERING TEXTURE FOR THIS OBJECT?

   varying vec3 vPos, vNor;
   varying vec2 vUV;

   void main() {
      vec3 N = normalize(vNor);
      vec3  ambient  = uMaterial[0].rgb;
      vec3  diffuse  = uMaterial[1].rgb;
      vec3  specular = uMaterial[2].rgb;
      float p        = uMaterial[2].a;
      vec3 c = mix(ambient, uBgColor, .3);
      for (int l = 0 ; l < nL ; l++) {
         vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
         c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l]))
                      + specular * pow(max(0., R.z), p));
      }

      vec4 texture = texture2D(uSampler, vUV);
      c *= mix(vec3(1.), texture.rgb, texture.a * uTexture);

      gl_FragColor = vec4(c, 1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`
   attribute vec3 aPos, aNor;
   attribute vec2 aUV;
   uniform   mat4 uMatrix, uInvMatrix, uProject;
   varying   vec3 vPos, vNor;
   varying   vec2 vUV;

   void main() {
      vPos = (uProject * uMatrix * vec4(aPos, 1.)).xyz;
      vNor = (vec4(aNor, 0.) * uInvMatrix).xyz;
      vUV = aUV;
      gl_Position = vec4(vPos.xy, -.01 * vPos.z, 1.);
   }
\`)
`,
render: `

   S.torusMesh = S.uvMesh((u,v,r) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * (1 + r * cv), su * (1 + r * cv), r * sv,
              cu * cv, su * cv, sv,
	      u, v];
   }, 20, 10, .5);

   // SET THE PROJECTION MATRIX BASED ON CAMERA FOCAL LENGTH

   let fl = 5.0;
   S.setUniform('Matrix4fv', 'uProject', false,
      [1,0,0,0, 0,1,0,0, 0,0,1,-1/fl, 0,0,0,1]);

   let m = new Matrix();

   // GET VALUES FROM THE HTML SLIDERS

   let T = 2 * time * rate.value / 100;
   let AL = .1 + .9 * arm_length.value / 100;
   let LL = .1 + .9 * leg_length.value / 100;

   // SPECIFY SCENE LIGHTING

   S.nL = 2;
   S.setUniform('3fv', 'uLd', [ .57,.57,.57, -.57,-.57,-.57 ]);
   S.setUniform('3fv', 'uLc', [ 1,1,1, .5,.3,.1 ]);
   S.setUniform('3fv', 'uBgColor', [ .89,.81,.75 ]);

   // RENDER THE SCENE
   //sun
   m.identity();
   m.translate([0,0,0]);
   m.rotx(-1.5);
   m.rotz(-0.5*time);
   m.scale([0.7,0.7,0.7]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/sun.jpg');
   

   //Mercury
   m.identity();
   m.translate([Math.sin(0.5*time)*0.72,0,Math.cos(0.5*time)*0.72]);
   m.rotz(0.3 * time);
   m.scale([0.02,0.02,0.02]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/moon.jpg');
        
   //Venus 
   m.identity();
   m.translate([Math.sin(0.5*time-1)*0.85,0,Math.cos(0.5*time-1)*0.85]);
   m.rotz(0.3 * time);
   m.scale([0.065,0.065,0.065]);
   S.drawMesh(S.sphereMesh, m.get(),4);
   
   //Earth
   m.identity();
   m.translate([Math.sin(0.5*time-2)*0.97,0,Math.cos(0.5*time-2)*0.97]);
   m.rotz(0.3 * time);
   m.scale([0.069,0.069,0.069]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/Earth.jpg');

   //Mars
   m.identity();
   m.translate([Math.sin(0.5*time-3)*1.1,0,Math.cos(0.5*time-3)*1.1]);
   m.rotz(0.3 * time);
   m.scale([0.032,0.032,0.032]);
   S.drawMesh(S.sphereMesh, m.get(),2);

   //Jupiter
   m.identity();
   m.translate([Math.sin(0.5*time-3.5)*1.25,0,Math.cos(0.5*time-3.5)*1.25]);
   m.rotx(-1.5);
   m.rotz(-0.5*time);;
   m.scale([0.176,0.176,0.176]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/Jupiter.jpg');
   
   //saturn
   m.identity();
   m.translate([Math.sin(0.5*time-2.5)*1.5,0,Math.cos(0.5*time-2.5)*1.5]);
   m.rotx(-1.6);
   m.rotz(-time);
   m.scale([0.164,0.164,0.164]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/rock.jpg');

   m.identity();
   m.translate([Math.sin(0.5*time-2.5)*1.5,0,Math.cos(0.5*time-2.5)*1.5]);
   m.scale([0.3,0.3,0.3]);
   m.rotx(-1.8);
   m.roty(0.5);
   m.rotz(0.5* time);
   S.drawMesh(S.diskMesh, m.get(), 0, 'imgs/ring.jpg');
   
   //Uranus
   m.identity();
   m.translate([Math.sin(0.5*time-1.7)*1.7,0,Math.cos(0.5*time-1.7)*1.7]);
   m.rotx(-1.6);
   m.rotz(-time);
   m.scale([0.121,0.121,0.121]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/Uranus.jpg');

   //Neptune
   m.identity();
   m.translate([Math.sin(0.5*time-4)*1.7,0,Math.cos(0.5*time-4)*1.7]);
   m.rotx(-1.6);
   m.rotz(-time);
   m.scale([0.121,0.121,0.121]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/Neptune.jpg');
`,
events: `
   ;
`
};

}

