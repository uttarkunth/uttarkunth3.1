'use client';

import React, { useState, useMemo } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import {
  computeHostDashboardKpis,
  computeMonthlyValueSeries,
  computeReviewDistribution,
  filterRecordsByProperty,
  formatInrCurrency,
  getBookingEstimatedValue,
  getBookingNights,
  getBookingStatus,
  getPropertyDisplayName,
  type HostBookingRecord,
  type HostPropertyRecord,
  type HostReviewRecord,
} from '@/lib/host-dashboard';

interface PerformanceInsightsClientProps {
  initialProperties: HostPropertyRecord[];
  initialBookings: HostBookingRecord[];
  initialReviews: HostReviewRecord[];
}

export function PerformanceInsightsClient({
  initialProperties,
  initialBookings,
  initialReviews,
}: PerformanceInsightsClientProps) {
  const { selectedPropertyId } = useHostWorkspace();
  const [monthsPeriod, setMonthsPeriod] = useState<3 | 6 | 12>(6);

  const kpis = useMemo(
    () => computeHostDashboardKpis(initialProperties, initialBookings, selectedPropertyId),
    [initialProperties, initialBookings, selectedPropertyId]
  );

  const scopedBookings = useMemo(
    () => filterRecordsByProperty(initialBookings, selectedPropertyId),
    [initialBookings, selectedPropertyId]
  );

  const monthlySeries = useMemo(
    () => computeMonthlyValueSeries(initialBookings, monthsPeriod, selectedPropertyId),
    [initialBookings, monthsPeriod, selectedPropertyId]
  );

  const totalRequests = scopedBookings.length;
  const confirmedAndCompleted = kpis.confirmedStaysCount + kpis.completedStaysCount;
  const confirmedPct =
    totalRequests > 0 ? Math.round((confirmedAndCompleted / totalRequests) * 100) : 0;
  const pendingPct =
    totalRequests > 0 ? Math.round((kpis.pendingRequestsCount / totalRequests) * 100) : 0;
  const declinedPct =
    totalRequests > 0 ? Math.round((kpis.declinedOrCancelledCount / totalRequests) * 100) : 0;

  // Build SVG polyline & area path from monthlySeries
  const chartGeometry = useMemo(() => {
    const width = 560;
    const height = 136;
    const topPad = 18;
    const bottomY = 128;
    const maxVal = Math.max(1000, ...monthlySeries.map((m) => m.confirmedValue));

    const pts = monthlySeries.map((pt, idx) => {
      const x =
        monthlySeries.length === 1
          ? width / 2
          : Math.round((idx / (monthlySeries.length - 1)) * (width - 28) + 14);
      const ratio = pt.confirmedValue / maxVal;
      const y = Math.round(bottomY - ratio * (bottomY - topPad));
      return { x, y, ...pt };
    });

    const polylinePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPath =
      pts.length > 0
        ? `M${pts[0].x},${pts[0].y} ` +
          pts
            .slice(1)
            .map((p) => `L${p.x},${p.y}`)
            .join(' ') +
          ` L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`
        : '';

    return { pts, polylinePoints, areaPath };
  }, [monthlySeries]);

  // Property comparison rows
  const propertyRows = useMemo(() => {
    const propsToCompare =
      selectedPropertyId === 'all'
        ? initialProperties
        : initialProperties.filter((p) => p.id === selectedPropertyId);

    return propsToCompare.map((prop) => {
      const propBookings = initialBookings.filter((b) => b.property_id === prop.id);
      let confirmedCount = 0;
      let roomNights = 0;
      let estValue = 0;

      for (const b of propBookings) {
        const s = getBookingStatus(b);
        if (s === 'confirmed' || s === 'completed') {
          confirmedCount += 1;
          roomNights += getBookingNights(b);
          estValue += getBookingEstimatedValue(b);
        }
      }

      const revDist = computeReviewDistribution(initialReviews, prop.id);
      return {
        id: prop.id,
        title: getPropertyDisplayName(prop),
        confirmedCount,
        roomNights,
        estValue,
        averageRating: revDist.averageRating,
        totalReviews: revDist.totalReviews,
      };
    });
  }, [initialProperties, initialBookings, initialReviews, selectedPropertyId]);

  const handleExportSummary = () => {
    const headers = [
      'Property',
      'Confirmed Stays',
      'Room Nights Booked',
      'Estimated Confirmed Value (INR)',
      'Guest Rating',
    ];
    const rows = propertyRows.map((r) => [
      `"${r.title.replace(/"/g, '""')}"`,
      String(r.confirmedCount),
      String(r.roomNights),
      String(r.estValue),
      r.totalReviews > 0 ? `${r.averageRating} (${r.totalReviews})` : 'No reviews yet',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uttarkunth-host-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" data-testid="host-performance-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
            <span>Host Workspace</span>
            <span>/</span>
            <span>Insights</span>
            <span>/</span>
            <strong className="text-[#263D32]">Performance &amp; Insights</strong>
          </div>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
            Performance &amp; Insights
          </h1>
          <p className="text-[13px] text-[#665E52] mt-0.5">
            Track booking trends, room nights and estimated confirmed booking value across your properties.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            aria-label="Select insights time period"
            value={monthsPeriod}
            onChange={(e) => setMonthsPeriod(Number(e.target.value) as 3 | 6 | 12)}
            className="px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32] cursor-pointer"
          >
            <option value={6}>Last 6 months</option>
            <option value={3}>Last 3 months</option>
            <option value={12}>Last 12 months</option>
          </select>

          <button
            type="button"
            onClick={handleExportSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#FFFDF9] hover:bg-[#EFE7D8] text-[#29251F] border border-[#D9CCB8] text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#263D32]" />
            <span>Export summary</span>
          </button>
        </div>
      </div>

      {/* Direct Payment Model Value Explanation */}
      <div className="p-3.5 rounded-[14px] bg-[#E8F4EC] border border-[#1F6A3B]/20 text-[#194E2C] flex items-start gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[#FFFDF9]/75 flex items-center justify-center text-[#1F6A3B] shrink-0 font-bold">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed">
          <strong className="block text-[13px] font-extrabold text-[#194E2C]">
            How booking value is shown
          </strong>
          <span>
            Confirmed booking value is the estimated value of confirmed stays. It is not a payout balance, because guests pay hosts directly at the property.
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Booking requests</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE7E0] text-[#4C473E]">
              Total
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#29251F] tabular-nums leading-none">
            {totalRequests}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            Across selected property scope
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Confirmed stays</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
              {confirmedPct}% rate
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#1F6A3B] tabular-nums leading-none">
            {confirmedAndCompleted}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            Accepted by host
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Room nights booked</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
              Confirmed
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#29251F] tabular-nums leading-none">
            {kpis.bookedRoomNights}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            Locked room nights
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Confirmed booking value</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE7E0] text-[#4C473E]">
              Estimate
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#263D32] tabular-nums leading-none">
            {formatInrCurrency(kpis.estimatedConfirmedValue)}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            Paid directly to host at property
          </div>
        </div>
      </div>

      {/* Confirmed Booking Value Area Chart + Where Bookings Stand */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <section className="lg:col-span-7 p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#29251F]">
                Confirmed Booking Value
              </h2>
              <p className="text-xs text-[#665E52]">
                Monthly estimated value of confirmed stays (paid directly to host)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
              Confirmed stays only
            </span>
          </div>

          <div className="pt-2">
            <svg
              viewBox="0 0 560 150"
              className="w-full h-[160px] overflow-visible"
              aria-label="Confirmed booking value trend"
            >
              <defs>
                <linearGradient id="utkHostAreaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#263D32" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#263D32" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <line x1="0" y1="32" x2="560" y2="32" stroke="#E7DFCE" strokeDasharray="4 4" />
              <line x1="0" y1="78" x2="560" y2="78" stroke="#E7DFCE" strokeDasharray="4 4" />
              <line x1="0" y1="128" x2="560" y2="128" stroke="#E7DFCE" />
              {chartGeometry.areaPath && (
                <path d={chartGeometry.areaPath} fill="url(#utkHostAreaGrad)" />
              )}
              {chartGeometry.polylinePoints && (
                <polyline
                  fill="none"
                  stroke="#263D32"
                  strokeWidth="3"
                  points={chartGeometry.polylinePoints}
                />
              )}
              {chartGeometry.pts.map((pt, idx) => (
                <circle
                  key={pt.monthKey}
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  fill={idx === chartGeometry.pts.length - 1 ? '#C55B23' : '#263D32'}
                >
                  <title>{`${pt.label}: ${formatInrCurrency(pt.confirmedValue)} (${pt.confirmedStays} confirmed stays)`}</title>
                </circle>
              ))}
            </svg>

            <div
              className="grid gap-1 text-center text-[11px] font-bold text-[#665E52] pt-1"
              style={{
                gridTemplateColumns: `repeat(${monthlySeries.length}, minmax(0, 1fr))`,
              }}
            >
              {monthlySeries.map((m) => (
                <div key={m.monthKey} className="truncate">
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">Where Bookings Stand</h2>
            <p className="text-xs text-[#665E52]">
              Current status breakdown of all received requests
            </p>
          </div>

          <div className="space-y-3 my-auto">
            <div className="grid grid-cols-[110px_1fr_44px] items-center gap-2.5 text-xs">
              <span className="font-bold text-[#29251F]">Confirmed</span>
              <div className="h-2.5 rounded-full bg-[#EAE2D3] overflow-hidden">
                <div
                  style={{ width: `${confirmedPct}%` }}
                  className="h-full rounded-full bg-[#1F6A3B]"
                />
              </div>
              <strong className="text-right text-[#29251F] tabular-nums">{confirmedPct}%</strong>
            </div>

            <div className="grid grid-cols-[110px_1fr_44px] items-center gap-2.5 text-xs">
              <span className="font-bold text-[#29251F]">Pending</span>
              <div className="h-2.5 rounded-full bg-[#EAE2D3] overflow-hidden">
                <div
                  style={{ width: `${pendingPct}%` }}
                  className="h-full rounded-full bg-[#C55B23]"
                />
              </div>
              <strong className="text-right text-[#29251F] tabular-nums">{pendingPct}%</strong>
            </div>

            <div className="grid grid-cols-[110px_1fr_44px] items-center gap-2.5 text-xs">
              <span className="font-bold text-[#29251F]">Declined / past</span>
              <div className="h-2.5 rounded-full bg-[#EAE2D3] overflow-hidden">
                <div
                  style={{ width: `${declinedPct}%` }}
                  className="h-full rounded-full bg-[#8D7F6B]"
                />
              </div>
              <strong className="text-right text-[#29251F] tabular-nums">{declinedPct}%</strong>
            </div>
          </div>

          <p className="text-xs text-[#665E52] leading-relaxed">
            Responding promptly to pending requests helps travellers confirm transport and mountain permits.
          </p>
        </section>
      </div>

      {/* Property Comparison Table */}
      <section className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#29251F]">Property Comparison</h2>
          <p className="text-xs text-[#665E52]">
            Compare confirmed stays, booked nights and guest ratings across your properties.
          </p>
        </div>

        <div className="overflow-x-auto border border-[#E5DEC9] rounded-[13px] bg-[#FFFDF9]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F1E7] border-b border-[#E5DEC9] text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#665E52]">
                <th className="py-2.5 px-3">Property</th>
                <th className="py-2.5 px-3">Confirmed Stays</th>
                <th className="py-2.5 px-3">Room Nights</th>
                <th className="py-2.5 px-3">Estimated Value</th>
                <th className="py-2.5 px-3">Guest Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DEC9] text-[13px]">
              {propertyRows.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAF6EE] transition-colors">
                  <td className="py-3 px-3 font-bold text-[#29251F]">{row.title}</td>
                  <td className="py-3 px-3 tabular-nums text-[#29251F]">{row.confirmedCount}</td>
                  <td className="py-3 px-3 tabular-nums text-[#29251F]">
                    {row.roomNights} {row.roomNights === 1 ? 'night' : 'nights'}
                  </td>
                  <td className="py-3 px-3 tabular-nums font-bold text-[#263D32]">
                    {formatInrCurrency(row.estValue)}
                  </td>
                  <td className="py-3 px-3 tabular-nums text-[#29251F]">
                    {row.totalReviews > 0
                      ? `${row.averageRating.toFixed(1)} ★ (${row.totalReviews})`
                      : 'No reviews yet'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
