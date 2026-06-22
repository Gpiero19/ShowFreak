import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const DEMO_EMAIL = 'demo@showfreak.com'
const DEMO_PASSWORD = 'demo1234'
const DEMO_USERNAME = 'demo'

const FAR_FUTURE = new Date('2030-01-01')
const NOW = new Date()

const content = [
  // ── Movies ──────────────────────────────────────────────────────────────────
  {
    externalId: '155', contentType: 'movie',
    title: 'The Dark Knight', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    voteAverage: 9.0, releaseYear: 2008, genres: [28, 80, 18],
    overview: 'When the menace known as the Joker wreaks havoc on Gotham City, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
  },
  {
    externalId: '27205', contentType: 'movie',
    title: 'Inception', posterPath: '/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
    voteAverage: 8.8, releaseYear: 2010, genres: [28, 878, 12],
    overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
  },
  {
    externalId: '157336', contentType: 'movie',
    title: 'Interstellar', posterPath: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
    voteAverage: 8.7, releaseYear: 2014, genres: [12, 18, 878],
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
  },
  {
    externalId: '278', contentType: 'movie',
    title: 'The Shawshank Redemption', posterPath: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    voteAverage: 8.7, releaseYear: 1994, genres: [18, 80],
    overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
  },
  {
    externalId: '238', contentType: 'movie',
    title: 'The Godfather', posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    voteAverage: 8.7, releaseYear: 1972, genres: [18, 80],
    overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
  },
  {
    externalId: '244786', contentType: 'movie',
    title: 'Whiplash', posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    voteAverage: 8.5, releaseYear: 2014, genres: [18, 10402],
    overview: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
  },
  {
    externalId: '550', contentType: 'movie',
    title: 'Fight Club', posterPath: '/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
    voteAverage: 8.4, releaseYear: 1999, genres: [18, 53],
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
  },
  {
    externalId: '603', contentType: 'movie',
    title: 'The Matrix', posterPath: '/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg',
    voteAverage: 8.2, releaseYear: 1999, genres: [28, 878],
    overview: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
  },
  {
    externalId: '438631', contentType: 'movie',
    title: 'Dune', posterPath: '/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg',
    voteAverage: 7.8, releaseYear: 2021, genres: [878, 12],
    overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.',
  },
  {
    externalId: '872585', contentType: 'movie',
    title: 'Oppenheimer', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    voteAverage: 8.2, releaseYear: 2023, genres: [18, 36],
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
  },
  {
    externalId: '792307', contentType: 'movie',
    title: 'Poor Things', posterPath: '/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg',
    voteAverage: 8.0, releaseYear: 2023, genres: [18, 878, 35],
    overview: 'The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.',
  },
  // ── TV Shows ────────────────────────────────────────────────────────────────
  {
    externalId: '1396', contentType: 'tv',
    title: 'Breaking Bad', posterPath: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    voteAverage: 9.5, releaseYear: 2008, genres: [18, 80],
    overview: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
  },
  {
    externalId: '87108', contentType: 'tv',
    title: 'Chernobyl', posterPath: '/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
    voteAverage: 9.4, releaseYear: 2019, genres: [18, 36],
    overview: 'A dramatization of the true story of one of the worst man-made catastrophes in history, the catastrophic nuclear accident at Chernobyl.',
  },
  {
    externalId: '1399', contentType: 'tv',
    title: 'Game of Thrones', posterPath: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    voteAverage: 8.4, releaseYear: 2011, genres: [18, 10765],
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north.',
  },
  {
    externalId: '37854', contentType: 'tv',
    title: 'Succession', posterPath: '/dB4EDhre2dsC2kxYDavyKWqLQwi.jpg',
    voteAverage: 8.6, releaseYear: 2018, genres: [18, 35],
    overview: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company.',
  },
  // ── Disliked content ────────────────────────────────────────────────────────
  {
    externalId: '1858', contentType: 'movie',
    title: 'Transformers', posterPath: '/4N4sipl8T72tNE4earcctQa2Kw2.jpg',
    voteAverage: 6.9, releaseYear: 2007, genres: [28, 12, 878],
    overview: 'An ancient struggle between two Cybertronian races, the heroic Autobots and the evil Decepticons, comes to Earth.',
  },
  {
    externalId: '408409', contentType: 'movie',
    title: 'The Emoji Movie', posterPath: '/7gLQ30xSVUy6ASfv0pOuQaoE7jD.jpg',
    voteAverage: 3.4, releaseYear: 2017, genres: [16, 35, 10751],
    overview: 'Gene, a multi-expressional emoji, sets out on a journey to become a normal emoji.',
  },
]

