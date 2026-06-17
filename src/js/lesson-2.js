const runBtn = document.getElementById("runBtn");

if (runBtn) {
    runBtn.addEventListener("click", function () {
        const editor = document.getElementById("editor");
        const output = document.getElementById("output");

        output.innerHTML = editor.value;
    });
}