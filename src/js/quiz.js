function checkQuiz() {

    // Check if all questions have been answered
    const answered =
        document.querySelector('input[name="q1"]:checked') &&
        document.querySelector('input[name="q2"]:checked') &&
        document.querySelector('input[name="q3"]:checked') &&
        document.querySelector('input[name="q4"]:checked') &&
        document.querySelector('input[name="q5"]:checked');

    if (!answered) {
        alert("Please answer all questions before submitting.");
        return;
    }

    let score = 0;

    if (document.querySelector('input[name="q1"]:checked')?.value === "b")
        score++;

    if (document.querySelector('input[name="q2"]:checked')?.value === "a")
        score++;

    if (document.querySelector('input[name="q3"]:checked')?.value === "a")
        score++;

    if (document.querySelector('input[name="q4"]:checked')?.value === "b")
        score++;

    if (document.querySelector('input[name="q5"]:checked')?.value === "a")
        score++;

    let message = "";

    if (score === 5) {
        message = "🎉 Excellent!";
    }
    else if (score >= 3) {
        message = "👍 Good Job!";
    }
    else {
        message = "📖 Review the lesson and try again.";
    }

const resultBox = document.getElementById("result");

resultBox.style.display = "block";

if(score === 5){
    resultBox.style.background = "#2e7d32";
}
else if(score >= 3){
    resultBox.style.background = "#f9a825";
}
else{
    resultBox.style.background = "#c62828";
}

resultBox.innerHTML =
    `🏆 Your Score: ${score}/5<br>${message}`;

    // Hide Submit button and show Reset button
    document.getElementById("submitQuiz").style.display = "none";
    document.getElementById("resetQuiz").style.display = "inline-block";
}


function resetQuiz() {

    // Clear all selected answers
    document
        .querySelectorAll('#quiz-1 input[type="radio"]')
        .forEach(radio => radio.checked = false);

    // Clear result text
    const resultBox = document.getElementById("result");

    resultBox.innerHTML = "";
    resultBox.style.display = "none";

    // Show Submit button and hide Reset button
    document.getElementById("submitQuiz").style.display = "inline-block";
    document.getElementById("resetQuiz").style.display = "none";
}


// Make sure buttons start in the correct state
document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("submitQuiz").style.display = "inline-block";
    document.getElementById("resetQuiz").style.display = "none";

    document
        .getElementById("resetQuiz")
        .addEventListener("click", resetQuiz);
});