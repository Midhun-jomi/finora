/**
 * RBI ACCOUNT AGGREGATOR (AA) ARCHITECTURE SPECIFICATION
 * 
 * In accordance with RBI guidelines for NBFC-AA:
 * Providers (e.g. OneMoney, Finvu, Setu, Anumati) act as consent managers between
 * Financial Information Users (FIU - Finora) and Financial Information Providers (FIP - Banks).
 *
 * This module defines a provider-independent contract so when ready,
 * a licensed AA SDK can plug in directly without altering transactions or accounts models.
 */

export type AAProviderName = 'OneMoney' | 'Finvu' | 'Setu';

export type ConsentStatus = 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'REJECTED';

export interface AAConsentRequest {
  consentHandle: string;
  fiuId: string;
  customerVpa: string; // e.g. 9876543210@onemoney
  accountTypes: string[]; // ['SAVINGS', 'CURRENT', 'DEPOSIT']
  dateRange: {
    from: string;
    to: string;
  };
  dataFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
  consentExpiry: string;
}

export interface AAConsentResponse {
  consentId: string;
  status: ConsentStatus;
  approvalUrl?: string; // Webview URL where user approves via OTP on AA app
  createdAt: string;
}

export interface AAFetchDataResult {
  fipId: string; // Bank Identifier (e.g., HDFC, SBIN)
  maskedAccountNumber: string;
  transactions: Array<{
    txnId: string;
    date: string;
    narration: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    balance: number;
    reference: string;
  }>;
}

/**
 * Universal Interface that all future AA providers will implement
 */
export interface BankSyncProvider {
  readonly providerName: AAProviderName;
  readonly isProductionReady: boolean;

  /** Initiates an AA consent request */
  initiateConsent(req: AAConsentRequest): Promise<AAConsentResponse>;

  /** Checks status of a previously initiated consent */
  getConsentStatus(consentId: string): Promise<ConsentStatus>;

  /** Fetches encrypted financial data once consent is active */
  fetchFinancialData(consentId: string): Promise<AAFetchDataResult[]>;

  /** Revokes a granted consent */
  revokeConsent(consentId: string): Promise<boolean>;
}

/**
 * Future AA Integration Service Registry
 */
export class AccountAggregatorRegistry {
  private static providers: Map<AAProviderName, BankSyncProvider> = new Map();

  public static registerProvider(provider: BankSyncProvider) {
    this.providers.set(provider.providerName, provider);
  }

  public static getProvider(name: AAProviderName): BankSyncProvider | undefined {
    return this.providers.get(name);
  }

  public static listAvailableProviders(): Array<{
    name: AAProviderName;
    status: 'Coming Soon' | 'Ready';
    rbiRegistration: string;
    description: string;
  }> {
    return [
      {
        name: 'OneMoney',
        status: 'Coming Soon',
        rbiRegistration: 'RBI NBFC-AA License N-14.03456',
        description: 'First licensed NBFC-Account Aggregator in India supporting all major private and public banks.',
      },
      {
        name: 'Finvu',
        status: 'Coming Soon',
        rbiRegistration: 'RBI NBFC-AA License N-13.02198',
        description: 'Secure open banking consent gateway trusted by Indian financial institutions.',
      },
      {
        name: 'Setu',
        status: 'Coming Soon',
        rbiRegistration: 'RBI NBFC-AA Authorized Gateway',
        description: 'Next-gen Account Aggregator API infrastructure by Pine Labs.',
      },
    ];
  }
}

