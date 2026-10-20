import { CASE_BUNDLES, CASES } from '../src/data/cases';
import {
  evaluateEvidence,
  rankForScore,
  scoreCase,
  tightPairs,
  tokensUsed,
  validateCaseBundle,
} from '../src/lib/caseEngine';

let failed = false;

for (const bundle of CASE_BUNDLES) {
  const file = bundle.caseFile;
  const issues = validateCaseBundle(bundle);
  const pairs = tightPairs(bundle);
  const pairKeys = new Set(pairs.map((pair) => [...pair].sort().join('+')));
  const examples = file.validation.exampleTightPairs.map((pair) => [...pair].sort().join('+'));
  const missingExamples = examples.filter((pair) => !pairKeys.has(pair));
  const optimalKey = [...file.validation.optimalExample].sort().join('+');
  const optimalTight = pairKeys.has(optimalKey);
  const optimalCost = tokensUsed(bundle, file.validation.optimalExample);
  const routes = pairs
    .map((pair) => {
      const used = tokensUsed(bundle, pair);
      const evaluation = evaluateEvidence(bundle, pair, pair);
      const score = scoreCase({
        correct: true,
        evidenceScore: evaluation.evidenceScore,
        tokensTotal: file.scoring.tokens,
        tokensUsed: used,
        wrongAccusations: 0,
      });
      return { pair, used, total: score.total, rank: rankForScore(score.total), tight: evaluation.tight };
    })
    .sort((a, b) => b.total - a.total);

  console.log(`\n${file.id} / ${file.title}`);
  console.log(`  suspects=${file.suspectIds.length} clues=${file.clues.length} freeClues=${file.freeClues.length}`);
  console.log(`  validation=${issues.length ? issues.join(' | ') : 'OK'}`);
  console.log(`  tightPairs=${pairs.length} ${JSON.stringify(pairs)}`);
  console.log(`  examples=${missingExamples.length ? `MISSING ${missingExamples.join(', ')}` : 'OK'}`);
  console.log(
    `  optimal=${optimalKey} ${optimalTight ? 'tight' : 'NOT TIGHT'} cost=${optimalCost}pt (declared ${file.validation.optimalTokens}pt)`,
  );
  console.log('  tight routes:');
  for (const route of routes) {
    console.log(`    ${route.pair.join('+')}  cost=${route.used}pt  score=${route.total} ${route.rank}`);
  }
  const best = routes[0];
  if (best) console.log(`  best=${best.pair.join('+')} ${best.total}${best.rank}`);
  if (issues.length || missingExamples.length || !optimalTight || optimalCost !== file.validation.optimalTokens) {
    failed = true;
  }
}

if (CASES.length !== 3) {
  console.error('Expected 3 cases');
  failed = true;
}
if (failed) process.exit(1);
