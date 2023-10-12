
rooms.scene1 = function() {

lib3D2();

description = `<b>Scene 1</b>
               <p>
               3D scene created
               <br>
               with triangle meshes.`;

code = {
'init':`
   S.triangleMesh = [ -1, 1, 0,  0,0,1,  0,1,
                     1, 1, 0,  0,0,1,  1,1,
		    -1,-1, 0,  0,0,1,  0,0];


   S.squareMesh = [ -1, 1, 0,  0,0,1,  0,1,
                     1, 1, 0,  0,0,1,  1,1,
		    -1,-1, 0,  0,0,1,  0,0,
		     1,-1, 0,  0,0,1,  1,0 ];

   let glueMeshes = (a,b) => {
       let mesh = a.slice();
       mesh = mesh.concat(a.slice(a.length - S.VERTEX_SIZE, a.length));
       mesh = mesh.concat(b.slice(0, S.VERTEX_SIZE));
       mesh = mesh.concat(b);
       return mesh;
/*
       let mesh = a.slice();
       mesh.push(a.slice(a.length - S.VERTEX_SIZE, a.length));
       mesh.push(b.slice(0, S.VERTEX_SIZE));
       mesh.push(b);
       return mesh.flat();
*/
   }

   let uvMesh = (f,nu,nv) => {
      let mesh = [];
      for (let iv = 0 ; iv < nv ; iv++) {
         let v = iv / nv;
	 let strip = [];
         for (let iu = 0 ; iu <= nu ; iu++) {
	    let u = iu / nu;
	    strip = strip.concat(f(u,v));
	    strip = strip.concat(f(u,v+1/nv));
	 }
	 mesh = glueMeshes(mesh, strip);
      }
      return mesh;
   }

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
   }, 30, 10);

   S.cylinderMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      let x = cu;
      let y = su;
      let z = 2 * v - 1;
      return [x, y, z,
              x, y, 0,
	      u, v];
   }, 30, 10);

   S.disk1Mesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      
      let x = v * Math.cos(theta);
      let y = v * Math.sin(theta);
      let z = 0;
      return [x, y, z,
              0, 0, 1,
	      u, v];
   }, 30, 10);

   S.disk2Mesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      
      let x = 2* v * Math.cos(theta);
      let y = 2* v * Math.sin(theta);
      let z = -1;
      return [x, y, z,
              1, 0, -1,
	      u, v];
   }, 30, 10);

   S.coneMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      let z = (2 * v - 1) * 2;
      let x = (1 - 0.5 * z) * cu ;
      let y = (1 - 0.5 * z) * su ;
      
      return [x, y, z,
              2*cu, 2*su, 1,
	      u, v];
   }, 30, 10);

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
         result = result.concat([P[0],P[1],P[2],
	                         N[0],N[1],N[2],
				 UV[0],UV[1]]);
      }
      return result;
   }

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

   
   let faceDisk = transformMesh(S.disk1Mesh, matrixTranslate([0, 0, 1]));
   let faceDisk2 = transformMesh(S.disk2Mesh, matrixTranslate([0, 0, -1]));
   S.cylinderDiskMesh = glueMeshes(faceDisk, glueMeshes(S.cylinderMesh, faceDisk2));
   S.coneMesh = glueMeshes(faceDisk2, S.coneMesh);
   

   // glue the cone with disk

   S.drawMesh = (mesh, matrix) => {
      let gl = S.gl;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
      //S.gl.drawArrays(S.gl.TRIANGLES, 0, mesh.length / S.VERTEX_SIZE);
   }

`,
fragment: `
S.setFragmentShader(\`
   varying vec3 vPos, vNor;
   void main() {
      float c = .2 + .8 * max(0.,dot(vNor,vec3(.57)));
      gl_FragColor = vec4(c,c,c,1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`

   attribute vec3 aPos, aNor;
   varying   vec3 vPos, vNor;
   uniform   mat4 uMatrix, uInvMatrix, uProject;

   void main() {
      vec4 pos = uProject * uMatrix * vec4(aPos, 1.);
      vec4 nor = vec4(aNor, 0.) * uInvMatrix;
      vPos = pos.xyz;
      vNor = normalize(nor.xyz);
      gl_Position = pos * vec4(1.,1.,-.01,1.);
   }

\`)
`,
render: `
   S.setUniform('Matrix4fv', 'uProject', false,
      [1,0,0,0, 0,1,0,0, 0,0,1,-.2, 0,0,0,1]);

   let m = new Matrix();

// sphere

   m.identity();
   m.translate([0,0,0]);
   m.rotz(-time);
   m.scale([.2,.2,.2]);
   S.drawMesh(S.sphereMesh, m.get(),0, 'imgs/brick.png');
  
/*
// cylinder
   m.identity();
   m.translate([.2*Math.cos(2 * time),
                0*Math.sin(2 * time),0]);
   m.rotz(-time);
   m.rotx(0);
   m.roty(time);
   m.scale([.2,.2,.2]);
   S.drawMesh(S.cylinderDiskMesh, m.get());

// cone
   m.identity();
   m.translate([.4*Math.cos(2 * time),
                0*Math.sin(2 * time),0]);
   m.rotz(-time);
   m.rotx(0);
   m.roty(time);
   m.scale([.2,.2,.2]);
   S.drawMesh(S.coneMesh, m.get());
  
*/

// cube
/*
   m.identity();
   m.translate([0,1 * Math.sin(0.5 * time), 0]);
   m.rotx(time);
   m.roty(time);
   m.scale([.2,.2,.2]);
   S.drawMesh(S.cubeMesh, m.get());
*/

// // square
//    m.identity();
//    m.translate([0,1 * Math.sin(0.5 * time), 0]);
//    m.rotx(time);
//    m.roty(time);
//    m.scale([.2,.2,.2]);
//    S.drawMesh(S.triangleMesh, m.get());
`,
events: `
   ;
`
};

}
