require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Event = require('../models/Event')
const PoolRequest = require('../models/PoolRequest')
const PoolItem = require('../models/PoolItem')
const SkillListing = require('../models/SkillListing')
const Resource = require('../models/Resource')
const AssistancePost = require('../models/AssistancePost')
const Notification = require('../models/Notification')

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB for seeding...')

  // Clear
  await Promise.all([User.deleteMany(), Event.deleteMany(), PoolRequest.deleteMany(), PoolItem.deleteMany(), SkillListing.deleteMany(), Resource.deleteMany(), AssistancePost.deleteMany(), Notification.deleteMany()])
  console.log('Cleared existing data')

  // Users
  const users = await User.create([
    { name: 'Priya Sharma', email: 'priya@test.com', password: 'Test@1234', bio: 'Community organizer and urban gardening enthusiast. Love bringing people together!', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg', location: { city: 'Seattle, WA', lat: 47.6062, lng: -122.3321 }, verified: true, community_points: 4800, skills: ['gardening', 'event planning', 'web design'], interests: ['sustainability', 'cooking'], role: 'organizer', badges: [{ name: 'Super Volunteer', icon: '🤝', earned_at: new Date() }, { name: 'Community Pillar', icon: '🏛️', earned_at: new Date() }] },
    { name: 'Marcus Chen', email: 'marcus@test.com', password: 'Test@1234', bio: 'Software engineer who loves teaching coding to beginners. Avid cyclist.', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg', location: { city: 'Seattle, WA', lat: 47.6162, lng: -122.3421 }, verified: true, community_points: 3200, skills: ['javascript', 'python', 'cycling'], interests: ['tech', 'fitness'], badges: [{ name: 'Skill Guru', icon: '📚', earned_at: new Date() }] },
    { name: 'Sarah Jenkins', email: 'sarah@test.com', password: 'Test@1234', bio: 'Professional artist and yoga instructor. Passionate about holistic wellness.', avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg', location: { city: 'Seattle, WA', lat: 47.5962, lng: -122.3221 }, verified: true, community_points: 2100, skills: ['painting', 'yoga', 'graphic design'], interests: ['art', 'wellness'] },
    { name: 'David Kim', email: 'david@test.com', password: 'Test@1234', bio: 'Retired teacher giving back to the community through tutoring and mentorship.', avatar_url: 'https://randomuser.me/api/portraits/men/75.jpg', location: { city: 'Seattle, WA', lat: 47.6262, lng: -122.3521 }, verified: false, community_points: 1500, skills: ['tutoring', 'woodworking', 'cooking'], interests: ['education', 'crafts'] },
    { name: 'Elena Rodriguez', email: 'elena@test.com', password: 'Test@1234', bio: 'Environmental scientist and community garden coordinator.', avatar_url: 'https://randomuser.me/api/portraits/women/90.jpg', location: { city: 'Seattle, WA', lat: 47.5862, lng: -122.3121 }, verified: true, community_points: 3600, skills: ['environmental science', 'gardening', 'photography'], interests: ['ecology', 'hiking'], badges: [{ name: 'Eco Warrior', icon: '🌿', earned_at: new Date() }] }
  ])
  console.log('Created 5 users')

  // Events
  const events = await Event.create([
    { organizer: users[0]._id, title: 'Rooftop Urban Gardening', description: 'Learn the art of urban gardening on rooftops. All tools provided! Join us for a hands-on workshop.', category: 'workshop', cover_image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', location: { address: 'Maple St. Community Center', city: 'Seattle, WA', lat: 47.6062, lng: -122.3321 }, starts_at: new Date(Date.now() + 5 * 86400000), ends_at: new Date(Date.now() + 5 * 86400000 + 10800000), max_volunteers: 30, registered_count: 14, status: 'published', tags: ['gardening', 'sustainable', 'workshop'], participants: [{ user: users[1]._id, role: 'volunteer', registered_at: new Date() }, { user: users[2]._id, role: 'participant', registered_at: new Date() }] },
    { organizer: users[1]._id, title: 'Creative Coding Basics', description: 'Introduction to creative coding with p5.js. No experience needed — just bring curiosity and a laptop!', category: 'workshop', cover_image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800', location: { address: 'TechHub Coworking', city: 'Seattle, WA', lat: 47.6162, lng: -122.3421 }, starts_at: new Date(Date.now() + 10 * 86400000), max_volunteers: 18, registered_count: 16, status: 'published', tags: ['coding', 'tech', 'beginner'], participants: [{ user: users[0]._id, role: 'participant', registered_at: new Date() }] },
    { organizer: users[4]._id, title: 'Zero-Waste Community Potluck', description: 'Bring your best dish and zero-waste containers! A celebration of sustainable eating and community bonding.', category: 'social', cover_image_url: 'https://images.unsplash.com/photo-1529543544282-7a407e6539ae?w=800', location: { address: 'Green Valley Park', city: 'Seattle, WA', lat: 47.5862, lng: -122.3121 }, starts_at: new Date(Date.now() + 15 * 86400000), max_volunteers: 50, registered_count: 45, status: 'published', tags: ['sustainability', 'food', 'social'], participants: [{ user: users[0]._id, role: 'volunteer', registered_at: new Date() }, { user: users[3]._id, role: 'participant', registered_at: new Date() }] }
  ])
  console.log('Created 3 events')

  // Pool Requests (new flexible ordering system)
  const pools = await PoolRequest.create([
    {
      creator: users[1]._id,
      type: 'group_buy',
      platform: 'blinkit',
      title: 'Weekly Blinkit Grocery Run',
      description: 'Adding everyone\'s grocery items to a single Blinkit order. Free delivery for orders above ₹499! Add your links and I\'ll place the combined order by Thursday evening.',
      destination: 'Maple St. Community Center',
      scheduled_at: new Date(Date.now() + 2 * 86400000),
      max_participants: 6,
      status: 'open',
      designated_orderer: users[1]._id,
      tags: ['groceries', 'weekly', 'blinkit'],
      location: { city: 'Seattle, WA', lat: 47.6162, lng: -122.3421 },
      participants: [
        { user: users[1]._id, joined_at: new Date(), status: 'confirmed' },
        { user: users[0]._id, joined_at: new Date(), status: 'confirmed' },
        { user: users[3]._id, joined_at: new Date(), status: 'confirmed' }
      ]
    },
    {
      creator: users[0]._id,
      type: 'group_buy',
      platform: 'amazon',
      title: 'Amazon Gardening Tools Order',
      description: 'Bulk ordering gardening tools from Amazon. We get a better deal when ordering multiple items together. Add your tool links!',
      max_participants: 10,
      status: 'open',
      designated_orderer: users[0]._id,
      tags: ['tools', 'garden', 'amazon'],
      location: { city: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
      participants: [
        { user: users[0]._id, joined_at: new Date(), status: 'confirmed' },
        { user: users[2]._id, joined_at: new Date(), status: 'confirmed' },
        { user: users[3]._id, joined_at: new Date(), status: 'confirmed' },
        { user: users[4]._id, joined_at: new Date(), status: 'confirmed' }
      ]
    },
    {
      creator: users[4]._id,
      type: 'group_buy',
      platform: 'dmart',
      title: 'DMart Monthly Essentials',
      description: 'Monthly DMart order for household essentials. Everyone adds their items, I\'ll pick it all up from DMart on Saturday morning.',
      destination: 'Green Valley Park pickup point',
      scheduled_at: new Date(Date.now() + 5 * 86400000),
      max_participants: 8,
      status: 'open',
      designated_orderer: users[4]._id,
      tags: ['essentials', 'monthly', 'dmart'],
      location: { city: 'Seattle, WA', lat: 47.5862, lng: -122.3121 },
      participants: [
        { user: users[4]._id, joined_at: new Date(), status: 'confirmed' },
        { user: users[0]._id, joined_at: new Date(), status: 'confirmed' },
        { user: users[3]._id, joined_at: new Date(), status: 'confirmed' }
      ]
    }
  ])
  console.log('Created 3 pools')

  // Pool Items (seed items for the first two pools)
  await PoolItem.create([
    // Pool 1 — Blinkit Grocery Run
    {
      pool: pools[0]._id,
      added_by: users[1]._id,
      product_link: 'https://blinkit.com/prn/tata-salt/prid/437',
      product_name: 'Tata Salt 1kg',
      quantity: 2,
      unit: 'piece',
      estimated_price: 24,
      notes: 'The standard one, not iodized'
    },
    {
      pool: pools[0]._id,
      added_by: users[0]._id,
      product_link: 'https://blinkit.com/prn/amul-butter/prid/209',
      product_name: 'Amul Butter 500g',
      quantity: 1,
      unit: 'piece',
      estimated_price: 275,
      notes: ''
    },
    {
      pool: pools[0]._id,
      added_by: users[3]._id,
      product_link: 'https://blinkit.com/prn/fortune-sunflower-oil/prid/100',
      product_name: 'Fortune Sunflower Oil 5L',
      quantity: 1,
      unit: 'piece',
      estimated_price: 699,
      notes: 'Only Fortune brand please'
    },
    {
      pool: pools[0]._id,
      added_by: users[0]._id,
      product_link: 'https://blinkit.com/prn/aashirvaad-atta/prid/150',
      product_name: 'Aashirvaad Atta 5kg',
      quantity: 1,
      unit: 'piece',
      estimated_price: 299,
      notes: 'Whole wheat, not multigrain'
    },
    // Pool 2 — Amazon Gardening Tools
    {
      pool: pools[1]._id,
      added_by: users[0]._id,
      product_link: 'https://amazon.in/dp/B08XYZ123',
      product_name: 'Kraft Seeds Gardening Tool Set (5 pieces)',
      quantity: 2,
      unit: 'piece',
      estimated_price: 450,
      notes: 'Need 2 sets for the community garden'
    },
    {
      pool: pools[1]._id,
      added_by: users[2]._id,
      product_link: 'https://amazon.in/dp/B09ABC456',
      product_name: 'TrustBasket Raised Garden Bed',
      quantity: 1,
      unit: 'piece',
      estimated_price: 1899,
      notes: ''
    },
    {
      pool: pools[1]._id,
      added_by: users[4]._id,
      product_link: 'https://amazon.in/dp/B07DEF789',
      product_name: 'Cinagro Organic Potting Mix 10kg',
      quantity: 3,
      unit: 'piece',
      estimated_price: 549,
      notes: 'Organic only, no chemical fertilizers'
    },
    // Pool 3 — DMart Essentials
    {
      pool: pools[2]._id,
      added_by: users[4]._id,
      product_link: 'https://www.dmart.in/product/surf-excel-easy-wash',
      product_name: 'Surf Excel Easy Wash 4kg',
      quantity: 1,
      unit: 'piece',
      estimated_price: 599,
      notes: ''
    },
    {
      pool: pools[2]._id,
      added_by: users[0]._id,
      product_link: 'https://www.dmart.in/product/vim-bar-pack',
      product_name: 'Vim Bar 600g (Pack of 3)',
      quantity: 2,
      unit: 'pack',
      estimated_price: 95,
      notes: ''
    }
  ])
  console.log('Created 9 pool items')

  // Skill Listings
  const skills = await SkillListing.create([
    { user: users[1]._id, listing_type: 'offering', skill_name: 'JavaScript Tutoring', skill_category: 'tech', description: 'Full-stack JS mentorship: React, Node, MongoDB. From zero to deployed apps in 4 weeks.', proficiency_level: 'advanced', mode: 'both', exchange_type: 'barter', what_i_offer_in_return: 'Looking for gardening or cooking lessons', tags: ['javascript', 'react', 'node'], location: { city: 'Seattle, WA', lat: 47.6162, lng: -122.3421 } },
    { user: users[2]._id, listing_type: 'offering', skill_name: 'Watercolor Painting', skill_category: 'arts_music', description: 'Learn the basics of watercolor from landscape to portrait. All materials provided for first session.', proficiency_level: 'advanced', mode: 'in_person', exchange_type: 'free', tags: ['art', 'painting', 'watercolor'], location: { city: 'Seattle, WA', lat: 47.5962, lng: -122.3221 } },
    { user: users[3]._id, listing_type: 'offering', skill_name: 'Woodworking Basics', skill_category: 'trades', description: 'Hands-on woodworking for beginners. Learn to make a birdhouse, cutting board, or bookshelf.', proficiency_level: 'advanced', mode: 'in_person', exchange_type: 'barter', what_i_offer_in_return: 'Would love to learn graphic design', tags: ['woodworking', 'crafts', 'DIY'], location: { city: 'Seattle, WA', lat: 47.6262, lng: -122.3521 } },
    { user: users[0]._id, listing_type: 'seeking', skill_name: 'Photography', skill_category: 'arts_music', description: 'Want to learn portrait and event photography for community events.', proficiency_level: 'beginner', mode: 'both', exchange_type: 'barter', what_i_offer_in_return: 'Can teach event planning and web design', tags: ['photography', 'portrait'], location: { city: 'Seattle, WA', lat: 47.6062, lng: -122.3321 } },
    { user: users[4]._id, listing_type: 'offering', skill_name: 'Environmental Science 101', skill_category: 'academic', description: 'Understanding ecology, sustainability practices, and environmental impact assessment basics.', proficiency_level: 'advanced', mode: 'online', exchange_type: 'free', tags: ['science', 'ecology', 'environment'], location: { city: 'Seattle, WA', lat: 47.5862, lng: -122.3121 } }
  ])
  console.log('Created 5 skill listings')

  // Resources
  const resources = await Resource.create([
    { owner: users[3]._id, type: 'tool', title: 'Premium Lawn Mower', description: 'Honda self-propelled lawn mower. Well-maintained, great for medium to large yards.', condition: 'good', status: 'available', is_free: true, tags: ['lawn', 'garden', 'outdoor'], location: { city: 'Seattle, WA', lat: 47.6262, lng: -122.3521 } },
    { owner: users[0]._id, type: 'workspace', title: 'Community Kitchen Access', description: 'Fully equipped commercial kitchen available weekends for cooking classes or community meals.', condition: 'good', status: 'available', is_free: false, price_per_day: 25, tags: ['kitchen', 'cooking', 'events'], location: { city: 'Seattle, WA', lat: 47.6062, lng: -122.3321 } }
  ])
  console.log('Created 2 resources')

  // Assistance Posts
  await AssistancePost.create([
    { poster: users[3]._id, post_type: 'requesting', category: 'errand', title: 'Need help moving furniture', description: 'Moving a couch and bookshelf to 2nd floor apartment. Should take about an hour.', urgency: 'medium', location: { city: 'Seattle, WA', lat: 47.6262, lng: -122.3521 }, tags: ['moving', 'help'] },
    { poster: users[2]._id, post_type: 'offering', category: 'tutoring', title: 'Free yoga sessions for seniors', description: 'Offering gentle yoga sessions for seniors in the community. Every Thursday morning at the park.', urgency: 'low', location: { city: 'Seattle, WA', lat: 47.5962, lng: -122.3221 }, tags: ['yoga', 'fitness', 'seniors'] }
  ])
  console.log('Created 2 assistance posts')

  // Notifications for Priya
  await Notification.create([
    { recipient: users[0]._id, type: 'event', title: 'New volunteer joined your event', message: 'Sarah Jenkins signed up for "Rooftop Urban Gardening". You now have 14/30 spots filled.', link: `/events/${events[0]._id}` },
    { recipient: users[0]._id, type: 'skill', title: 'Skill connection request', message: 'Someone is interested in learning Event Planning from you. They offer Photography in return.', link: '/skills' },
    { recipient: users[0]._id, type: 'pool', title: 'New participant in your pool', message: 'David Kim joined "Amazon Gardening Tools Order". Add your items now!', link: `/pools/${pools[1]._id}` },
    { recipient: users[0]._id, type: 'badge', title: 'You earned a new badge!', message: 'Congratulations! You\'ve been awarded the Community Pillar badge for reaching 500 community points.', link: '/profile' },
    { recipient: users[0]._id, type: 'urgent', title: 'Urgent community need near you', message: 'Emergency water distribution center at Maple St. Square requires 3 additional handlers by 4:00 PM today.', link: '/assistance' }
  ])
  console.log('Created notifications')

  console.log('\n✅ Seed completed successfully!')
  console.log('Login credentials:')
  console.log('  priya@test.com / Test@1234')
  console.log('  marcus@test.com / Test@1234')
  console.log('  sarah@test.com / Test@1234')
  console.log('  david@test.com / Test@1234')
  console.log('  elena@test.com / Test@1234')

  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
