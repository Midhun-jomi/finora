import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { POST as previewPost } from '../src/app/api/import/preview/route';
import { POST as confirmPost } from '../src/app/api/import/confirm/route';
import { GET as accountsGet, POST as accountsPost } from '../src/app/api/accounts/route';
import { GET as analyticsGet } from '../src/app/api/analytics/route';
import { GET as historyGet, DELETE as historyDelete } from '../src/app/api/import-history/route';
import { readDatabase, writeDatabase } from '../src/lib/db';

describe('Finora End-to-End Statement Import & Financial Pipeline', () => {
  const sampleDir = path.join(__dirname, '../sample-statements');
  const sbiCsv = fs.readFileSync(path.join(sampleDir, 'sbi_statement.csv'), 'utf-8');

  beforeEach(() => {
    // Reset database to clean state
    const db = readDatabase();
    db.transactions = [];
    db.importHistory = [];
    writeDatabase(db);
  });

  it('Executes the complete 10-step workflow via Next.js API handlers', async () => {
    // Step 1: Fetch accounts
    const accRes = await accountsGet();
    const accData = await accRes.json();
    expect(accData.accounts.length).toBeGreaterThan(0);
    const targetAccount = accData.accounts[0];
    const initialBalance = targetAccount.currentBalance;

    // Step 2, 3, 4, 5: Preview CSV statement
    const previewReq = new Request('http://localhost:3000/api/import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: targetAccount.id,
        csvContent: sbiCsv,
      }),
    });

    const previewRes = await previewPost(previewReq);
    expect(previewRes.status).toBe(200);
    const previewData = await previewRes.json();
    expect(previewData.success).toBe(true);
    expect(previewData.previews.length).toBe(6);

    // Verify auto-categorization
    const swiggyRow = previewData.previews.find((p: any) => p.description.includes('SWIGGY'));
    expect(swiggyRow.category).toBe('Food & Dining');
    expect(swiggyRow.type).toBe('expense');

    const salaryRow = previewData.previews.find((p: any) => p.description.includes('SALARY'));
    expect(salaryRow.category).toBe('Salary & Income');
    expect(salaryRow.type).toBe('income');

    const transferRow = previewData.previews.find((p: any) => p.description.includes('SELF TRANSFER'));
    expect(transferRow.type).toBe('transfer');

    // Step 9 & 10: Confirm import
    const confirmReq = new Request('http://localhost:3000/api/import/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: targetAccount.id,
        fileName: 'sbi_statement.csv',
        transactions: previewData.previews,
      }),
    });

    const confirmRes = await confirmPost(confirmReq);
    expect(confirmRes.status).toBe(200);
    const confirmData = await confirmRes.json();
    expect(confirmData.success).toBe(true);
    expect(confirmData.importedCount).toBe(6);

    // Verify Account Balance calculation:
    // Initial + 75000 (salary) + 150 (refund) - 450 (swiggy) - 280 (uber) - 1500 (petrol) - 5000 (transfer out)
    const expectedBalanceChange = 75000 + 150 - 450 - 280 - 1500 - 5000;
    expect(confirmData.accountUpdatedBalance).toBe(initialBalance + expectedBalanceChange);

    // Verify Analytics & KPIs update (for the statement month 2024-11)
    const analyticsRes = await analyticsGet(new Request('http://localhost:3000/api/analytics?date=2024-11-10'));
    const analyticsData = await analyticsRes.json();
    const kpis = analyticsData.kpis;

    expect(kpis.monthlyIncome).toBe(75000);
    // Expenses = Swiggy(450) + Uber(280) + Petrol(1500) - Refund(150) = 2080
    // (Transfer 5000 is excluded from expense!)
    expect(kpis.monthlyExpense).toBe(2080);
    expect(kpis.recentImportedCount).toBe(6);

    // Verify Duplicate Detection on re-upload
    const rePreviewReq = new Request('http://localhost:3000/api/import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: targetAccount.id,
        csvContent: sbiCsv,
      }),
    });

    const rePreviewRes = await previewPost(rePreviewReq);
    const rePreviewData = await rePreviewRes.json();
    // All 6 should now be flagged as duplicates!
    expect(rePreviewData.stats.duplicateCount).toBe(6);
    expect(rePreviewData.previews.every((p: any) => p.isDuplicate)).toBe(true);

    // Verify Import History
    const historyRes = await historyGet();
    const historyData = await historyRes.json();
    expect(historyData.importHistory.length).toBe(1);
    expect(historyData.importHistory[0].fileName).toBe('sbi_statement.csv');

    // Verify Rollback
    const rollbackBatchId = historyData.importHistory[0].id;
    const rollbackRes = await historyDelete(
      new Request(`http://localhost:3000/api/import-history?id=${rollbackBatchId}`)
    );
    const rollbackData = await rollbackRes.json();
    expect(rollbackData.success).toBe(true);
    expect(rollbackData.deletedCount).toBe(6);

    // After rollback, transactions should be 0 and account balance restored
    const afterRollbackAnalytics = await analyticsGet(new Request('http://localhost:3000/api/analytics'));
    const afterData = await afterRollbackAnalytics.json();
    expect(afterData.kpis.monthlyExpense).toBe(0);
    expect(afterData.kpis.monthlyIncome).toBe(0);
  });
});
