import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FilmmakerApplicationSchema,
  ProductionProposalSchema,
  CommunityParticipationSchema,
  CommunityStorySubmissionSchema,
} from '../lib/validations.ts';
import {
  BRAND,
  AUTHENTIC_PRODUCTIONS,
  COMMUNITY_INITIATIVES,
  COMMUNITY_STORIES,
  EXISTING_PROPERTIES,
  PRODUCT_CATEGORIES,
} from '../lib/constants.ts';

test('Phase 2G: Filmmaker Application Schema Validation', () => {
  // Valid application
  const validApp = {
    full_name: 'Anand Thakur',
    email: 'anand@himalayanfilms.org',
    phone: '+91 98160 12345',
    location: 'Naggar, Kullu Valley',
    creative_role: 'director',
    skills: ['4K/6K Field Cinematography', 'Ambient Mountain Audio Recording'],
    portfolio_url: 'https://vimeo.com/himalayandocs',
    bio: 'Independent documentary director focusing on high-altitude transhumance and pastoralist oral ballads for over eight years.',
    collaboration_interests: ['Co-Production Grant / Co-Financing', 'On-Ground Village Access & Homestay Base in Parvati Valley'],
  };

  const res = FilmmakerApplicationSchema.safeParse(validApp);
  assert.equal(res.success, true, 'Valid application must pass schema');

  // Invalid email
  const invalidEmail = { ...validApp, email: 'not-an-email' };
  assert.equal(FilmmakerApplicationSchema.safeParse(invalidEmail).success, false);

  // Too short bio (< 20 chars)
  const shortBio = { ...validApp, bio: 'Short bio' };
  assert.equal(FilmmakerApplicationSchema.safeParse(shortBio).success, false);

  // Empty skills array
  const noSkills = { ...validApp, skills: [] };
  assert.equal(FilmmakerApplicationSchema.safeParse(noSkills).success, false);
});

test('Phase 2G: Production Proposal Schema Validation', () => {
  const validProposal = {
    title: 'Echoes of the Cedar Glade',
    category: 'documentary',
    synopsis: 'An intimate observation of sacred deodar tree rituals in the upper hamlets of Parvati Valley.',
    concept: 'Filmed over four seasons, following three village elders as they maintain the centuries-old tradition of consecrating cedar groves before winter snows.',
    proposed_location: 'Upper Jari & Manikaran Hamlets, Parvati Valley',
    cultural_relevance: 'Preserves indigenous ecological ethics and traditional forest ownership models that predate modern forestry departments.',
    support_needed: ['On-Ground Village Access & Homestay Base in Parvati Valley', 'Festival Circuit Submission & Digital Archiving on Uttarkunth'],
    estimated_budget: 350000,
    portfolio_links: ['https://vimeo.com/example'],
  };

  const res = ProductionProposalSchema.safeParse(validProposal);
  assert.equal(res.success, true, 'Valid proposal must pass schema');

  // Negative budget
  const negBudget = { ...validProposal, estimated_budget: -100 };
  assert.equal(ProductionProposalSchema.safeParse(negBudget).success, false);

  // Invalid category
  const badCategory = { ...validProposal, category: 'hollywood_blockbuster' };
  assert.equal(ProductionProposalSchema.safeParse(badCategory).success, false);
});

test('Phase 2H: Community Participation Schema Validation', () => {
  const validPart = {
    initiative_slug: 'kath-kuni-conservation',
    full_name: 'Priya Joshi',
    email: 'priya.joshi@design.in',
    phone: '+91 94180 56789',
    skills: 'Architectural documentation, measured drawings, photogrammetry',
    duration: '1 month',
    motivation: 'I want to document vanishing earthquake-resilient interlocking timber techniques before concrete replaces them completely.',
  };

  const res = CommunityParticipationSchema.safeParse(validPart);
  assert.equal(res.success, true, 'Valid community participation application must pass');

  // Missing motivation (< 20 chars)
  const shortMotivation = { ...validPart, motivation: 'Just want to visit' };
  assert.equal(CommunityParticipationSchema.safeParse(shortMotivation).success, false);
});

test('Phase 2H: Community Story Submission & Consent Enforcement', () => {
  const validStory = {
    author_name: 'Sunil Negi',
    author_role: 'Village Elder & Carpenter',
    village: 'Jari',
    valley: 'Parvati Valley',
    title: 'How We Read the Timber Rings',
    excerpt: 'An elder explains why only naturally fallen cedar trees were used for temple cornerstones.',
    content: 'In the old days, our elders taught us that a tree that still yearns to touch the sky must never be felled. Only timber granted by the winter avalanches holds the balance needed for Kath-Kuni corner beams.',
    consent_given: true,
  };

  const res = CommunityStorySubmissionSchema.safeParse(validStory);
  assert.equal(res.success, true, 'Valid story with explicit consent must pass');

  // Attempting submission without consent must fail
  const unconsented = { ...validStory, consent_given: false };
  const unconsentedRes = CommunityStorySubmissionSchema.safeParse(unconsented);
  assert.equal(unconsentedRes.success, false, 'Unconsented story submission must be strictly rejected');
});

test('Phase 2I: Four Pillars Ecosystem Integrity', () => {
  // Brand invariants
  assert.equal(BRAND.name, 'Uttarkunth');
  assert.equal(BRAND.officialDomain, 'https://uttarkunth.com');
  assert.equal(BRAND.contactEmail, 'info@uttarkunth.com');

  // Pillar 1: Stays
  assert.equal(EXISTING_PROPERTIES.length, 1, 'Exactly 1 live property in Jari');
  assert.equal(EXISTING_PROPERTIES[0].slug, 'yash-home-stay');

  // Pillar 2: Products
  assert.equal(PRODUCT_CATEGORIES.length >= 8, true, 'Curated product categories registered');

  // Pillar 3: Productions
  assert.equal(AUTHENTIC_PRODUCTIONS.length, 2, 'Exactly 2 authentic productions in catalog');
  assert.equal(AUTHENTIC_PRODUCTIONS[0].slug, 'aaj-ka-devta');
  assert.equal(AUTHENTIC_PRODUCTIONS[1].slug, 'ruk-gayi-gupt-bali');

  // Pillar 4: Community
  assert.equal(COMMUNITY_INITIATIVES.length, 9, 'Exactly 9 proposed grassroots initiatives');
  for (const init of COMMUNITY_INITIATIVES) {
    assert.equal(init.outcomes.length, 0, 'No fabricated field outcomes in proposed initiatives');
  }
  assert.equal(COMMUNITY_STORIES.length, 0, 'No fabricated field stories in static archive');
});
