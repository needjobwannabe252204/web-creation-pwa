document
    .getElementById("runBtn")
    .addEventListener("click", checkSemanticTags);

function checkSemanticTags() {

    const code =
        document.getElementById("editor").value;

    const feedback =
        document.getElementById("feedback");

    const output =
        document.getElementById("output");

    const parser = new DOMParser();

    const doc = parser.parseFromString(
        code,
        "text/html"
    );

    const requiredTags = [
        "header",
        "nav",
        "main",
        "footer"
    ];

    const missingTags = [];
    const emptyTags = [];

    requiredTags.forEach(tag => {

        const element = doc.querySelector(tag);

        if (!element) {

            missingTags.push(tag);
            return;
        }

        // consider element empty if it has no meaningful text and no child elements
        const text = element.textContent ? element.textContent.trim() : "";

        const hasMeaningfulText = text.length >= 5;
        const hasChildren = element.children.length > 0;

        if (!hasMeaningfulText && !hasChildren) {
            emptyTags.push(tag);
        }

    });

    const nav = doc.querySelector("nav");

    let navHasLink = false;

    if (nav) {
        navHasLink = nav.querySelector("a") !== null;
    }

    if (missingTags.length > 0) {

        feedback.className =
            "feedback error";

        feedback.innerHTML =
            `❌ Missing tag(s): ${missingTags.join(", ")}`;

        output.srcdoc = "";

        return;
    }

    if (emptyTags.length > 0) {

        feedback.className =
            "feedback error";

        feedback.innerHTML =
            `❌ Empty section(s): ${emptyTags.join(", ")}`;

        output.srcdoc = "";

        return;
    }

    if (!navHasLink) {

        feedback.className =
            "feedback error";

        feedback.innerHTML =
            "❌ Navigation menu must contain at least one link.";

        output.srcdoc = "";

        return;
    }

    feedback.className =
        "feedback success";

    feedback.innerHTML =
        "✅ Great Job! Your semantic webpage looks complete.";

    output.srcdoc = code;
}
