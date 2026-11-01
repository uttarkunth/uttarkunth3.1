import { z } from 'zod';

export const BookingRequestSchema = z.object({
  property_id: z.string().uuid("Invalid property identifier"),
  room_unit_id: z.string().uuid("Invalid room identifier"),
  guest_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  guest_email: z.string().trim().email("Please provide a valid email address"),
  guest_phone: z.string().trim().min(7, "Phone number is too short").max(20, "Phone number is too long"),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in must be YYYY-MM-DD"),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out must be YYYY-MM-DD"),
  adults: z.coerce.number().int().min(1, "At least 1 adult is required").max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
  special_requests: z.string().trim().max(500).optional().default(""),
}).refine(data => data.check_out > data.check_in, {
  message: "Check-out date must be after check-in date",
  path: ["check_out"]
});

export type BookingRequestInput = z.infer<typeof BookingRequestSchema>;

export const HostDecisionSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  action: z.enum(["confirm", "decline", "cancel"]),
  host_notes: z.string().trim().max(500).optional(),
});

export type HostDecisionInput = z.infer<typeof HostDecisionSchema>;

export const PropertyFormSchema = z.object({
  name: z.string().trim().min(3, "Property name must be at least 3 characters").max(120),
  description: z.string().trim().min(20, "Please provide a descriptive overview (at least 20 chars)").max(2000),
  address: z.string().trim().min(5, "Address is required"),
  village: z.string().trim().min(2, "Village is required"),
  district: z.string().trim().min(2, "District is required").default("Kullu"),
  state: z.string().trim().min(2).default("Himachal Pradesh"),
  property_type: z.enum(["homestay", "hotel", "resort", "villa", "guesthouse", "cottage", "other"]),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  rooms: z.array(z.object({
    room_name: z.string().trim().min(2, "Room name is required"),
    description: z.string().trim().optional(),
    max_guests: z.coerce.number().int().min(1).max(10).default(2),
    base_price: z.coerce.number().min(100, "Price must be at least ₹100"),
    active: z.boolean().default(true),
  })).min(1, "At least one room type must be added"),
});

export type PropertyFormInput = z.infer<typeof PropertyFormSchema>;

export const SearchFilterSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().int().min(1).max(20).optional().default(1),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type SearchFilterInput = z.infer<typeof SearchFilterSchema>;