const libraryItems = [
  { externalId: '155',    contentType: 'movie', status: 'watched',   personalRating: 5, notes: 'Best superhero movie ever made.' },
  { externalId: '27205',  contentType: 'movie', status: 'watched',   personalRating: 5, notes: 'Mind-bending. Watched it twice.' },
  { externalId: '157336', contentType: 'movie', status: 'watched',   personalRating: 4, notes: 'Visually stunning.' },
  { externalId: '278',    contentType: 'movie', status: 'watched',   personalRating: 5, notes: null },
  { externalId: '238',    contentType: 'movie', status: 'watched',   personalRating: 5, notes: 'A masterpiece of cinema.' },
  { externalId: '244786', contentType: 'movie', status: 'watched',   personalRating: 5, notes: 'Fletcher is terrifying.' },
  { externalId: '550',    contentType: 'movie', status: 'watched',   personalRating: 4, notes: null },
  { externalId: '603',    contentType: 'movie', status: 'watched',   personalRating: 4, notes: 'Iconic.' },
  { externalId: '1396',   contentType: 'tv',    status: 'watched',   personalRating: 5, notes: 'Greatest TV show ever made.' },
  { externalId: '87108',  contentType: 'tv',    status: 'watched',   personalRating: 5, notes: 'Devastating and important.' },
  { externalId: '1399',   contentType: 'tv',    status: 'watched',   personalRating: 4, notes: 'Seasons 1-4 are perfect.' },
  { externalId: '438631', contentType: 'movie', status: 'favorite',  personalRating: null, notes: null },
  { externalId: '37854',  contentType: 'tv',    status: 'favorite',  personalRating: null, notes: null },
  { externalId: '872585', contentType: 'movie', status: 'wishlist',  personalRating: null, notes: null },
  { externalId: '792307', contentType: 'movie', status: 'wishlist',  personalRating: null, notes: null },
]

const dislikes = [
  { externalId: '1858',   contentType: 'movie', dislikeReason: 'too_loud' },
  { externalId: '408409', contentType: 'movie', dislikeReason: 'poor_quality' },
]

async function main() {
  console.log('Seeding demo account...')

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash, username: DEMO_USERNAME },
  })

  console.log(`Demo user: ${user.email}`)

  console.log('Seeding content cache...')
  for (const item of content) {
    await prisma.contentCache.upsert({
      where: { externalId_contentType: { externalId: item.externalId, contentType: item.contentType } },
      update: { posterPath: item.posterPath, expiresAt: FAR_FUTURE },
      create: {
        externalId: item.externalId,
        contentType: item.contentType,
        title: item.title,
        posterPath: item.posterPath,
        voteAverage: item.voteAverage,
        releaseYear: item.releaseYear,
        genres: item.genres,
        overview: item.overview,
        cachedAt: NOW,
        expiresAt: FAR_FUTURE,
      },
    })
  }

  console.log('Seeding library...')
  for (const item of libraryItems) {
    await prisma.libraryItem.upsert({
      where: { userId_externalId_contentType: { userId: user.id, externalId: item.externalId, contentType: item.contentType } },
      update: {},
      create: {
        userId: user.id,
        externalId: item.externalId,
        contentType: item.contentType,
        status: item.status,
        personalRating: item.personalRating ?? null,
        notes: item.notes ?? null,
        watchedAt: item.status === 'watched' ? NOW : null,
      },
    })
  }

  console.log('Seeding dislikes...')
  for (const item of dislikes) {
    await prisma.userPreference.upsert({
      where: { userId_externalId_contentType: { userId: user.id, externalId: item.externalId, contentType: item.contentType } },
      update: {},
      create: {
        userId: user.id,
        externalId: item.externalId,
        contentType: item.contentType,
        dislikeReason: item.dislikeReason,
      },
    })
  }

  console.log('Done! Demo account ready:')
  console.log(`  Email:    ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
