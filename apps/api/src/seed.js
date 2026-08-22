require('dotenv').config();

const connectDb = require('./config/db');
const User = require('./models/User');
const Chapter = require('./models/Chapter');
const Topic = require('./models/Topic');
const Subtopic = require('./models/Subtopic');
const Question = require('./models/Question');

const syllabus = [
  { bn: 'তথ্য ও যোগাযোগ প্রযুক্তি: বিশ্ব ও বাংলাদেশ প্রেক্ষিত', en: 'ICT: World and Bangladesh Perspective', topics: [
    ['তথ্য ও যোগাযোগ প্রযুক্তি', 'Information and Communication Technology', ['আইসিটির ধারণা', 'Concept of ICT'], ['বাংলাদেশে আইসিটি', 'ICT in Bangladesh']],
    ['বিশ্বগ্রাম', 'Global Village', ['বিশ্বগ্রামের উপাদান', 'Elements of the Global Village'], ['ভার্চুয়াল রিয়েলিটি', 'Virtual Reality']],
  ] },
  { bn: 'কমিউনিকেশন সিস্টেমস ও নেটওয়ার্কিং', en: 'Communication Systems and Networking', topics: [
    ['ডেটা কমিউনিকেশন', 'Data Communication', ['ডেটা ট্রান্সমিশন', 'Data Transmission'], ['কমিউনিকেশন মোড', 'Communication Modes']],
    ['কম্পিউটার নেটওয়ার্ক', 'Computer Networks', ['নেটওয়ার্ক টপোলজি', 'Network Topology'], ['নেটওয়ার্ক ডিভাইস', 'Network Devices']],
  ] },
  { bn: 'সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস', en: 'Number Systems and Digital Devices', topics: [
    ['সংখ্যা পদ্ধতি', 'Number Systems', ['বাইনারি সংখ্যা পদ্ধতি', 'Binary Number System'], ['সংখ্যা রূপান্তর', 'Number Conversion']],
    ['লজিক গেট', 'Logic Gates', ['মৌলিক লজিক গেট', 'Basic Logic Gates'], ['সার্বজনীন লজিক গেট', 'Universal Logic Gates']],
  ] },
  { bn: 'ওয়েব ডিজাইন পরিচিতি এবং HTML', en: 'Web Design and HTML', topics: [
    ['ওয়েব পরিচিতি', 'Introduction to the Web', ['ওয়েবসাইট ও ওয়েবপেজ', 'Websites and Web Pages'], ['ইন্টারনেট সেবা', 'Internet Services']],
    ['HTML', 'HTML', ['HTML ট্যাগ', 'HTML Tags'], ['HTML ফর্ম', 'HTML Forms']],
  ] },
  { bn: 'প্রোগ্রামিং ভাষা', en: 'Programming Language', topics: [
    ['প্রোগ্রামিং ধারণা', 'Programming Concepts', ['অ্যালগরিদম ও ফ্লোচার্ট', 'Algorithms and Flowcharts'], ['প্রোগ্রামিং ভাষার ধরন', 'Types of Programming Languages']],
    ['সি প্রোগ্রামিং', 'C Programming', ['ভেরিয়েবল ও ডেটা টাইপ', 'Variables and Data Types'], ['শর্ত ও লুপ', 'Conditions and Loops']],
  ] },
  { bn: 'ডেটাবেজ ম্যানেজমেন্ট সিস্টেম', en: 'Database Management System', topics: [
    ['ডেটাবেজ ধারণা', 'Database Concepts', ['ডেটা ও তথ্য', 'Data and Information'], ['ডেটাবেজের সুবিধা', 'Benefits of Databases']],
    ['রিলেশনাল ডেটাবেজ', 'Relational Databases', ['টেবিল, রেকর্ড ও ফিল্ড', 'Tables, Records and Fields'], ['কী ও সম্পর্ক', 'Keys and Relationships']],
  ] },
];

async function upsertSyllabus() {
  for (const [chapterIndex, chapterData] of syllabus.entries()) {
    await Chapter.updateOne(
      { order: chapterIndex + 1 },
      { $set: { name: { bn: chapterData.bn, en: chapterData.en }, order: chapterIndex + 1, isActive: true } },
      { upsert: true }
    );
    const chapter = await Chapter.findOne({ order: chapterIndex + 1 });
    for (const [topicIndex, topicData] of chapterData.topics.entries()) {
      const [bn, en, subtopics] = topicData;
      await Topic.updateOne(
        { chapterId: chapter._id, order: topicIndex + 1 },
        { $set: { chapterId: chapter._id, name: { bn, en }, order: topicIndex + 1, isActive: true } },
        { upsert: true }
      );
      const topic = await Topic.findOne({ chapterId: chapter._id, order: topicIndex + 1 });
      for (const [subtopicIndex, [subtopicBn, subtopicEn]] of subtopics.entries()) {
        await Subtopic.updateOne(
          { topicId: topic._id, order: subtopicIndex + 1 },
          { $set: { chapterId: chapter._id, topicId: topic._id, name: { bn: subtopicBn, en: subtopicEn }, order: subtopicIndex + 1, isActive: true } },
          { upsert: true }
        );
      }
    }
  }
}

(async () => {
  await connectDb();
  await upsertSyllabus();
  let teacher = await User.findOne({ email: 'jayed@example.com' });
  if (!teacher) teacher = await User.create({ name: 'Jayed Hossain', nameEnglish: 'Jayed Hossain', nameBangla: 'জায়েদ হোসাইন', email: 'jayed@example.com', password: process.env.SEED_PASSWORD || '12345678', role: 'teacher' });
  const chapter = await Chapter.findOne({ order: 3 });
  const topic = await Topic.findOne({ chapterId: chapter._id, order: 1 });
  const subtopic = await Subtopic.findOne({ topicId: topic._id, order: 1 });
  await Question.updateOne(
    { 'question.en': 'Which number system uses base 2?' },
    { $set: {
      chapterId: chapter._id, topicId: topic._id, subtopicId: subtopic._id,
      question: { bn: 'কোন সংখ্যা পদ্ধতিতে ভিত্তি ২ ব্যবহৃত হয়?', en: 'Which number system uses base 2?' },
      options: [['দশমিক', 'Decimal'], ['বাইনারি', 'Binary'], ['অক্টাল', 'Octal'], ['হেক্সাডেসিমাল', 'Hexadecimal']].map(([bn, en], index) => ({ key: 'ABCD'[index], text: { bn, en } })),
      correctAnswer: 'B', explanation: { bn: 'বাইনারি পদ্ধতিতে শুধু ০ এবং ১ ব্যবহার করা হয়, তাই এর ভিত্তি ২।', en: 'Binary uses only 0 and 1, so its base is 2.' },
      difficulty: 'easy', status: 'published', isDeleted: false, createdBy: teacher._id,
    } },
    { upsert: true }
  );
  console.log('Syllabus seed complete.');
  process.exit(0);
})().catch((error) => { console.error(error); process.exit(1); });
