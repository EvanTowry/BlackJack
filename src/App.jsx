import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default function BlackjackTrainer() {
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [count, setCount] = useState(0);
  const [bankroll, setBankroll] = useState(null);
  const [bet, setBet] = useState(0);
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
    if (!bankroll) return 0;
    const trueCount = count / 6; // assuming 6 decks
    const baseUnit = bankroll / 100;
    if (trueCount >= 5) return Math.floor(baseUnit * 10);
    if (trueCount >= 3) return Math.floor(baseUnit * 5);
    if (trueCount >= 1) return Math.floor(baseUnit * 2);
    return Math.floor(baseUnit);
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

  if (bankroll === null) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Enter Starting Bankroll</h1>
        <input
          type="number"
          className="border p-2 rounded w-full"
          placeholder="Enter bankroll..."
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
              setBankroll(value);
              setBet(suggestBet());
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Rebet-Style Blackjack Trainer</h1>
      <Card className="mb-4">
        <CardContent className="space-y-2 p-4">
          <div>Running Count: {count}</div>
          <div>Suggested Bet: {bet} units</div>
          <div>Bankroll: ${bankroll}</div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold">Dealer Hand</h2>
            <div>{dealer.join(", ")}</div>
            <div className="flex flex-wrap gap-2">
              {CARD_VALUES.map(val => (
                <Button key={val} onClick={() => handleCardInput(val, "dealer")}>{val}</Button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold">Player Hand</h2>
            <div>{player.join(", ")}</div>
            <div className="flex flex-wrap gap-2">
              {CARD_VALUES.map(val => (
                <Button key={val} onClick={() => handleCardInput(val, "player")}>{val}</Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <div className="font-medium">Advice: {player.length > 0 && dealer.length > 0 ? getAction(player, dealer[0], true, true) : "Input both hands"}</div>
        <div className="mt-2 flex gap-2">
          <Button onClick={resolve}>Resolve</Button>
          <Button onClick={reset} variant="outline">Reset Hand</Button>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Hand History</h2>
        <ul className="space-y-1 text-sm">
          {log.map((entry, idx) => (
            <li key={idx} className="border rounded p-2 bg-gray-50">
              <div><strong>Result:</strong> {entry.result}</div>
              <div><strong>Bet:</strong> ${entry.bet} | <strong>Count:</strong> {entry.count}</div>
              <div><strong>Player:</strong> {entry.player.join(", ")} | <strong>Dealer:</strong> {entry.dealer.join(", ")}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
