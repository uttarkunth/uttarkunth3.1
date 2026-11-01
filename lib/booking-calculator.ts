import { COMMISSION_CONFIG } from './constants.ts';

export interface PriceBreakdown {
  nights: number;
  basePricePerNight: number;
  roomTotal: number;
  cleaningFee: number;
  taxes: number;
  totalEstimate: number;
  formattedTotal: string;
}

export function calculateNights(checkInStr: string, checkOutStr: string): number {
  if (!checkInStr || !checkOutStr) return 0;
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  // Normalize to UTC midnight to avoid DST or timezone drifts
  const utc1 = Date.UTC(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
  const utc2 = Date.UTC(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());

  const diffMs = utc2 - utc1;
  const nights = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
}

export function validateStayDates(checkInStr: string, checkOutStr: string): { valid: boolean; error?: string } {
  if (!checkInStr || !checkOutStr) {
    return { valid: false, error: "Both check-in and check-out dates are required." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(checkInStr);
  checkIn.setHours(0, 0, 0, 0);

  const checkOut = new Date(checkOutStr);
  checkOut.setHours(0, 0, 0, 0);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { valid: false, error: "Invalid calendar date format." };
  }

  if (checkIn < today) {
    return { valid: false, error: "Check-in date cannot be in the past." };
  }

  if (checkOut <= checkIn) {
    return { valid: false, error: "Check-out date must be strictly after check-in." };
  }

  const nights = calculateNights(checkInStr, checkOutStr);
  if (nights > 60) {
    return { valid: false, error: "Bookings cannot exceed 60 nights." };
  }

  return { valid: true };
}

export function calculateBookingPrice(
  basePricePerNight: number,
  checkInStr: string,
  checkOutStr: string,
  extraCleaningFee: number = 0
): PriceBreakdown {
  const nights = calculateNights(checkInStr, checkOutStr);
  const roomTotal = Math.round(basePricePerNight * nights);
  const totalEstimate = roomTotal + extraCleaningFee;

  return {
    nights,
    basePricePerNight,
    roomTotal,
    cleaningFee: extraCleaningFee,
    taxes: 0, // No hidden taxes or invented platform fees
    totalEstimate,
    formattedTotal: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(totalEstimate)
  };
}

export function isDateConflict(
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string
): boolean {
  // Check-out is an exclusive boundary!
  // Conflict exists if existingStart < newEnd AND existingEnd > newStart
  const eStart = new Date(existingStart).getTime();
  const eEnd = new Date(existingEnd).getTime();
  const nStart = new Date(newStart).getTime();
  const nEnd = new Date(newEnd).getTime();

  return eStart < nEnd && eEnd > nStart;
}

export function generateBookingReference(): string {
  // Matches regex: ^UK-[A-F0-9]{20}$
  const chars = '0123456789ABCDEF';
  let rand = '';
  for (let i = 0; i < 20; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UK-${rand}`;
}
