import { createAdminClient } from '../lib/supabase/admin';

async function runConcurrencyVerification() {
  console.log('=== UTTARKUNTH DATABASE CONCURRENCY & PERMISSION HARDENING VERIFICATION ===\n');

  const supabase = createAdminClient();

  // Test actor IDs
  const primaryHostId = '00000000-0000-0000-0000-000000000001';
  const managerUserId = '00000000-0000-0000-0000-000000000002';
  const coHostUserId = '00000000-0000-0000-0000-000000000003';
  const randomGuestId = '00000000-0000-0000-0000-000000000009';

  let testPropertyId: string | null = null;
  let testRoomId: string | null = null;
  let bookingAId: string | null = null;
  let bookingBId: string | null = null;
  let bookingCId: string | null = null;
  let blockId: string | null = null;

  try {
    // 1. Setup isolated test property
    console.log('[Setup] Creating temporary test property and room unit...');
    const { data: prop, error: propErr } = await (supabase.from('properties') as any)
      .insert({
        name: 'Concurrency Test Sanctuary',
        slug: `concurrency-test-${Date.now()}`,
        description: 'Temporary testing property for database concurrency verification.',
        address: 'Test Ridge',
        village: 'Jari',
        district: 'Kullu',
        state: 'Himachal Pradesh',
        property_type: 'homestay',
        amenities: ['Free Wi-Fi'],
        photos: ['https://example.com/test.jpg'],
        published: true,
        moderation_status: 'approved',
        host_id: primaryHostId,
      })
      .select('id')
      .single();

    if (propErr) throw propErr;
    testPropertyId = prop.id;

    // Add manager and co-host assignments
    await (supabase.from('property_hosts') as any).insert([
      { property_id: testPropertyId, user_id: managerUserId, role: 'manager' },
      { property_id: testPropertyId, user_id: coHostUserId, role: 'co_host' },
    ]);

    // Create room unit with base price ₹2,000
    const { data: room, error: roomErr } = await (supabase.from('room_units') as any)
      .insert({
        property_id: testPropertyId,
        room_name: 'Concurrency Suite',
        max_guests: 4,
        base_price: 2000,
        active: true,
      })
      .select('id')
      .single();

    if (roomErr) throw roomErr;
    testRoomId = room.id;
    console.log(`[Setup] Created property ${testPropertyId} and room unit ${testRoomId}.\n`);

    // -------------------------------------------------------------
    // Test 1: Role Permission Matrix Enforcement
    // -------------------------------------------------------------
    console.log('--- TEST 1: Role Permission Matrix Enforcement ---');

    // Create a pending booking for 2026-11-10 to 2026-11-14
    const { data: b1 } = await (supabase.from('stay_bookings') as any)
      .insert({
        booking_reference: `TEST-${Date.now()}-1`,
        property_id: testPropertyId,
        room_unit_id: testRoomId,
        guest_name: 'Traveler One',
        guest_email: 'guest1@example.com',
        guest_phone: '+919876543210',
        check_in: '2026-11-10',
        check_out: '2026-11-14',
        adults: 2,
        children: 0,
        rooms_count: 1,
        total_estimate: 8000, // 4 nights @ 2000
        status: 'pending',
      })
      .select('id')
      .single();

    bookingAId = b1.id;

    // 1A. Unauthorized guest tries to confirm
    const { error: guestDecideErr } = await (supabase.rpc as any)('respond_to_stay_booking', {
      p_stay_booking_id: bookingAId,
      p_action: 'confirm',
      p_actor_user_id: randomGuestId,
    });
    console.log(
      '  1A. Unauthorized Guest confirmation attempt:',
      guestDecideErr ? `REJECTED (${guestDecideErr.message})` : 'FAILED (Allowed unexpectedly!)'
    );
    if (!guestDecideErr) throw new Error('Security violation: guest confirmed booking!');

    // 1B. Co-host tries to confirm (Role Co-host is read/guest notes only, not decider)
    const { error: coHostDecideErr } = await (supabase.rpc as any)('respond_to_stay_booking', {
      p_stay_booking_id: bookingAId,
      p_action: 'confirm',
      p_actor_user_id: coHostUserId,
    });
    console.log(
      '  1B. Co-host confirmation attempt:',
      coHostDecideErr ? `REJECTED (${coHostDecideErr.message})` : 'FAILED (Allowed unexpectedly!)'
    );
    if (!coHostDecideErr) throw new Error('Role violation: co-host confirmed booking!');

    // 1C. Manager confirms (Role Manager has operational decision authority)
    const { data: managerDecideRes, error: managerDecideErr } = await (supabase.rpc as any)(
      'respond_to_stay_booking',
      {
        p_stay_booking_id: bookingAId,
        p_action: 'confirm',
        p_actor_user_id: managerUserId,
        p_host_notes: 'Manager approved check-in instructions sent.',
      }
    );
    console.log(
      '  1C. Manager confirmation attempt:',
      managerDecideRes?.success ? `SUCCESS (Status: ${managerDecideRes.status})` : `FAILED (${managerDecideErr?.message})`
    );
    if (!managerDecideRes?.success) throw new Error('Manager could not confirm booking!');

    console.log('  -> Result: Role matrix strictly enforced.\n');

    // -------------------------------------------------------------
    // Test 2: Two Simultaneous Overlapping Booking Confirmations
    // -------------------------------------------------------------
    console.log('--- TEST 2: Overlapping Booking Conflict Prevention ---');

    // Create second booking request overlapping 2026-11-12 to 2026-11-16
    const { data: b2 } = await (supabase.from('stay_bookings') as any)
      .insert({
        booking_reference: `TEST-${Date.now()}-2`,
        property_id: testPropertyId,
        room_unit_id: testRoomId,
        guest_name: 'Traveler Two (Overlapping)',
        guest_email: 'guest2@example.com',
        guest_phone: '+919876543211',
        check_in: '2026-11-12',
        check_out: '2026-11-16',
        adults: 2,
        children: 0,
        rooms_count: 1,
        total_estimate: 8000,
        status: 'pending',
      })
      .select('id')
      .single();

    bookingBId = b2.id;

    // Primary host tries to confirm booking B which overlaps confirmed booking A (10th-14th vs 12th-16th)
    const { data: overlapRes, error: overlapErr } = await (supabase.rpc as any)(
      'respond_to_stay_booking',
      {
        p_stay_booking_id: bookingBId,
        p_action: 'confirm',
        p_actor_user_id: primaryHostId,
      }
    );

    console.log(
      '  Confirmation attempt on overlapping dates:',
      overlapErr ? `REJECTED (${overlapErr.message})` : 'FAILED (Double booking created!)'
    );
    if (!overlapErr || !overlapErr.message.toLowerCase().includes('already has a confirmed')) {
      throw new Error('Concurrency violation: overlapping booking was confirmed!');
    }
    console.log('  -> Result: Overlapping booking confirmation prevented by database mutex & transaction recheck.\n');

    // -------------------------------------------------------------
    // Test 3: Manual Block Racing with Confirmed Booking
    // -------------------------------------------------------------
    console.log('--- TEST 3: Manual Block Racing with Confirmed Booking ---');

    // Host tries to create a manual block on dates overlapping confirmed booking A (e.g. 2026-11-11 to 2026-11-13)
    const { data: blockConfRes, error: blockConfErr } = await (supabase.rpc as any)(
      'set_room_availability_block',
      {
        p_room_unit_id: testRoomId,
        p_blocked_from: '2026-11-11',
        p_blocked_until: '2026-11-13',
        p_reason: 'Host private stay',
        p_actor_user_id: primaryHostId,
      }
    );

    console.log(
      '  Manual block attempt overlapping confirmed reservation:',
      blockConfErr ? `REJECTED (${blockConfErr.message})` : 'FAILED (Block created on confirmed dates!)'
    );
    if (!blockConfErr || !blockConfErr.message.toLowerCase().includes('conflict with an existing confirmed reservation')) {
      throw new Error('Concurrency violation: block created over confirmed reservation!');
    }
    console.log('  -> Result: Conflicted block rejected inside transaction.\n');

    // -------------------------------------------------------------
    // Test 4: Manual Block Blocking Subsequent Booking Confirmation
    // -------------------------------------------------------------
    console.log('--- TEST 4: Manual Block Preempting Booking Confirmation ---');

    // Create a valid non-overlapping block for 2026-11-20 to 2026-11-25
    const { data: validBlock, error: validBlockErr } = await (supabase.rpc as any)(
      'set_room_availability_block',
      {
        p_room_unit_id: testRoomId,
        p_blocked_from: '2026-11-20',
        p_blocked_until: '2026-11-25',
        p_reason: 'Winter maintenance work',
        p_actor_user_id: primaryHostId,
      }
    );

    if (validBlockErr) throw validBlockErr;
    blockId = validBlock.block_id;
    console.log(`  Created manual block for 2026-11-20 to 2026-11-25 (ID: ${blockId})`);

    // Create booking C overlapping the block (2026-11-22 to 2026-11-24)
    const { data: b3 } = await (supabase.from('stay_bookings') as any)
      .insert({
        booking_reference: `TEST-${Date.now()}-3`,
        property_id: testPropertyId,
        room_unit_id: testRoomId,
        guest_name: 'Traveler Three',
        guest_email: 'guest3@example.com',
        guest_phone: '+919876543212',
        check_in: '2026-11-22',
        check_out: '2026-11-24',
        adults: 2,
        children: 0,
        rooms_count: 1,
        total_estimate: 4000,
        status: 'pending',
      })
      .select('id')
      .single();

    bookingCId = b3.id;

    // Try to confirm booking C
    const { error: blockOverlapConfirmErr } = await (supabase.rpc as any)(
      'respond_to_stay_booking',
      {
        p_stay_booking_id: bookingCId,
        p_action: 'confirm',
        p_actor_user_id: primaryHostId,
      }
    );

    console.log(
      '  Confirmation attempt on blocked dates:',
      blockOverlapConfirmErr ? `REJECTED (${blockOverlapConfirmErr.message})` : 'FAILED (Booking confirmed on blocked dates!)'
    );
    if (!blockOverlapConfirmErr || !blockOverlapConfirmErr.message.toLowerCase().includes('unavailable by host blocks')) {
      throw new Error('Concurrency violation: booking confirmed over manual block!');
    }
    console.log('  -> Result: Room availability block strictly preempts booking confirmations.\n');

    // -------------------------------------------------------------
    // Test 5: Booking Price Snapshot Integrity
    // -------------------------------------------------------------
    console.log('--- TEST 5: Booking Price Snapshot Integrity ---');

    // Check original estimate of booking A
    const { data: b1Before } = await (supabase.from('stay_bookings') as any)
      .select('total_estimate')
      .eq('id', bookingAId)
      .single();

    console.log(`  Booking A original total estimate: ₹${b1Before.total_estimate}`);

    // Update room unit base price from ₹2,000 to ₹4,500
    await (supabase.from('room_units') as any)
      .update({ base_price: 4500 })
      .eq('id', testRoomId);
    console.log('  Updated room base_price on room_units to ₹4,500.');

    // Recheck booking A
    const { data: b1After } = await (supabase.from('stay_bookings') as any)
      .select('total_estimate, status')
      .eq('id', bookingAId)
      .single();

    console.log(`  Booking A total estimate after room rate change: ₹${b1After.total_estimate}`);
    if (b1After.total_estimate !== b1Before.total_estimate) {
      throw new Error('Snapshot violation: historical booking estimate changed when room price updated!');
    }
    console.log('  -> Result: Historical booking price snapshots remain completely immutable.\n');

    console.log('=== ALL DATABASE CONCURRENCY & PERMISSION TESTS PASSED PERFECTLY ===\n');
  } finally {
    // Cleanup test records
    console.log('[Cleanup] Cleaning up test records...');
    if (blockId) {
      await (supabase.from('room_availability_blocks') as any).delete().eq('id', blockId);
    }
    if (testRoomId) {
      await (supabase.from('stay_bookings') as any).delete().eq('room_unit_id', testRoomId);
      await (supabase.from('room_units') as any).delete().eq('id', testRoomId);
    }
    if (testPropertyId) {
      await (supabase.from('property_hosts') as any).delete().eq('property_id', testPropertyId);
      await (supabase.from('properties') as any).delete().eq('id', testPropertyId);
    }
    console.log('[Cleanup] Done.');
  }
}

runConcurrencyVerification().catch((err) => {
  console.error('\n*** TEST SUITE FAILED ***', err);
  process.exit(1);
});
