# UTTARKUNTH COMMERCIAL HOST PARTNERSHIP AGREEMENT

**Document Identifier:** UTTARKUNTH-HOST-AGREEMENT-2026.1  
**Version:** 2026.1  
**Effective Date:** 2026-01-01  
**Platform Domain:** https://uttarkunth.com  
**Platform Contact:** info@uttarkunth.com  

---

### PREAMBLE & RECITALS

This Commercial Host Partnership Agreement ("Agreement") establishes the terms and conditions governing the commercial relationship between **Uttarkunth** ("Platform", "Uttarkunth Platform") and the verified host or authorized property representative ("Host", "Partner") for the accommodation property designated in the accompanying commercial schedule ("Property").

WHEREAS, Uttarkunth operates a curated platform celebrating Himalayan stays, local communities, artisanal heritage, and cultural productions across Uttarakhand; and

WHEREAS, the Host owns, manages, or is legally authorized to offer guest accommodations at the Property and desires to receive verified booking requests through the Platform;

NOW, THEREFORE, the parties agree as follows:

---

### 1. PLATFORM OPERATING MODEL & RESERVATION PROTOCOL

1.1. **Host-Approval Reservation Flow:** All stay booking requests initiated by guests through the Platform operate on an explicit host-approval model. A booking request is non-binding until formally reviewed and accepted by the Host.

1.2. **Direct Tariff Settlement:** All guest room tariff payments are settled directly between the guest and the Host upon check-in or check-out (via cash, direct Unified Payments Interface [UPI], or other host-accepted direct payment channels). Uttarkunth does not process online guest tariff payments, does not collect room funds into platform escrow, and does not hold guest deposits.

1.3. **Reservation Fulfillment:** Once a booking request is accepted by the Host, the reservation becomes confirmed. The Host is legally and contractually obligated to honor the reservation, reserve the specified room units, and provide accommodation at the confirmed tariff estimate.

---

### 2. BILATERAL COMMISSION STRUCTURE & SETTLEMENT

2.1. **Zero Commission Default:** In the absence of an active, verified, and bilaterally accepted Commercial Host Partnership Agreement, the platform commission rate is strictly 0.00% (zero percent), and the estimated Host payout equals 100.00% of the gross booking tariff estimate.

2.2. **Contracted Commission Terms:** Upon formal acceptance of this Agreement, the platform commission rate is governed strictly by the commercial parameters recorded in the Agreement schedule:
- **Introductory Commission Rate:** Where designated in the schedule, a promotional commission percentage (`intro_commission_percent`) applies to all stay bookings confirmed during the introductory duration (`intro_period_months`) commencing from `agreement_start`.
- **Standard Commission Rate:** Following the conclusion of the introductory period (or in agreements where no introductory rate is designated), the standard commission percentage (`standard_commission_percent` or `commission_percent`) applies to all stay bookings confirmed during the agreement term.

2.3. **Historical Snapshot Integrity:** For every confirmed booking, the applicable commission percentage snapshot (`commission_percent_snapshot`) and computed commission amount snapshot (`commission_amount_snapshot`) are calculated and permanently frozen in the booking record. The Host payout estimate is derived as `total_estimate - commission_amount_snapshot`. These values remain immutable across subsequent modifications or cancellations.

2.4. **Platform Fee Settlement:** Platform commission fees are invoiced periodically based on confirmed completed stays. Commission settlement between the Host and Uttarkunth is administered as a distinct commercial transaction separate from guest check-in collections.

---

### 3. HOST RESPONSIBILITIES & OPERATIONAL STANDARDS

3.1. **Inventory & Availability Management:** The Host agrees to maintain real-time, accurate availability calendars on the Platform. The Host shall promptly record manual blocks for maintenance, personal occupancy, or external reservations to prevent double-booking.

3.2. **Hospitality & Safety Standards:** The Host agrees to maintain clean, hygienic, and safe accommodation premises; provide authentic Himalayan hospitality; respect local customs and quiet hours; and practice environmental stewardship (including strict avoidance of single-use plastic disposal and responsible waste management).

3.3. **Truth in Representation:** The Host warrants that all listed descriptions, photographs, room features, pricing, amenities, and location representations are accurate and not misleading.

---

### 4. DIGITAL ACCEPTANCE, CRYPTOGRAPHIC DIGEST & IMMUTABILITY

4.1. **Authorized Signatory:** This Agreement must be accepted by the primary verified host of the property or an explicitly pre-designated legal signatory recorded on the agreement draft. Acceptance by unassigned or unauthorized third parties is void and rejected by database integrity constraints.

4.2. **Cryptographic Integrity Digest:** Acceptance requires the generation and database verification of a 64-character lowercase SHA-256 cryptographic digest binding the exact commercial parameters, property identifier, signatory identity, validity dates, base version (`2026.1`), and the authoritative hash of this terms document.

4.3. **Post-Acceptance Immutability:** Upon formal acceptance, all commercial terms, validity windows, signatory assignments, and acceptance timestamps become permanently immutable. Neither party nor platform administrators may alter accepted commercial terms. Any adjustment of commission rates or commercial structures requires the drafting and bilateral execution of a successor agreement.

---

### 5. DURATION, TERMINATION & TERMINAL STATES

5.1. **Term:** This Agreement becomes effective on `agreement_start` upon completed acceptance and remains in force until `agreement_end`, or until superseded or formally terminated.

5.2. **Supersession:** This Agreement may be superseded by a new agreement version mutually executed by the Host and Uttarkunth, whereupon this Agreement transitions to the `superseded` terminal state.

5.3. **Formal Bilateral Termination:** Either party may terminate this Agreement upon written commercial notice. Termination becomes legally effective when recorded with non-null `terminated_at` timestamp, authorized actor identity (`terminated_by`), and explicit recorded justification (`termination_reason`).

5.4. **Terminal State Invariant:** Agreements in `superseded`, `terminated`, or `ended` status are in permanent terminal states and cannot be reactivated, edited, or re-drafted. Existing historical booking snapshots confirmed under the Agreement remain valid and protected.

---

### 6. GOVERNING LAW & JURISDICTION

6.1. **Governing Law:** This Agreement shall be governed by, construed, and enforced in accordance with the laws of the Republic of India.

6.2. **Jurisdiction:** Any dispute, claim, or controversy arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts having jurisdiction over the State of Uttarakhand, India.
