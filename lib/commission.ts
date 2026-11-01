import { COMMISSION_CONFIG } from './constants.ts';

export interface CommissionSnapshot {
  percent: number;
  amount: number;
  isIntroductory: boolean;
}

export function computeCommission(
  totalEstimate: number,
  agreementStartDate?: string | null,
  introMonths: number = COMMISSION_CONFIG.introMonths,
  introRate: number = COMMISSION_CONFIG.introRate,
  standardRate: number = COMMISSION_CONFIG.standardRate
): CommissionSnapshot {
  if (!agreementStartDate) {
    // If no agreement date exists, fallback to standard or 0 until verified
    return {
      percent: introRate,
      amount: 0,
      isIntroductory: true
    };
  }

  const start = new Date(agreementStartDate);
  const now = new Date();

  // Add intro months to agreement start date
  const introEndDate = new Date(start);
  introEndDate.setMonth(introEndDate.getMonth() + introMonths);

  const isIntroductory = now < introEndDate;
  const percent = isIntroductory ? introRate : standardRate;
  const amount = Math.round((totalEstimate * percent) / 100);

  return {
    percent,
    amount,
    isIntroductory
  };
}
