import init, {
  //   exec,
  //   comp,
  //   cons,
  run,
  // check,
  // js,
  get_output_len,
} from "./pkg/web/fez_rs.js";
let wasm;
(async () => {
  wasm = await init();
})();
const readWasmString = (ptr, len) =>
  new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, ptr, len));
// Use these
// const typeCheck = (program) => readWasmString(check(program), get_output_len());
// const compileJs = (program) => readWasmString(js(program), get_output_len());
// const compileBiteCode = (program) =>
//   readWasmString(comp(program), get_output_len());
// const execBiteCode = (program) =>
//   readWasmString(exec(program), get_output_len());
const typeCheckAndRun = (program) =>
  readWasmString(run(program), get_output_len());
// const concatenateBiteCode = (a, b) =>
//   readWasmString(cons(a, b), get_output_len());

const hasHash = localStorage.getItem("hash");
const HASH = hasHash ?? crypto.randomUUID();
if (!hasHash) localStorage.setItem("hash", HASH);
fetch("/api/init", {
  method: "POST",
  headers: { "Content-Type": "text/plain", Authorization: "Bearer " + HASH },
});
const makeEditor = (el, theme) => {
  const editor = ace.edit(el);
  editor.setOptions({
    fontFamily: "Fantastic",
    copyWithEmptySelection: true,
  });
  editor.setKeyboardHandler("ace/keyboard/vscode");
  editor.renderer.setShowGutter(true);
  editor.setTheme(`ace/theme/${theme}`);
  editor.setShowPrintMargin(false);
  editor.session.setMode("ace/mode/lisp");
  editor.renderer.setScrollMargin(10, 10);
  editor.session.setUseWrapMode(true);
  return editor;
};
const THEME = "terminal";
const editor = makeEditor("editor", THEME);
const files = makeEditor("files", THEME);
const terminal = makeEditor("terminal", THEME);
terminal.renderer.setShowGutter(false);
terminal.setValue("; To run press cmd/ctrl + S or the run button");
terminal.clearSelection();
const initial = new URLSearchParams(location.search).get("l") ?? "";
if (initial) {
  try {
    const decompressed = LZString.decompressFromBase64(initial);
    const source = decodeURIComponent(decompressed);
    editor.setValue(source);
    editor.clearSelection();
  } catch (e) {
    alert(e instanceof Error ? e.message : e);
  }
}
const serialise = (arg) => {
  if (typeof arg === "number" || typeof arg === "string") return arg.toString();
  else if (Array.isArray(arg))
    return arg.length ? `[${arg.map((a) => serialise(a)).join(" ")}]` : "[]";
  else if (arg === true || arg === false) return arg.toString();
  else return "(lambda)";
};
const link = (value) => {
  const compressed = LZString.compressToBase64(value);
  const newurl =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    `?l=${encodeURIComponent(compressed)}`;
  window.history.pushState({ path: newurl }, "", newurl);
};
const evaluate = (value) => {
  const out = typeCheckAndRun(value);
  if (out && out[0] === '"') {
    terminal.setValue(out.substring(1, out.length - 1));
  } else terminal.setValue(out);
  return out;
};
const comp = (value) => {
  evaluate(value);
  fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "text/plain", Authorization: "Bearer " + HASH },
    body: value,
  });
};

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    if (files.isFocused()) {
      const value = files.getValue();
      if (value.trim()) {
        fetch("/api/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + HASH,
          },
          body: JSON.stringify({
            filename: fileNameInput.value,
            content: value,
          }),
        });
      }
    } else if (editor.isFocused()) {
      const value = editor.getValue();
      if (value.trim()) {
        comp(value);
        link(value);
        terminal.clearSelection();
      }
    }
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    const value = editor.getValue();
    if (value.trim()) {
      evaluate(value);
      link(value);
      terminal.clearSelection();
    }
  }
});
// document.getElementById("run").addEventListener("click", () => {
//   const value = editor.getValue();
//   if (value.trim()) {
//     comp(value);
//     link(value);
//     terminal.clearSelection();
//   }
// });
// document.getElementById("check").addEventListener("click", () => {
//   const value = editor.getValue();
//   if (value.trim()) {
//     type(value);
//     link(value);
//     terminal.clearSelection();
//   }
// });
// document.getElementById("js").addEventListener("click", () => {
//   const value = editor.getValue();
//   if (value.trim()) {
//     javascript(value);
//     link(value);
//     terminal.clearSelection();
//   }
// });

const fileNameInput = document.getElementById("filename");
fileNameInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    fetch(`./portals/${HASH}/${e.target.value}`)
      .then((x) => x.text())
      .then((x) => files.setValue(x));
  }
});

// document.addEventListener("keydown", (e) => {
//   if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
//     e.preventDefault();
//     e.stopPropagation();
//     const value = editor.getValue();
//     if (value.trim()) {
//       // terminal.setValue(`[${[...value].map((x) => x.charCodeAt()).join(" ")}]`);
//       fetch("/api/save", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + HASH,
//         },
//         body: JSON.stringify({
//           filename: fileNameInput.value,
//           content: value,
//         }),
//       });
//     }
//   }
// });
// document.getElementById("save").addEventListener("click", () => {
//   const value = editor.getValue();
//   if (value.trim()) {
//     const value = editor.getValue();
//     if (value.trim()) {
//       fetch("/api/save", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + HASH,
//         },
//         body: JSON.stringify({
//           filename: fileNameInput.value,
//           content: value,
//         }),
//       });
//     }
//   }
// });

// document.getElementById("char").addEventListener("click", (e) => {
//   const value = editor.getValue();
//   if (value.trim()) {
//     const value = editor.getValue();
//     if (value.trim()) {
//       if (e.target.textContent === "char") {
//         editor.setValue(`[${[...value].map((x) => x.charCodeAt()).join(" ")}]`);
//         e.target.textContent = "text";
//       } else {
//         editor.setValue(
//           value
//             .slice(1, -1)
//             .split(" ")
//             .map((x) => String.fromCharCode(x))
//             .join("")
//         );
//         e.target.textContent = "char";
//       }
//     }
//   }
// });
