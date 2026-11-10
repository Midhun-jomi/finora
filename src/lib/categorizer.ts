import { MerchantMapping, TransactionType } from './types';

export interface CleanMerchantResult {
  merchantName: string;
  category: string;
  suggestedType?: TransactionType;
}

// Built-in rule catalog
export const DEFAULT_MERCHANT_RULES: Array<{
  pattern: RegExp;
  merchantName: string;
  category: string;
  suggestedType?: TransactionType;
}> = [
  // Transfers & Self Transfers
  { pattern: /(SELF\s*TRF|SELF\s*TRANSFER|OWN\s*A\/?C|TRF\s*TO\s*MY|FUNDS\s*TRANSFER|INTERNAL\s*TRF)/i, merchantName: 'Self Transfer', category: 'Transfer', suggestedType: 'transfer' },
  { pattern: /(CC\s*PAYMENT|CREDIT\s*CARD\s*PAYMENT|CRED\.CLUB|CRED\s*PAY|BILLDESK.*CC|PAYTM.*CC|SBI\s*CARD|HDFC\s*CC\s*PYMT|ICICI\s*CARD\s*PAY)/i, merchantName: 'Credit Card Bill Payment', category: 'Credit Card Payment', suggestedType: 'credit_card_payment' },
  
  // Refunds
  { pattern: /(REFUND|REVERSAL|REV:|CASHBACK|RVSL)/i, merchantName: 'Refund / Reversal', category: 'Refunds', suggestedType: 'refund' },

  // Salary & Income
  { pattern: /(SALARY|PAYROLL|STIPEND|BONUS|DIRECT\s*DEP|MONTHLY\s*SAL)/i, merchantName: 'Employer Salary', category: 'Salary & Income', suggestedType: 'income' },
  { pattern: /(INTEREST\s*PAID|INT\.PD|DIVIDEND|INT\s*EARNED)/i, merchantName: 'Bank Interest / Dividend', category: 'Investment & Returns', suggestedType: 'income' },

  // Food & Dining
  { pattern: /SWIGGY/i, merchantName: 'Swiggy', category: 'Food & Dining', suggestedType: 'expense' },
  { pattern: /ZOMATO/i, merchantName: 'Zomato', category: 'Food & Dining', suggestedType: 'expense' },
  { pattern: /(BLINKIT|GROFERS)/i, merchantName: 'Blinkit', category: 'Groceries', suggestedType: 'expense' },
  { pattern: /ZEPTO/i, merchantName: 'Zepto', category: 'Groceries', suggestedType: 'expense' },
  { pattern: /INSTAMART/i, merchantName: 'Instamart', category: 'Groceries', suggestedType: 'expense' },
  { pattern: /(BIGBASKET|BB\s*DAILY)/i, merchantName: 'BigBasket', category: 'Groceries', suggestedType: 'expense' },
  { pattern: /STARBUCKS/i, merchantName: 'Starbucks', category: 'Food & Dining', suggestedType: 'expense' },
  { pattern: /(MCDONALD|MCD)/i, merchantName: "McDonald's", category: 'Food & Dining', suggestedType: 'expense' },
  { pattern: /(DOMINO|DOMINOS)/i, merchantName: "Domino's Pizza", category: 'Food & Dining', suggestedType: 'expense' },
  { pattern: /KFC/i, merchantName: 'KFC', category: 'Food & Dining', suggestedType: 'expense' },
  { pattern: /(BURGER\s*KING)/i, merchantName: 'Burger King', category: 'Food & Dining', suggestedType: 'expense' },
  { pattern: /(SUBWAY|PIZZA\s*HUT|CHAI\s*POINT|CHAAYOS)/i, merchantName: 'Cafe / Dining', category: 'Food & Dining', suggestedType: 'expense' },

  // Travel & Transport
  { pattern: /UBER/i, merchantName: 'Uber', category: 'Travel & Commute', suggestedType: 'expense' },
  { pattern: /RAPIDO/i, merchantName: 'Rapido', category: 'Travel & Commute', suggestedType: 'expense' },
  { pattern: /OLA\s*(CABS)?/i, merchantName: 'Ola Cabs', category: 'Travel & Commute', suggestedType: 'expense' },
  { pattern: /(IRCTC|RAILWAY)/i, merchantName: 'IRCTC Trains', category: 'Travel & Commute', suggestedType: 'expense' },
  { pattern: /(INDIGO|AIR\s*INDIA|SPICEJET|VISTARA|AKASA)/i, merchantName: 'Airlines Flight', category: 'Travel & Commute', suggestedType: 'expense' },
  { pattern: /(MAKEMYTRIP|MMT|GOIBIBO|CLEARTRIP|EASEMYTRIP)/i, merchantName: 'Travel Booking', category: 'Travel & Commute', suggestedType: 'expense' },
  { pattern: /(FASTAG|TOLL|METRO)/i, merchantName: 'Toll & Transit', category: 'Travel & Commute', suggestedType: 'expense' },

  // Shopping
  { pattern: /(AMAZON|AMZN)/i, merchantName: 'Amazon', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /FLIPKART/i, merchantName: 'Flipkart', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /MYNTRA/i, merchantName: 'Myntra', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /MEESHO/i, merchantName: 'Meesho', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /AJIO/i, merchantName: 'Ajio', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /NYKAA/i, merchantName: 'Nykaa', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /(ZARA|H&M|UNIQLO|MAX\s*FASHION|LIFESTYLE)/i, merchantName: 'Fashion Apparel', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /DECATHLON/i, merchantName: 'Decathlon', category: 'Shopping', suggestedType: 'expense' },
  { pattern: /TATA\s*CLIQ/i, merchantName: 'Tata CLiQ', category: 'Shopping', suggestedType: 'expense' },

  // Entertainment
  { pattern: /NETFLIX/i, merchantName: 'Netflix', category: 'Entertainment', suggestedType: 'expense' },
  { pattern: /SPOTIFY/i, merchantName: 'Spotify', category: 'Entertainment', suggestedType: 'expense' },
  { pattern: /(PRIME\s*VIDEO|HOTSTAR|DISNEY|SONYLIV|ZEE5)/i, merchantName: 'Streaming Video', category: 'Entertainment', suggestedType: 'expense' },
  { pattern: /(BOOKMYSHOW|BMS|PVR|INOX|CINEPOLIS)/i, merchantName: 'Cinema & Events', category: 'Entertainment', suggestedType: 'expense' },
  { pattern: /(YOUTUBE|APPLE\s*SERVICES|APPLE\.COM|ITUNES)/i, merchantName: 'Digital Media', category: 'Entertainment', suggestedType: 'expense' },

  // Subscriptions & Technology
  { pattern: /(GOOGLE|GSUITE|GOOGLE\s*STORAGE|GOOGLE\s*ONE)/i, merchantName: 'Google Services', category: 'Subscriptions', suggestedType: 'expense' },
  { pattern: /(MICROSOFT|MSFT|OFFICE365)/i, merchantName: 'Microsoft', category: 'Subscriptions', suggestedType: 'expense' },
  { pattern: /(OPENAI|CHATGPT)/i, merchantName: 'OpenAI ChatGPT', category: 'Subscriptions', suggestedType: 'expense' },
  { pattern: /(GITHUB|NOTION|CANVA|ADOBE|ZOOM|FIGMA)/i, merchantName: 'Software Subscription', category: 'Subscriptions', suggestedType: 'expense' },
  { pattern: /(AWS|AMAZON\s*WEB\s*SERVICES|DIGITALOCEAN|CLOUDFLARE)/i, merchantName: 'Cloud & Hosting', category: 'Subscriptions', suggestedType: 'expense' },

  // Fuel
  { pattern: /(PETROL|DIESEL|FUEL|INDIANOIL|IOCL|HPCL|HINDUSTAN\s*PETROL|BPCL|BHARAT\s*PETROL|SHELL)/i, merchantName: 'Fuel Station', category: 'Fuel', suggestedType: 'expense' },

  // Utilities & Bills
  { pattern: /(AIRTEL|JIO|VODAFONE|VI\s*PREPAID|ACT\s*CORP|ACT\s*FIBERNET|TATA\s*PLAY)/i, merchantName: 'Telecom & Internet', category: 'Utilities', suggestedType: 'expense' },
  { pattern: /(BESCOM|TATA\s*POWER|ADANI\s*ELEC|ELECTRICITY|MAHANAGAR\s*GAS|IGL|WATER\s*BOARD)/i, merchantName: 'Utility Bill', category: 'Utilities', suggestedType: 'expense' },

  // Health & Medical
  { pattern: /(APOLLO|PHARMEASY|NETMEDS|1MG|MEDPLUS|HOSPITAL|PHARMACY|CLINIC|PRACTO)/i, merchantName: 'Healthcare & Medical', category: 'Healthcare', suggestedType: 'expense' },

  // Investments
  { pattern: /(ZERODHA|GROWW|UPSTOX|KUVERA|COIN|MUTUAL\s*FUND|NPS|PPF|NSE|BSE|KFINTECH|CAMS)/i, merchantName: 'Investment / Brokerage', category: 'Investments', suggestedType: 'expense' },

  // Education
  { pattern: /(COURSERA|UDEMY|UNACADEMY|BYJU|SCHOOL|COLLEGE|TUITION)/i, merchantName: 'Education & Learning', category: 'Education', suggestedType: 'expense' },
];

