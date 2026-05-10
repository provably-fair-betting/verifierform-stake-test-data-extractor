const suitNames = {
  "♥": "heart",
  "♦": "diamond",
  "♣": "club",
  "♠": "spade",
};

const cardPattern = /^(?<suit>[♥♦♣♠])(?<value>10|[2-9AJQK])$/u;

export const parseCards = (input) => {
  const tokens = String(input).trim().split(/\s+/u).filter(Boolean);

  if (tokens.length === 0) {
    throw new Error(`No cards found in input: ${input}`);
  }

  return tokens.map(parseCard);
};

export const parseCard = (cardText) => {
  const normalizedCard = String(cardText).trim();

  if (!normalizedCard) {
    throw new Error("Cannot parse an empty card value");
  }

  const match = normalizedCard.match(cardPattern);

  if (!match?.groups) {
    throw new Error(`Invalid card "${normalizedCard}"`);
  }

  const suitName = suitNames[match.groups.suit];

  if (!suitName) {
    throw new Error(`Unknown suit in card "${normalizedCard}"`);
  }

  return `${match.groups.value}-${suitName}`;
};
