import { useState } from "react";

const CARD_VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function cardValue(card) {
  if (["J", "Q", "K", "10"].includes(card)) return 10;
  if (card === "A") return 11;
  return parseInt(card);
}

function hiLoValue(card) {
  if (["2", "3", "4", "5", "6"].includes(card)) return 1;
  if (["7", "8", "9"].includes(card)) return 0;
  return -1;
}

function handValue(hand) {
  let total = 0;
  let aces = hand.filter(c => c === "A").length;
  hand.forEach(card => total += cardValue(card));
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function getAction(player, dealerUpcard, canDouble, canSplit) {
  const total = handValue(player);
  const upVal = ["10", "J", "Q", "K"].includes(dealerUpcard) ? 10 : dealerUpcard === "A" ? 11 : parseInt(dealerUpcard);

  if (player.length === 2 && player[0] === player[1] && canSplit) {
    if (["A", "8"].includes(player[0])) return "Split (always split Aces and 8s)";
    if (["2", "3", "7"].includes(player[0]) && upVal <= 7) return "Split (dealer weak)";
    if (player[0] === "6" && upVal <= 6) return "Split (advantageous split)";
    if (player[0] === "9" && ![7, 10, 11].includes(upVal)) return "Split (optimal)";
  }

  if (total === 11 && canDouble) return "Double (maximum power)";
  if (total === 10 && upVal <= 9 && canDouble) return "Double (dealer weaker)";
  if (total === 9 && [3, 4, 5, 6].includes(upVal) && canDouble) return "Double (dealer very weak)";

  if (total <= 11) return "Hit (too weak to stand)";
  if (total === 12 && [4, 5, 6].includes(upVal)) return "Stand (dealer likely to bust)";
  if (total >= 17) return "Stand (strong total)";
  if (total >= 13 && total <= 16 && upVal <= 6) return "Stand (dealer weak)";
  return "Hit (dealer strong)";
}

export default function App() {
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [count, setCount] = useState(0);
  const [bankroll, setBankroll] = useState(1000);
  const [bet, setBet] = useState(10);
  const [log, setLog] = useState([]);

  const handleCardInput = (card, who) => {
    const value = hiLoValue(card);
    setCount(prev => prev + value);
    if (who === "player") setPlayer(prev => [...prev, card]);
    else setDealer(prev => [...prev, card]);
  };

  const reset = () => {
    setPlayer([]);
    setDealer([]);
    setBet(suggestBet());
  };

  const suggestBet = () => {
    const trueCount = count / 6;
    if (trueCount >= 5) return 100;
    if (trueCount >= 3) return 50;
    if (trueCount >= 1) return 20;
    return 10;
  };

  const resolve = () => {
    const p = handValue(player);
    const d = handValue(dealer);
    let result = "Push";
    if (p > 21) {
      setBankroll(b => b - bet);
      result = "Loss (player bust)";
    } else if (d > 21 || p > d) {
      setBankroll(b => b + bet);
      result = "Win";
    } else if (p < d) {
      setBankroll(b => b - bet);
      result = "Loss";
    }
    setLog(prev => [...prev, { player: [...player], dealer: [...dealer], result, bet, count }]);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Blackjack Trainer</h1>
      <div>Running Count: {count}</div>
      <div>Suggested Bet: {suggestBet()} units</div>
      <div>Bankroll: ${bankroll}</div>
      <div style={{ marginTop: 20 }}>
        <h2>Dealer Hand</h2>
        <div>{dealer.join(", ")}</div>
        {CARD_VALUES.map(val => (
          <button key={val} onClick={() => handleCardInput(val, "dealer")} style={{ margin: 2 }}>{val}</button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <h2>Player Hand</h2>
        <div>{player.join(", ")}</div>
        {CARD_VALUES.map(val => (
          <button key={val} onClick={() => handleCardInput(val, "player")} style={{ margin: 2 }}>{val}</button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <strong>Advice: </strong>{player.length > 0 && dealer.length > 0 ? getAction(player, dealer[0], true, true) : "Input both hands"}
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={resolve}>Resolve</button>
        <button onClick={reset} style={{ marginLeft: 10 }}>Reset Hand</button>
      </div>
      <div style={{ marginTop: 20 }}>
        <h2>Hand History</h2>
        <ul>
          {log.map((entry, idx) => (
            <li key={idx}>
              Result: {entry.result}, Bet: ${entry.bet}, Count: {entry.count}, Player: {entry.player.join(", ")}, Dealer: {entry.dealer.join(", ")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
