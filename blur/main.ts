const vertices: Float32Array = new Float32Array([
	-1.0, 1.0, 0.0, 1.0,
	1.0, -1.0, 0.0, 1.0,
	1.0, 1.0, 0.0, 1.0,
	-1.0, 1.0, 0.0, 1.0,
	-1.0, -1.0, 0.0, 1.0,
	1.0, -1.0, 0.0, 1.0
]);

const tex_coord: Float32Array = new Float32Array([
	0.0, 1.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
	0.0, 0.0,
	0.0, 1.0
]);

const colors: Float32Array = new Float32Array([
	1.0, 0.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	1.0, 0.0, 0.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	0.0, 1.0, 0.0, 1.0
]);

const vs: string = `#version 300 es

in vec4 p;
in vec2 uv;
in vec4 color;
out vec2 tex_coord;
out vec4 color_fs;

void main(void) {
	gl_Position = p;
	tex_coord = uv;
	color_fs = color;
}
`;

const fs: string = `#version 300 es

precision mediump float;

in vec2 tex_coord;
in vec4 color_fs;
uniform sampler2D tex_samp;
out vec4 tex;

void main(void) {
	tex = texture(tex_samp, tex_coord);
	// tex = color_fs;
}
`;

window.onload = () => {
	const cvs: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("cvs");
	const gl: WebGL2RenderingContext | null = cvs.getContext("webgl2");
	if (gl == null) {
		return;
	}

	// 画像をロードし、テクスチャをGPUに転送する
	const img: HTMLImageElement = new Image();
	img.crossOrigin = "anonymous";
	let tex: WebGLTexture | null;
	img.onload = () => {
		gl.activeTexture(gl.TEXTURE0);
		tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	};
	img.src = "lenna.png"
	
	// シェーダをコンパイルする
	const vs_c: WebGLShader = compile_shader(gl, gl.VERTEX_SHADER, vs);
	const fs_c: WebGLShader = compile_shader(gl, gl.FRAGMENT_SHADER, fs);

	// シェーダをリンク・使用する
	const program: WebGLProgram = link_shader(gl, vs_c, fs_c, null);
	gl.useProgram(program);

	// in変数と頂点配列を関連付ける
	const vertices_buffer: WebGLBuffer | null = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	const l1: number = gl.getAttribLocation(program, "p");
	gl.enableVertexAttribArray(l1);
	gl.vertexAttribPointer(l1, 4, gl.FLOAT, false, 0, 0);

	const coord_buffer: WebGLBuffer | null = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coord_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, tex_coord, gl.STATIC_DRAW);
	const l2: number = gl.getAttribLocation(program, "uv");
	gl.enableVertexAttribArray(l2);
	gl.vertexAttribPointer(l2, 2, gl.FLOAT, false, 0, 0);

	const color_buffer: WebGLBuffer | null = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	const l3: number = gl.getAttribLocation(program, "color");
	gl.enableVertexAttribArray(l3);
	gl.vertexAttribPointer(l3, 4, gl.FLOAT, false, 0, 0);

	// uniform変数とテクスチャを関連付ける
	gl.uniform1i(gl.getUniformLocation(program, "tex_samp"), 0);

	// 描画命令
	gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4);
};

function compile_shader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	let s: WebGLShader | null = gl.createShader(type);
	if (s == null) {
		throw new Error();
	}

	gl.shaderSource(s, source);
	gl.compileShader(s);
	console.log(gl.getShaderInfoLog(s));

	return s;
}

function link_shader(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader, tf_list: string[] | null): WebGLProgram {
	let p: WebGLProgram | null = gl.createProgram();
	if (p == null) {
		throw new Error();
	}

	gl.attachShader(p, vs);
	gl.attachShader(p, fs);

	if (tf_list != null) {
		gl.transformFeedbackVaryings(p, tf_list, gl.SEPARATE_ATTRIBS);
	}

	gl.linkProgram(p);

	return p;
}
