import express from "express";
import {
  get_output_len,
  __wasm,
  cons,
  comp,
  exec,
} from "../pkg/node/fez_rs.js";
import { writeFile, mkdir } from "fs";
import { readFile } from "fs/promises";
import path from "path";
const memory = __wasm.memory;
const router = express.Router();

const convertToString = (xs) =>
  Array.isArray(xs)
    ? xs.map(convertToString).join("")
    : String.fromCharCode(xs);
const parse = (str) => {
  if (str[0] === "[") return JSON.parse(str.replaceAll(" ", ","));
  else return [];
};
const writeFileEnsured = (filePath, data) => {
  const dir = path.dirname(filePath);
  mkdir(dir, { recursive: true }, (err) => {
    if (err) return;
    writeFile(filePath, data, (err) => err);
  });
};
const partition = (xs) =>
  xs.reduce((a, b, i) => {
    if (i % 2 === 0) {
      a.push([b]);
    } else {
      a.at(-1).push(b);
    }
    return a;
  }, []);
const getHash = (req) => req.headers.authorization.split("Bearer ")[1];
// import { readFileSync, writeFileSync } from "fs";

const readWasmString = (ptr, len) =>
  new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len));

const runCons = (a, b) => readWasmString(cons(a, b), get_output_len());

const runExec = (program) => readWasmString(exec(program), get_output_len());

const runComp = (program) => readWasmString(comp(program), get_output_len());

const removeTest = (src) => src.replace(/; --.*?; --.*?\n?/gs, "");
const merge = (input, ...programms) =>
  programms.reduce((a, b) => runCons(a, b), input);

const toCharCodeVector = (str) => [...str].map((x) => x.charCodeAt()).join(" ");
router.post("/save", async (req, res) => {
  const dir = `./public/portals/${getHash(req)}`;
  writeFileEnsured(`${dir}/${req.body.filename}`, req.body.content);
  res.status(200).json({ success: true });
});
router.post("/init", async (req, res) => {
  const dir = `./public/portals/${getHash(req)}`;
  writeFileEnsured(`${dir}/input.txt`, "");
  writeFileEnsured(`${dir}/output.txt`, "");
  writeFileEnsured(
    `${dir}/index.html`,
    `<body style="background:black">
<object data="./output.txt" type="text/plain" style="width:100%"></object>
</body>`
  );
  res.status(200).json({ success: true });
});
router.post("/run", async (req, res) => {
  const dir = `./public/portals/${getHash(req)}`;
  const input = await readFile(`${dir}/input.txt`, "utf-8");
  // for (const [key, value] of Object.entries(process.memoryUsage())) {
  //   console.log(`Memory usage by ${key}, ${value / 1000000}MB `);
  // }
  // console.log("\n");
  const inp = runComp(`(let *INPUT* [${toCharCodeVector(input)}])`);
  const prog = runComp(removeTest(req.body));
  const out = runExec(merge(inp, prog));
  for (const [file, content] of partition(parse(out))) {
    writeFileEnsured(
      `${dir}/${convertToString(file)}`,
      convertToString(content)
    );
  }
  // for (const [key, value] of Object.entries(process.memoryUsage())) {
  //   console.log(`Memory usage by ${key}, ${value / 1000000}MB `);
  // }
  // console.log("\n");
  res.status(200).json({ success: true });
});

export default router;
