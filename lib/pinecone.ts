import { Pinecone } from "@pinecone-database/pinecone";

const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined;
};

export const pinecone =
  globalForPinecone.pinecone ??
  new Pinecone({
    apiKey: process.env.PINECONE_API_KEY ?? "",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPinecone.pinecone = pinecone;
}

export function getEmbeddingIndex() {
  const indexName = process.env.PINECONE_INDEX ?? "taleden-embeddings";
  return pinecone.index(indexName);
}

export default pinecone;
