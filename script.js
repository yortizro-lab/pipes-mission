const startButton = document.getElementById("startButton");
const gameArea = document.getElementById("gameArea");
const message = document.getElementById("message");

startButton.addEventListener("click", startGame);

function startGame() {
  gameArea.innerHTML = `
    <div class="pipe">🟦</div>
    <div class="pipe">🟦</div>
    <div class="pipe">🟦</div>
  `;

  message.textContent = "Mission started! Connect the pipes!";
  startButton.textContent = "Restart Game";
}