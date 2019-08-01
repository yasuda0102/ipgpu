"use strict";
var vertices = new Float32Array([
    -1.0, 1.0, 0.0, 1.0,
    1.0, -1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    -1.0, 1.0, 0.0, 1.0,
    -1.0, -1.0, 0.0, 1.0,
    1.0, -1.0, 0.0, 1.0
]);
var tex_coord = new Float32Array([
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    0.0, 1.0
]);
var colors = new Float32Array([
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 1.0
]);
var vs = "#version 300 es\n\nin vec4 p;\nin vec2 uv;\nin vec4 color;\nout vec2 tex_coord;\nout vec4 color_fs;\n\nvoid main(void) {\n\tgl_Position = p;\n\ttex_coord = uv;\n\tcolor_fs = color;\n}\n";
var fs = "#version 300 es\n\nprecision mediump float;\n\nin vec2 tex_coord;\nin vec4 color_fs;\nuniform sampler2D tex_samp;\nout vec4 tex;\n\nvoid main(void) {\n\ttex = texture(tex_samp, tex_coord);\n\t// tex = color_fs;\n}\n";
window.onload = function () {
    var cvs = document.getElementById("cvs");
    var gl = cvs.getContext("webgl2");
    if (gl == null) {
        return;
    }
    // 画像をロードし、テクスチャをGPUに転送する
    var img = new Image();
    img.crossOrigin = "anonymous";
    var tex;
    img.onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    };
    img.src = "https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png";
    // シェーダをコンパイルする
    var vs_c = compile_shader(gl, gl.VERTEX_SHADER, vs);
    var fs_c = compile_shader(gl, gl.FRAGMENT_SHADER, fs);
    // シェーダをリンク・使用する
    var program = link_shader(gl, vs_c, fs_c, null);
    gl.useProgram(program);
    // in変数と頂点配列を関連付ける
    var vertices_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var l1 = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(l1);
    gl.vertexAttribPointer(l1, 4, gl.FLOAT, false, 0, 0);
    var coord_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coord_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, tex_coord, gl.STATIC_DRAW);
    var l2 = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(l2);
    gl.vertexAttribPointer(l2, 2, gl.FLOAT, false, 0, 0);
    var color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    var l3 = gl.getAttribLocation(program, "color");
    gl.enableVertexAttribArray(l3);
    gl.vertexAttribPointer(l3, 4, gl.FLOAT, false, 0, 0);
    // uniform変数とテクスチャを関連付ける
    gl.uniform1i(gl.getUniformLocation(program, "tex_samp"), 0);
    // 描画命令
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4);
};
function compile_shader(gl, type, source) {
    var s = gl.createShader(type);
    if (s == null) {
        throw new Error();
    }
    gl.shaderSource(s, source);
    gl.compileShader(s);
    console.log(gl.getShaderInfoLog(s));
    return s;
}
function link_shader(gl, vs, fs, tf_list) {
    var p = gl.createProgram();
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
