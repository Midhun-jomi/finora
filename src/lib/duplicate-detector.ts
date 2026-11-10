import { ParsedTransactionPreview, Transaction } from './types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedTransactionId?: string;
}

/**
 * Intelligent duplicate detection matching:
 * 1. BankReferenceID match: If both have a non-empty reference ID (e.g., UTR / Cheque No / UPI ref) and match within the same account or across bank accounts.
 * 2. Exact match: Same accountId, same Date, same Amount, and similar Description (or identical description).
 * 3. Intra-batch duplicate: Flags if the CSV itself contains duplicate rows.
 */
export function checkDuplicate(
  candidate: {
    date: string;
    amount: number;
    description: string;
    referenceNumber?: string;
    accountId: string;
  },
  existingTransactions: Transaction[]
): DuplicateCheckResult {
  const candDesc = candidate.description.toLowerCase().trim();
  const candRef = (candidate.referenceNumber || '').trim().toLowerCase();

  for (const existing of existingTransactions) {
    const existRef = (existing.bankReferenceId || '').trim().toLowerCase();

    // 1. Bank Reference ID match (strongest signal)
    if (candRef && existRef && candRef === existRef && candidate.accountId === existing.accountId) {
      return {
        isDuplicate: true,
        duplicateReason: `Matched Reference ID: ${candidate.referenceNumber}`,
        matchedTransactionId: existing.id,
      };
    }

    // 2. Exact Date, Amount and Account ID
    if (
      candidate.accountId === existing.accountId &&
      candidate.date === existing.date &&
      Math.abs(candidate.amount - existing.amount) < 0.01
    ) {
      const existDesc = (existing.description || '').toLowerCase().trim();

      // Check description similarity
      if (
        candDesc === existDesc ||
        candDesc.includes(existDesc) ||
        existDesc.includes(candDesc)
      ) {
        return {
          isDuplicate: true,
          duplicateReason: `Identical Date (${candidate.date}), Amount (₹${candidate.amount}), and Description`,
          matchedTransactionId: existing.id,
        };
      }

      // If amount and date match exactly, even if descriptions differ slightly (e.g. UPI prefix variance)
      return {
        isDuplicate: true,
        duplicateReason: `Potential duplicate: Same Date & Amount (₹${candidate.amount}) on this account`,
        matchedTransactionId: existing.id,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Marks duplicates in a list of parsed preview items against existing DB transactions,
 * as well as detecting duplicates within the uploaded batch itself.
 */
export function markDuplicatesInPreviews(
  previews: ParsedTransactionPreview[],
  existingTransactions: Transaction[],
  accountId: string
): ParsedTransactionPreview[] {
  const seenInBatch = new Map<string, number>();

  return previews.map((preview, index) => {
    // Check against DB
    const dbMatch = checkDuplicate(
      {
        date: preview.date,
        amount: preview.amount,
        description: preview.description,
        referenceNumber: preview.referenceNumber,
        accountId,
      },
      existingTransactions
    );

    if (dbMatch.isDuplicate) {
      return {
        ...preview,
        isDuplicate: true,
        duplicateReason: dbMatch.duplicateReason,
        existingTransactionId: dbMatch.matchedTransactionId,
        selected: false, // by default uncheck duplicates so user can review and explicitly choose
      };
    }

    // Check against items earlier in the same batch
    const batchKey = preview.referenceNumber
      ? `ref:${preview.referenceNumber}`
      : `${preview.date}_${preview.amount}_${preview.description.slice(0, 20)}`;

    if (seenInBatch.has(batchKey)) {
      return {
        ...preview,
        isDuplicate: true,
        duplicateReason: `Duplicate row in current CSV file (row #${seenInBatch.get(batchKey)! + 1})`,
        selected: false,
      };
    }

    seenInBatch.set(batchKey, index);

    return {
      ...preview,
      isDuplicate: false,
      selected: true,
    };
  });
}

