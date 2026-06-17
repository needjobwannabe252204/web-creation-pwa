function checkQuiz() {

    let score = 0;

    if(document.querySelector('input[name="q1"]:checked')?.value === "b")
        score++;

    if(document.querySelector('input[name="q2"]:checked')?.value === "a")
        score++;

    if(document.querySelector('input[name="q3"]:checked')?.value === "a")
        score++;

    if(document.querySelector('input[name="q4"]:checked')?.value === "b")
        score++;

    if(document.querySelector('input[name="q5"]:checked')?.value === "a")
        score++;

    document.getElementById("result").innerHTML =
        `Your Score: ${score}/5`;

    let message = "";

    if(score === 5){
        message = "🎉 Excellent!";
    }
    else if(score >= 3){
        message = "👍 Good Job!";
    }
    else{
        message = "📖 Review the lesson and try again.";
    }

    document.getElementById("result").innerHTML =
        `Your Score: ${score}/5<br>${message}`;

    
}