/**
 * Extracts a cleaner merchant name from raw bank statement narrations.
 * E.g., "UPI/DR/4321908123/SWIGGY/HDFC/Pay" -> "SWIGGY"
 */
export function extractMerchantFromNarration(narration: string): string {
  if (!narration) return 'General';

  const clean = narration.trim();

  // Check UPI format: UPI/DR/.../MERCHANT/... or UPI/CR/...
  const upiMatch = clean.match(/UPI\/(?:DR|CR)\/\d+\/([^\/]+)/i);
  if (upiMatch && upiMatch[1]) {
    const rawMerchant = upiMatch[1].trim();
    // if raw merchant has @ or number, strip it
    return rawMerchant.replace(/@.*/, '').replace(/\b(?:PAY|BILL|ORDER)\b/gi, '').trim() || rawMerchant;
  }

  // Check POS format: POS 412345 MERCHANT CITY
  const posMatch = clean.match(/POS\s+\d*\s*([A-Za-z0-9\s]+?)(?:\s+(?:BANGALORE|MUMBAI|DELHI|PUNE|HYDERABAD|CHENNAI|KOLKATA|IN|IND))?$/i);
  if (posMatch && posMatch[1]) {
    return posMatch[1].trim();
  }

  // Check NEFT/IMPS format: NEFT-xxx-NAME- or IMPS/P2A/xxx/NAME
  const neftMatch = clean.match(/(?:NEFT|IMPS)[-\/][A-Za-z0-9]+[-\/]([A-Za-z0-9\s]+)/i);
  if (neftMatch && neftMatch[1]) {
    return neftMatch[1].trim();
  }

  // Fallback: take first 4 words or up to 35 chars
  return clean.split(/[\/\-_]/)[0].trim().slice(0, 35) || 'Unknown';
}

