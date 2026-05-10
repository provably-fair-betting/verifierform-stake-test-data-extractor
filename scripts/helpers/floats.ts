import { createHmac } from "node:crypto";

type SeedContext = {
  clientSeed: string;
  serverSeed: string;
  nonce: number;
};

type ByteGeneratorOptions = SeedContext & {
  cursor: number;
};

export function* createFloatGenerator(seed: SeedContext): Generator<number> {
  const bytes = createByteGenerator({ ...seed, cursor: 0 });

  while (true) {
    const chunk = [
      bytes.next().value,
      bytes.next().value,
      bytes.next().value,
      bytes.next().value,
    ] as [number, number, number, number];

    yield chunk.reduce((result, value, index) => {
      return result + value / 256 ** (index + 1);
    }, 0);
  }
}

export function* createByteGenerator({
  clientSeed,
  serverSeed,
  nonce,
  cursor,
}: ByteGeneratorOptions): Generator<number> {
  let currentRound = Math.floor(cursor / 32);
  let currentRoundCursor = cursor - currentRound * 32;

  while (true) {
    const hmac = createHmac("sha256", serverSeed);
    hmac.update(`${clientSeed}:${nonce}:${currentRound}`);

    const buffer = hmac.digest();

    while (currentRoundCursor < 32) {
      yield Number(buffer[currentRoundCursor]);
      currentRoundCursor += 1;
    }

    currentRoundCursor = 0;
    currentRound += 1;
  }
}
