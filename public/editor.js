const hasHash = localStorage.getItem("hash");
const HASH = hasHash ?? crypto.randomUUID();
if (!hasHash) localStorage.setItem("hash", HASH);

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
  editor.session.setMode("ace/mode/html");
  editor.renderer.setScrollMargin(10, 10);
  editor.session.setUseWrapMode(true);
  return editor;
};
const THEME = "terminal";
const editor = makeEditor("editor", THEME);
const fileNameInput = document.getElementById("filename");
fileNameInput.addEventListener("keyup", (e) => {
  if (event.key === "Enter") {
    fetch(`./portals/${HASH}/${e.target.value}`)
      .then((x) => x.text())
      .then((x) => editor.setValue(x));
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    const value = editor.getValue();
    if (value.trim()) {
      // terminal.setValue(`[${[...value].map((x) => x.charCodeAt()).join(" ")}]`);
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
  }
});
document.getElementById("save").addEventListener("click", () => {
  const value = editor.getValue();
  if (value.trim()) {
    const value = editor.getValue();
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
  }
});

document.getElementById("char").addEventListener("click", (e) => {
  const value = editor.getValue();
  if (value.trim()) {
    const value = editor.getValue();
    if (value.trim()) {
      if (e.target.textContent === "char") {
        editor.setValue(`[${[...value].map((x) => x.charCodeAt()).join(" ")}]`);
        e.target.textContent = "text";
      } else {
        editor.setValue(
          value
            .slice(1, -1)
            .split(" ")
            .map((x) => String.fromCharCode(x))
            .join("")
        );
        e.target.textContent = "char";
      }
    }
  }
});