/**
 * Categorize a transaction using custom merchant mappings first,
 * then falling back to built-in rules, and finally default categories.
 */
export function categorizeTransaction(
  description: string,
  userMappings: MerchantMapping[] = [],
  amountType: 'debit' | 'credit' = 'debit'
): CleanMerchantResult {
  const desc = (description || '').toUpperCase();

  // 1. Check user override rules first
  for (const mapping of userMappings) {
    if (mapping.pattern && desc.includes(mapping.pattern.toUpperCase())) {
      let suggestedType = mapping.defaultType;
      if (!suggestedType) {
        if (amountType === 'credit' && (desc.includes('REFUND') || desc.includes('REVERSAL') || desc.includes('CASHBACK') || desc.includes('RVSL'))) {
          suggestedType = 'refund';
        } else if (desc.includes('TRF') || desc.includes('TRANSFER')) {
          suggestedType = 'transfer';
        } else {
          suggestedType = amountType === 'credit' ? 'income' : 'expense';
        }
      }

      return {
        merchantName: mapping.merchantName || mapping.pattern,
        category: mapping.category,
        suggestedType,
      };
    }
  }

  // 2. Check built-in rule catalog
  for (const rule of DEFAULT_MERCHANT_RULES) {
    if (rule.pattern.test(desc)) {
      return {
        merchantName: rule.merchantName,
        category: rule.category,
        suggestedType: rule.suggestedType || (amountType === 'credit' ? 'income' : 'expense'),
      };
    }
  }

  // 3. Fallback extraction
  const merchantName = extractMerchantFromNarration(description);
  
  if (amountType === 'credit') {
    return {
      merchantName: merchantName || 'Income Credit',
      category: 'Other Income',
      suggestedType: 'income',
    };
  }

  return {
    merchantName: merchantName || 'General Expense',
    category: 'Other Expenses',
    suggestedType: 'expense',
  };
}
