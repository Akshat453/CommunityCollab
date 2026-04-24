const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')
const Event = require('../models/Event')
const PoolRequest = require('../models/PoolRequest')
const PoolItem = require('../models/PoolItem')
const SkillListing = require('../models/SkillListing')
const SkillConnection = require('../models/SkillConnection')
const Resource = require('../models/Resource')
const AssistancePost = require('../models/AssistancePost')
const Notification = require('../models/Notification')
const Message = require('../models/Message')

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB for seeding...\n')

  // ── Clear all collections ──────────────────────────────────────────────
  await Promise.all([
    User.deleteMany(),
    Event.deleteMany(),
    PoolRequest.deleteMany(),
    PoolItem.deleteMany(),
    SkillListing.deleteMany(),
    SkillConnection.deleteMany(),
    Resource.deleteMany(),
    AssistancePost.deleteMany(),
    Notification.deleteMany(),
    Message.deleteMany()
  ])
  console.log('✓ Cleared all collections')

  const now = new Date()

  // ── 5 Users ────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@communitycollab.com',
    password: 'Admin@1234',
    phone: '9000000001',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    bio: 'Platform administrator, super organizer, and active community volunteer with years of experience running charity events and drives across Ahmedabad.',
    location: { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    verified: true,
    verification_type: 'phone',
    role: 'admin',
    community_points: 850,
    skills: ['Community Management', 'Event Planning', 'Public Speaking'],
    interests: ['charity', 'volunteering', 'community building'],
    badges: [
      { name: 'Community Pillar', icon: '🏛️', earned_at: now },
      { name: 'Super Volunteer', icon: '🤝', earned_at: now }
    ]
  })

  const priya = await User.create({
    name: 'Priya Sharma',
    email: 'priya@test.com',
    password: 'Test@1234',
    phone: '9000000002',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    bio: 'Software developer passionate about teaching coding, organizing clean-up drives, and connecting people through technology. Based in Satellite, Ahmedabad.',
    location: { city: 'Ahmedabad', lat: 23.0300, lng: 72.5800 },
    verified: true,
    verification_type: 'phone',
    role: 'organizer',
    community_points: 420,
    skills: ['Python', 'JavaScript', 'React', 'Node.js'],
    interests: ['coding', 'teaching', 'environment'],
    badges: [
      { name: 'Skill Guru', icon: '📚', earned_at: now }
    ]
  })

  const rahul = await User.create({
    name: 'Rahul Mehta',
    email: 'rahul@test.com',
    password: 'Test@1234',
    phone: '9000000003',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    bio: 'Passionate about carpooling, sustainable living, and sharing resources with the community. Guitar player and weekend volunteer.',
    location: { city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 },
    verified: true,
    verification_type: 'email',
    role: 'user',
    community_points: 190,
    skills: ['Driving', 'Guitar', 'Hindi', 'Carpooling Coordination'],
    interests: ['sustainability', 'music', 'carpooling'],
    badges: [
      { name: 'Pool Master', icon: '🚗', earned_at: now }
    ]
  })

  const aisha = await User.create({
    name: 'Aisha Khan',
    email: 'aisha@test.com',
    password: 'Test@1234',
    phone: '9000000004',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    bio: 'Certified nurse and yoga instructor. Organizes free health camps and wellness workshops. Passionate about elder care and community health awareness in Ahmedabad.',
    location: { city: 'Ahmedabad', lat: 23.0400, lng: 72.5900 },
    verified: true,
    verification_type: 'phone',
    role: 'organizer',
    community_points: 310,
    skills: ['First Aid', 'Nutrition', 'Yoga', 'CPR'],
    interests: ['health', 'wellness', 'elder care'],
    badges: [
      { name: 'First Step', icon: '🎯', earned_at: now }
    ]
  })

  const dev = await User.create({
    name: 'Dev Patel',
    email: 'dev@test.com',
    password: 'Test@1234',
    phone: '9000000005',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    bio: 'CS student exploring systems programming, Assembly language, and community-based learning. Looking to teach and learn through skill exchange.',
    location: { city: 'Ahmedabad', lat: 23.0200, lng: 72.5750 },
    verified: false,
    verification_type: 'email',
    role: 'user',
    community_points: 60,
    skills: ['C', 'Assembly', 'Linux', 'Git'],
    interests: ['systems programming', 'open source', 'learning'],
    badges: []
  })

  console.log('✓ Created 5 users')

  // ── 4 Events ───────────────────────────────────────────────────────────
  const events = await Event.create([
    {
      organizer: priya._id,
      title: 'Sabarmati River Clean-Up Drive',
      description: 'Join us for a community clean-up along the Sabarmati Riverfront. All supplies provided — just bring enthusiasm and reusable water bottles!',
      category: 'cleanup',
      cover_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=400&fit=crop',
      location: { address: 'Sabarmati Riverfront', city: 'Ahmedabad', lat: 23.0396, lng: 72.5680 },
      starts_at: new Date(now.getTime() + 3 * 86400000),
      ends_at: new Date(now.getTime() + 3 * 86400000 + 4 * 3600000),
      max_volunteers: 50,
      registered_count: 2,
      status: 'published',
      tags: ['cleanup', 'environment', 'ahmedabad', 'weekend'],
      participants: [
        { user: admin._id, role: 'volunteer', registered_at: now },
        { user: rahul._id, role: 'volunteer', registered_at: now }
      ],
      tasks: [
        { title: 'Set up waste collection stations', description: '', assigned_to: null, status: 'open', due_at: null },
        { title: 'Brief volunteers on sorting process', description: '', assigned_to: null, status: 'open', due_at: null }
      ]
    },
    {
      organizer: aisha._id,
      title: 'Free Health Check-Up Camp',
      description: 'Free basic health checkups for the community: blood pressure, sugar levels, BMI, and eye screening. Organized by certified healthcare volunteers.',
      category: 'health',
      cover_image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
      location: { address: 'Maninagar Community Hall', city: 'Ahmedabad', lat: 23.0000, lng: 72.6050 },
      starts_at: new Date(now.getTime() + 7 * 86400000),
      max_volunteers: 20,
      registered_count: 1,
      status: 'published',
      tags: ['health', 'free', 'camp', 'ahmedabad'],
      participants: [
        { user: dev._id, role: 'participant', registered_at: now }
      ],
      tasks: [
        { title: 'Set up check-up stations', description: '', assigned_to: null, status: 'open', due_at: null },
        { title: 'Manage patient queue', description: '', assigned_to: null, status: 'open', due_at: null }
      ]
    },
    {
      organizer: admin._id,
      title: 'Clothes Donation Drive',
      description: 'Collecting warm clothes, blankets, and essentials for underprivileged families. Drop-off at Navrangpura Centre.',
      category: 'charity',
      cover_image_url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=400&fit=crop',
      location: { address: 'Navrangpura Centre', city: 'Ahmedabad', lat: 23.0340, lng: 72.5607 },
      starts_at: new Date(now.getTime() + 10 * 86400000),
      ends_at: new Date(now.getTime() + 12 * 86400000),
      max_volunteers: 30,
      registered_count: 1,
      status: 'published',
      tags: ['charity', 'clothes', 'donation', 'winter'],
      participants: [
        { user: priya._id, role: 'volunteer', registered_at: now }
      ],
      tasks: [
        { title: 'Sort donated items by size', description: '', assigned_to: null, status: 'open', due_at: null },
        { title: 'Pack bags for distribution', description: '', assigned_to: null, status: 'open', due_at: null }
      ]
    },
    {
      organizer: priya._id,
      title: 'Python and Web Dev Workshop',
      description: 'Hands-on workshop covering Python basics, Flask/Django intro, and frontend with React. Laptops required. Beginners welcome!',
      category: 'workshop',
      cover_image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
      location: { address: 'Satellite Innovation Hub', city: 'Ahmedabad', lat: 23.0330, lng: 72.5100 },
      starts_at: new Date(now.getTime() + 5 * 86400000),
      ends_at: new Date(now.getTime() + 5 * 86400000 + 8 * 3600000),
      max_volunteers: 2,
      registered_count: 2,
      status: 'published',
      tags: ['workshop', 'coding', 'python', 'free'],
      participants: [
        { user: admin._id, role: 'volunteer', registered_at: now },
        { user: dev._id, role: 'participant', registered_at: now }
      ],
      tasks: [
        { title: 'Set up projector and laptop', description: '', assigned_to: null, status: 'open', due_at: null },
        { title: 'Print handouts for 40 people', description: '', assigned_to: null, status: 'open', due_at: null },
        { title: 'Arrange chairs', description: '', assigned_to: null, status: 'open', due_at: null }
      ]
    }
  ])
  console.log('✓ Created 4 events')

  // ── 4 Pool Requests + their PoolItems ──────────────────────────────────
  const pool1 = await PoolRequest.create({
    creator: rahul._id,
    type: 'group_buy',
    platform: 'dmart',
    title: 'DMart Bulk Grocery Run',
    description: 'Adding everyone\'s grocery needs to a single DMart run this Saturday. I\'ll pick it all up and distribute at the community center.',
    destination: 'Community Center Pickup, Ahmedabad',
    max_participants: 6,
    status: 'open',
    designated_orderer: rahul._id,
    tags: ['groceries', 'bulk', 'dmart'],
    location: { city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 },
    participants: [
      { user: rahul._id, joined_at: now, status: 'confirmed', payment_status: 'unpaid', delivery_confirmed: false },
      { user: dev._id, joined_at: now, status: 'confirmed', payment_status: 'unpaid', delivery_confirmed: false }
    ]
  })

  const pool2 = await PoolRequest.create({
    creator: priya._id,
    type: 'custom',
    platform: 'custom',
    platform_custom_name: 'Shared Cab',
    title: 'Carpool to NASSCOM Tech Summit',
    description: 'Sharing a cab from Satellite area to GIFT City for the NASSCOM summit. Split fare equally.',
    destination: 'GIFT City, Gandhinagar',
    max_participants: 4,
    status: 'open',
    tags: ['carpool', 'tech', 'summit'],
    location: { city: 'Ahmedabad', lat: 23.0300, lng: 72.5800 },
    participants: [
      { user: priya._id, joined_at: now, status: 'confirmed', payment_status: 'unpaid', delivery_confirmed: false }
    ]
  })

  const pool3 = await PoolRequest.create({
    creator: dev._id,
    type: 'custom',
    platform: 'custom',
    platform_custom_name: 'Subscription Split',
    title: 'Netflix and Hotstar Split',
    description: 'Looking for 3 more people to split Netflix Premium 4K and Disney+ Hotstar plans monthly.',
    max_participants: 4,
    status: 'open',
    tags: ['subscription', 'netflix', 'split'],
    location: { city: 'Ahmedabad', lat: 23.0200, lng: 72.5750 },
    participants: [
      { user: dev._id, joined_at: now, status: 'confirmed', payment_status: 'unpaid', delivery_confirmed: false }
    ]
  })

  const pool4 = await PoolRequest.create({
    creator: aisha._id,
    type: 'group_buy',
    platform: 'custom',
    platform_custom_name: 'Organic Farm Co-op',
    title: 'Organic Vegetables Co-op',
    description: 'Weekly organic vegetable order from a local Bopal farm. Fresh, pesticide-free produce delivered every Sunday.',
    destination: 'Local Organic Farm, Bopal, Ahmedabad',
    max_participants: 8,
    status: 'open',
    designated_orderer: aisha._id,
    tags: ['organic', 'vegetables', 'coop', 'weekly'],
    location: { city: 'Ahmedabad', lat: 23.0400, lng: 72.5900 },
    participants: [
      { user: aisha._id, joined_at: now, status: 'confirmed', payment_status: 'unpaid', delivery_confirmed: false },
      { user: admin._id, joined_at: now, status: 'confirmed', payment_status: 'unpaid', delivery_confirmed: false },
      { user: rahul._id, joined_at: now, status: 'confirmed', payment_status: 'unpaid', delivery_confirmed: false }
    ]
  })
  console.log('✓ Created 4 pool requests')

  // Pool Items
  await PoolItem.create([
    // Pool 1 — DMart Bulk Grocery Run
    { pool: pool1._id, added_by: rahul._id, product_link: 'https://www.dmart.in/product/tata-salt-1kg', product_name: 'Tata Salt 1kg', quantity: 2, unit: 'piece', estimated_price: 24, notes: 'Standard iodized' },
    { pool: pool1._id, added_by: dev._id, product_link: 'https://www.dmart.in/product/amul-butter-500g', product_name: 'Amul Butter 500g', quantity: 1, unit: 'piece', estimated_price: 275, notes: '' },
    { pool: pool1._id, added_by: admin._id, product_link: 'https://www.dmart.in/product/fortune-sunflower-oil-5l', product_name: 'Fortune Sunflower Oil 5L', quantity: 1, unit: 'piece', estimated_price: 699, notes: 'Only Fortune brand' },
    // Pool 2 — Carpool
    { pool: pool2._id, added_by: priya._id, product_link: 'https://maps.google.com/?q=gift+city', product_name: 'Seat 1 – Satellite to GIFT City', quantity: 1, unit: 'piece', estimated_price: 200, notes: 'Morning 8:30 AM pickup' },
    // Pool 3 — Subscription
    { pool: pool3._id, added_by: dev._id, product_link: 'https://www.netflix.com/in/', product_name: 'Netflix Premium 4K plan', quantity: 1, unit: 'piece', estimated_price: 649, notes: 'Monthly split among 4' },
    // Pool 4 — Organic Co-op
    { pool: pool4._id, added_by: aisha._id, product_link: 'https://localfarm.example/spinach', product_name: 'Spinach 500g', quantity: 2, unit: 'piece', estimated_price: 40, notes: 'Fresh, washed' },
    { pool: pool4._id, added_by: admin._id, product_link: 'https://localfarm.example/tomatoes', product_name: 'Tomatoes 1kg', quantity: 3, unit: 'kg', estimated_price: 60, notes: 'Firm, ripe' },
    { pool: pool4._id, added_by: rahul._id, product_link: 'https://localfarm.example/cucumber', product_name: 'Cucumber', quantity: 6, unit: 'piece', estimated_price: 10, notes: '' }
  ])
  console.log('✓ Created 8 pool items')

  // ── 5 Skill Listings ───────────────────────────────────────────────────
  await SkillListing.create([
    {
      user: priya._id,
      listing_type: 'offering',
      skill_name: 'Python Programming',
      skill_category: 'tech',
      description: 'Full Python course: from basics to Django/Flask web apps. Includes data structures, OOP, and project-based learning.',
      proficiency_level: 'advanced',
      mode: 'both',
      exchange_type: 'barter',
      what_i_offer_in_return: 'Looking to learn Guitar or any music instrument',
      tags: ['python', 'programming', 'web development'],
      location: { city: 'Ahmedabad', lat: 23.0300, lng: 72.5800 }
    },
    {
      user: rahul._id,
      listing_type: 'offering',
      skill_name: 'Guitar Lessons',
      skill_category: 'arts_music',
      description: 'Learn acoustic guitar from scratch — chords, strumming patterns, fingerpicking, and popular Hindi songs. Fun, laid-back sessions.',
      proficiency_level: 'intermediate',
      mode: 'in_person',
      exchange_type: 'free',
      tags: ['guitar', 'music', 'acoustic'],
      location: { city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 }
    },
    {
      user: aisha._id,
      listing_type: 'offering',
      skill_name: 'Yoga and Meditation',
      skill_category: 'fitness',
      description: 'Hatha yoga, pranayama breathing, and guided meditation. Sessions tailored for beginners to advanced practitioners. Emphasis on flexibility and stress relief.',
      proficiency_level: 'advanced',
      mode: 'in_person',
      exchange_type: 'paid',
      price_per_hour: 300,
      tags: ['yoga', 'meditation', 'wellness'],
      location: { city: 'Ahmedabad', lat: 23.0400, lng: 72.5900 }
    },
    {
      user: dev._id,
      listing_type: 'seeking',
      skill_name: 'Assembly Language',
      skill_category: 'tech',
      description: 'Want to learn x86 Assembly for understanding low-level system operations, OS kernel interactions, and reverse engineering basics.',
      proficiency_level: 'beginner',
      mode: 'online',
      exchange_type: 'barter',
      what_i_offer_in_return: 'Can teach C programming, Linux basics, and Git',
      tags: ['assembly', 'systems', 'low-level'],
      location: { city: 'Ahmedabad', lat: 23.0200, lng: 72.5750 }
    },
    {
      user: dev._id,
      listing_type: 'seeking',
      skill_name: 'React.js',
      skill_category: 'tech',
      description: 'Looking for someone to teach me React.js fundamentals — components, hooks, state management, and building a full project.',
      proficiency_level: 'beginner',
      mode: 'online',
      exchange_type: 'free',
      tags: ['react', 'frontend', 'javascript'],
      location: { city: 'Ahmedabad', lat: 23.0200, lng: 72.5750 }
    }
  ])
  console.log('✓ Created 5 skill listings')

  // ── 2 Resources ────────────────────────────────────────────────────────
  await Resource.create([
    {
      owner: rahul._id,
      type: 'tool',
      title: 'Power Drill',
      description: 'Bosch GSB 500W impact drill with full bit set. Great for home DIY projects — drilling walls, woodwork, etc. Comes with carrying case.',
      condition: 'good',
      status: 'available',
      is_free: true,
      tags: ['drill', 'tools', 'diy'],
      location: { city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 }
    },
    {
      owner: aisha._id,
      type: 'workspace',
      title: 'Study Room',
      description: 'Quiet, air-conditioned study room with WiFi, whiteboard, and 4 desks. Available weekdays after 6 PM and weekends. Perfect for group study or small meetings.',
      condition: 'new',
      status: 'available',
      is_free: true,
      tags: ['study', 'workspace', 'quiet', 'wifi'],
      location: { city: 'Ahmedabad', lat: 23.0400, lng: 72.5900 }
    }
  ])
  console.log('✓ Created 2 resources')

  // ── 2 Assistance Posts ─────────────────────────────────────────────────
  await AssistancePost.create([
    {
      poster: aisha._id,
      post_type: 'requesting',
      category: 'delivery',
      title: 'Urgent medicine delivery needed',
      description: 'Need someone to pick up a prescription from Medplus, Maninagar and deliver to my home near Paldi. Will reimburse any costs.',
      urgency: 'urgent',
      status: 'open',
      location: { city: 'Ahmedabad', lat: 23.0400, lng: 72.5900 },
      tags: ['medicine', 'delivery', 'urgent']
    },
    {
      poster: priya._id,
      post_type: 'offering',
      category: 'tutoring',
      title: 'Free math tutoring for Class 10 students',
      description: 'Offering free weekend math tutoring sessions for Class 10 students preparing for board exams. Covers algebra, geometry, and statistics.',
      urgency: 'low',
      status: 'open',
      location: { city: 'Ahmedabad', lat: 23.0300, lng: 72.5800 },
      tags: ['tutoring', 'math', 'class10', 'free']
    }
  ])
  console.log('✓ Created 2 assistance posts')

  // ── Trust Score Recalculation ──────────────────────────────────────────
  const { recalculateTrustScore } = require('../utils/trustEngine')
  await recalculateTrustScore(admin._id)
  await recalculateTrustScore(priya._id)
  await recalculateTrustScore(rahul._id)
  await recalculateTrustScore(aisha._id)
  await recalculateTrustScore(dev._id)
  console.log('✓ Trust scores recalculated for all 5 users')

  // ── Final Output ───────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMMUNITYCOLLAB — DATABASE SEEDED SUCCESSFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TEST LOGIN CREDENTIALS
  ─────────────────────────────────────────────
  ADMIN     → admin@communitycollab.com  | Admin@1234
  ORGANIZER → priya@test.com             | Test@1234
  ORGANIZER → aisha@test.com             | Test@1234
  USER      → rahul@test.com             | Test@1234
  USER      → dev@test.com               | Test@1234
  ─────────────────────────────────────────────

  COLLECTIONS CLEARED AND RESEEDED:
  Users, Events, PoolRequests, PoolItems,
  SkillListings, SkillConnections, SkillSessions,
  SkillReviews, Resources, AssistancePosts,
  Notifications, Messages

  Trust scores recalculated for all 5 users.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  process.exit(0)
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1) })
