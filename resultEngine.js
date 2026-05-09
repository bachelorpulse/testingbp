export function calculateResult(questions, userAnswers) {
let correct=0, wrong=0, unanswered=0;
userAnswers.forEach((a,i)=>{
if(a===null) unanswered++;
else if(a===questions[i].correct) correct++;
else wrong++;
});
const pct = Math.round(correct/questions.length*100);
return { correct, wrong, unanswered, total: questions.length, pct, percentage: pct };
}
