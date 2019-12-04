"use strict";

const {spawn} = require("child_process");
const {delimiter, sep} = require("path");
const {existsSync, openSync, statSync} = require("fs");
module.exports = {addTo, exec, New, rgba, which};


/**
 * Curried method to append multiple nodes at once.
 *
 * @example addTo(node)(el1, el2, …)
 * @example node = addTo(node)(…)[0]
 * @param {Node} parent
 * @return {Function}
 * @version Alhadis/Utils@20442bd
 */
function addTo(parent){
	let count = 0;
	let target = parent;
	
	const fn = (...nodes) => {
		let lastElement;
		
		for(let node of nodes){
			if("string" === typeof node)
				node = document.createTextNode(node);
			else if(node)
				lastElement =
				fn[++count] = node;
			node && target.appendChild(node);
		}
		
		target = lastElement || target;
		return fn;
	};
	fn[count] = target;
	return fn;
}


/**
 * Execute an external command.
 *
 * @throws {Error} Rejects if the subprocess emits an `error` event.
 * @example exec("sed", ["-e", "s/in/out/"], "input");
 * @param {String}       command     - Name of the command to execute.
 * @param {String[]}     argList     - Arguments/switches passed to command.
 * @param {String}      [input=null] - Data to pipe to standard input, if any.
 * @param {ExecOptions} [options={}] - Additional options. See {@link ExecOptions}.
 * @return {Promise<ExecResult>}
 * @version Alhadis/Utils@20442bd
 */
function exec(command, argList = [], input = null, options = {}){
	const defaultEncoding = "utf8";
	if("string" === typeof options)
		options = {encoding: options};
	let {encoding = defaultEncoding, outputPath = ""} = options;
	const proc = spawn(command, argList, {
		env: {...process.env, ...options.env},
		cwd: options.cwd,
		windowsHide: true,
		stdio: outputPath
			? ["pipe", openSync(outputPath, "w"), "pipe"]
			:  "pipe",
	});
	let stdout = "";
	let stderr = "";
	if("string" === typeof encoding)
		encoding = new Array(3).fill(encoding);
	if(null !== input){
		proc.stdin.write(input, encoding[0] || defaultEncoding);
		proc.stdin.end();
	}
	if(!outputPath){
		proc.stdout.setEncoding(encoding[1] || defaultEncoding);
		proc.stdout.on("data", data => stdout += data);
	}
	proc.stderr.setEncoding(encoding[2] || defaultEncoding);
	proc.stderr.on("data", data => stderr += data);
	return new Promise((resolve, reject) => {
		proc.on("close", code => resolve({code, stdout, stderr}));
		proc.on("error", error => reject(error));
	});
}


/**
 * Create a new DOM element.
 *
 * @example New("div", {
 *   className: "foo",
 *   textContent: "bar"
 * }) == HTML`<div class="foo">bar</div>`
 * 
 * @param {String} type - Tag-name of element to create.
 * @param {Object} [attr] - Optional attributes to assign.
 * @return {Element}
 * @version Alhadis/Utils@20442bd
 */
function New(type, attr = null){
	const absorb = (a, b) => {
		for(const i in b)
			if(Object(a[i]) === a[i] && Object(b[i]) === b[i])
				absorb(a[i], b[i]);
			else a[i] = b[i];
	};
	const node = document.createElement(type);
	if(null !== attr) absorb(node, attr);
	return node;
}


/**
 * Generate a 4×4-sized PNG image filled with the designated RGBA value.
 *
 * @example base64Encode(rgba(255, 0, 0, 255)) == "iVBORw0KGgoAAAANSU…ErkJggg==";
 * @param {Number} r - Red component (0-255)
 * @param {Number} g - Green component (0-255)
 * @param {Number} b - Blue component (0-255)
 * @param {Number} a - Alpha value (0-255: transparent to opaque)
 * @return {String} Raw PNG data
 * @uses {@link adler32}, {@link crc32}
 * @version Alhadis/Utils@20442bd
 */
function rgba(r, g, b, a){
	const char = String.fromCharCode;
	const hton = i => String.fromCharCode(i >>> 24, i >>> 16 & 255, i >>> 8 & 255, i & 255);
	
	// PNG header
	const IHDR = "\x89PNG\r\n\x1A\n\0\0\0\rIHDR\0\0\0\x04\0\0\0\x04\x08\x06\0\0\0\xA9\xF1\x9E~\0\0\0O";
	
	// IDAT (Image Data) chunk
	const IDAT = "IDAT\x08\x1D\x01D\0\xBB\xFF";
	const data = "\x01" + char(r) + char(g) + char(b) + char(a) + "\0".repeat(12)
		+ "\x02" + `${"\0".repeat(16)}\x02`.repeat(2)
		+ "\0".repeat(16);
	
	const crc1 = hton(adler32(data));
	const crc2 = hton(crc32(IDAT + data + crc1));

	// Concatenate image-data and close PNG stream with IEND chunk.
	return IHDR + IDAT + data + crc1 + crc2 + "\0".repeat(4) + "IEND\xAEB`\x82";
}


/**
 * Compute the Adler-32 checksum of a value.
 *
 * @example adler32("foo-bar") == 0xAA402A7;
 * @see {@link https://en.wikipedia.org/wiki/Adler-32}
 * @param {String|Number[]} data
 * @return {Number}
 * @version Alhadis/Utils@20442bd
 */
function adler32(data){
	if("string" === typeof data)
		data = [...data].map(c => c.charCodeAt(0));
	let a = 1;
	let b = 0;
	const base = 65521;
	const {length} = data;
	for(let i = 0; i < length; ++i){
		a = (a + data[i]) % base;
		b = (b + a)       % base;
	}
	return b << 16 | a;
}


/**
 * Compute a 32-bit cyclic redundancy check.
 *
 * @example crc32("Foo123") == 0x67EDF5DB;
 * @param {String|Number[]} data
 * @return {Number}
 * @version Alhadis/Utils@20442bd
 */
function crc32(data){
	if("string" === typeof data)
		data = [...data].map(c => c.charCodeAt(0));
	let crc = ~0;
	const {length} = data;
	for(let i = 0; i < length; ++i)
		for(let byte = data[i] | 0x100; byte !== 1; byte >>>= 1)
			crc = (crc >>> 1) ^ ((crc ^ byte) & 1 ? 0xEDB88320 : 0);
	return ~crc;
}


/**
 * Locate a program file in the user's $PATH.
 *
 * Resolves with an empty string/array if nothing was found.
 *
 * @example which("curl") == "/usr/bin/curl"
 * @example which("nada") == ""
 * @param {String} name
 * @param {Boolean} [all=false]
 * @return {Promise<(String|String[])>}
 * @version Alhadis/Utils@20442bd
 */
async function which(name, all = false){
	if(!name) return all ? [] : "";
	const {env} = process;
	const exts = ("\\" === sep ? env.PATHEXT || ".COM;.EXE;.BAT" : "")
		.replace(/.+/, $ => $.toLowerCase() + delimiter + $)
		.split(delimiter);
	const results = [];
	const fileIDs = new Set();
	for(const dir of (env.PATH || env.Path || "").split(new RegExp(`\\${sep}?${delimiter}`)))
		for(const ext of exts){
			const fullPath = dir + sep + name + ext;
			const stats = existsSync(fullPath) && statSync(fullPath); let uid;
			if(stats && stats.isFile() && !fileIDs.has(uid = `${stats.dev}:${stats.ino}`)){
				fileIDs.add(uid);
				results.push(fullPath);
				if(!all) return results[0];
			}
		}
	return all ? results : "";
}
