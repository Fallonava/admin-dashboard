// /src/lib/vector-store.ts
import { pipeline } from '@xenova/transformers';
import cosineSimilarity from 'cosine-similarity';

// Gunakan singleton untuk memastikan model hanya dimuat sekali di memori Node.js
class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      // Lazy load pipeline
      this.instance = await pipeline(this.task, this.model, { 
        progress_callback 
      });
    }
    return this.instance;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await PipelineSingleton.getInstance();
    
    // Generate embeddings
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
    // Output berbentuk Float32Array, kita jadikan array standar
    return Array.from(output.data);
  } catch (error) {
    console.error("Embedding generation failed:", error);
    // Kembalikan array kosong jika gagal (fallback)
    return new Array(384).fill(0); 
  }
}

import lunr from 'lunr';

export function findMostSimilar(
  query: string,
  queryEmbedding: number[], 
  dataset: { id: string, embedding: number[], content: string, title: string, category: string }[], 
  threshold: number = 0.40
) {
  if (dataset.length === 0) return { match: null, score: 0 };

  // 1. Vector Search Scores
  const vectorScores = dataset.map(item => {
    const score = item.embedding?.length > 0 ? cosineSimilarity(queryEmbedding, item.embedding) : 0;
    return { id: item.id, score };
  });

  // Sort vector scores descending
  vectorScores.sort((a, b) => b.score - a.score);

  // 2. BM25 Keyword Search Scores
  const idx = lunr(function () {
    this.ref('id');
    this.field('title', { boost: 5 });
    this.field('content');
    this.field('category', { boost: 2 });
    
    // Add documents
    dataset.forEach(doc => this.add(doc));
  });

  // Execute search (clean query first)
  const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  let bm25Results: lunr.Index.Result[] = [];
  try {
    bm25Results = cleanQuery ? idx.search(cleanQuery) : [];
  } catch (e) {
    // Fallback if syntax error
    const terms = cleanQuery.split(' ').map(t => '+' + t + '*').join(' ');
    try { bm25Results = idx.search(terms); } catch(err){}
  }

  // 3. Reciprocal Rank Fusion (RRF)
  // RRF(d) = 1 / (k + rank_vector(d)) + 1 / (k + rank_bm25(d))
  const K = 60; 
  const rrfScores: Record<string, number> = {};
  
  dataset.forEach(d => rrfScores[d.id] = 0);

  vectorScores.forEach((v, index) => {
    // Only fuse if vector score is somewhat semantic
    if (v.score >= threshold - 0.1) {
       rrfScores[v.id] += 1 / (K + index + 1);
    }
  });

  bm25Results.forEach((b, index) => {
    rrfScores[b.ref] += 1 / (K + index + 1);
  });

  // 4. Find Best Result
  let bestId = null;
  let highestRrf = 0;
  
  Object.entries(rrfScores).forEach(([id, score]) => {
     if (score > highestRrf) {
       highestRrf = score;
       bestId = id;
     }
  });

  // Normalize back to a pseudo-score (just for fallback logic upstream)
  const bestDocVectorScore = vectorScores.find(v => v.id === bestId)?.score || 0;
  const match = bestId ? dataset.find(d => d.id === bestId) : null;
  
  // Return the match if vector score meets threshold, or if bm25 strongly hit it
  if (match && (bestDocVectorScore >= threshold || bm25Results.findIndex(b => b.ref === bestId) === 0)) {
     return { match, score: Math.max(bestDocVectorScore, 0.5) }; 
  }
  
  return { match: null, score: 0 };
}
