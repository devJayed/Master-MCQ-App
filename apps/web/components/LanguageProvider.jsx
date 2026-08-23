'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';

const translations = {
  'Student learning space': 'শিক্ষার্থীর শিক্ষাঙ্গন',
  'Moderator workspace': 'মডারেটর কর্মক্ষেত্র',
  'Teacher workspace': 'শিক্ষক কর্মক্ষেত্র',
  Dashboard: 'ড্যাশবোর্ড',
  Practice: 'অনুশীলন',
  Syllabus: 'সিলেবাস',
  'Create Test': 'টেস্ট তৈরি',
  'Exam History': 'পরীক্ষার ইতিহাস',
  Performance: 'পারফরম্যান্স',
  'Question Bank': 'প্রশ্নভান্ডার',
  'Add Question': 'প্রশ্ন যোগ',
  'Import Questions': 'প্রশ্ন ইমপোর্ট',
  'Syllabus Config': 'সিলেবাস কনফিগ',
  'Question Reports': 'প্রশ্ন রিপোর্ট', 
  Students: 'শিক্ষার্থীরা',
  Analytics: 'বিশ্লেষণ',
  'LEARNING WITH': 'শিক্ষকের সঙ্গে',
  'CONTENT TEAM': 'কনটেন্ট টিম',
  'HSC ICT PORTAL': 'এইচএসসি আইসিটি পোর্টাল',
  'Jayed Hossain': 'জায়েদ হোসাইন',
  'View moderator space →': 'মডারেটর অংশ দেখুন →',
  'View student space →': 'শিক্ষার্থীর অংশ দেখুন →',
  'Ready to sharpen your': 'আপনার আইসিটি দক্ষতা',
  'ICT skills?': 'ঝালিয়ে নিতে প্রস্তুত?',
  'Small, consistent practice turns difficult topics into your strongest chapters.':
    'নিয়মিত ছোট ছোট অনুশীলন কঠিন বিষয়কেও আপনার শক্তিশালী অধ্যায়ে পরিণত করে।',
  "Start today's practice": 'আজকের অনুশীলন শুরু করুন',
  'BUILD MOMENTUM': 'নিয়মিত এগিয়ে চলুন',
  'Quick practice': 'দ্রুত অনুশীলন',
  'See all chapters →': 'সব অধ্যায় দেখুন →',
  'YOUR PROGRESS': 'আপনার অগ্রগতি',
  'This month': 'এই মাসে',
  'Tests completed': 'সম্পন্ন টেস্ট',
  'Questions solved': 'সমাধান করা প্রশ্ন',
  'Day streak': 'দিনের ধারাবাহিকতা',
  'CURATED FOR YOU': 'আপনার জন্য বাছাই করা',
  "Jayed's picks": 'জায়েদের পছন্দ',
  'Practice my 37 mistakes': 'আমার ৩৭টি ভুল অনুশীলন করুন',
  'FIND YOUR FOCUS': 'আপনার লক্ষ্য বেছে নিন',
  'What would you like': 'আজ আপনি কী',
  'to practice today?': 'অনুশীলন করতে চান?',
  'Choose a guided mode, or build a test that fits your study plan.':
    'নির্দেশিত মোড বেছে নিন, অথবা আপনার পড়ার পরিকল্পনা অনুযায়ী টেস্ট তৈরি করুন।',
  'Topic practice': 'টপিক অনুশীলন',
  'Chapter test': 'অধ্যায় টেস্ট',
  'Quick test': 'দ্রুত টেস্ট',
  'Practice mistakes': 'ভুলের অনুশীলন',
  'Master one topic at a time': 'একবারে একটি টপিক আয়ত্ত করুন',
  'Measure chapter-level progress': 'অধ্যায়ভিত্তিক অগ্রগতি যাচাই করুন',
  'Turn past errors into strengths': 'পুরোনো ভুলকে শক্তিতে বদলে দিন',
  'Choose a chapter': 'একটি অধ্যায় বেছে নিন',
  'MAKE IT YOURS': 'নিজের মতো করে নিন',
  'Create a custom test': 'কাস্টম টেস্ট তৈরি করুন',
  "Select exactly what you need to revise. We'll make the questions for you.":
    'আপনি যে বিষয়গুলো ঝালিয়ে নিতে চান, তা বেছে নিন। আমরা আপনার জন্য প্রশ্ন তৈরি করব।',
  'Choose chapters': 'অধ্যায় বেছে নিন',
  'Select one or more areas.': 'এক বা একাধিক বিষয় বেছে নিন।',
  'Set your challenge': 'আপনার চ্যালেঞ্জ ঠিক করুন',
  Questions: 'প্রশ্ন',
  Difficulty: 'কঠিনতা',
  Timer: 'সময়',
  Easy: 'সহজ',
  Medium: 'মাঝারি',
  Hard: 'কঠিন',
  'No timer': 'সময় ছাড়া',
  'YOUR TEST': 'আপনার টেস্ট',
  'Ready when you are.': 'আপনি প্রস্তুত হলেই শুরু।',
  'Time limit': 'সময়সীমা',
  'Start my test →': 'আমার টেস্ট শুরু করুন →',
  'Exit test': 'টেস্ট থেকে বের হন',
  Question: 'প্রশ্ন',
  Previous: 'আগের',
  'Next question': 'পরের প্রশ্ন',
  'Finish test': 'টেস্ট শেষ করুন',
  'TEST COMPLETE': 'টেস্ট সম্পন্ন',
  'Great work, Rahim!': 'দারুণ করেছেন, রহিম!',
  'You kept your focus and finished strong.': 'আপনি মনোযোগ ধরে রেখে চমৎকারভাবে শেষ করেছেন।',
  Correct: 'সঠিক',
  Wrong: 'ভুল',
  'Time used': 'সময় লেগেছে',
  'KEEP LEARNING': 'শেখা চালিয়ে যান',
  'One answer to revisit': 'আরও একবার দেখে নিন',
  Dashboard: 'ড্যাশবোর্ড',
  'Try another test': 'আরেকটি টেস্ট দিন',
  'YOUR LEARNING LOG': 'আপনার শেখার রেকর্ড',
  'THE BIG PICTURE': 'সামগ্রিক চিত্র',
  'Your performance': 'আপনার পারফরম্যান্স',
  'CONTENT OPERATIONS': 'কনটেন্ট ব্যবস্থাপনা',
  'Moderator dashboard': 'মডারেটর ড্যাশবোর্ড',
  'Keep the HSC ICT question bank accurate, clear, and ready for students.':
    'এইচএসসি আইসিটি প্রশ্নভান্ডার নির্ভুল ও শিক্ষার্থীদের জন্য প্রস্তুত রাখুন।',
  'Add a question': 'একটি প্রশ্ন যোগ করুন',
  'Total questions': 'মোট প্রশ্ন',
  Published: 'প্রকাশিত',
  'Awaiting review': 'পর্যালোচনার অপেক্ষায়',
  'Open reports': 'খোলা রিপোর্ট',
  'NEEDS ATTENTION': 'মনোযোগ প্রয়োজন',
  'Question activity': 'প্রশ্নের কার্যক্রম',
  'View question bank →': 'প্রশ্নভান্ডার দেখুন →',
  Review: 'পর্যালোচনা',
  Publish: 'প্রকাশ করুন',
  'QUALITY SNAPSHOT': 'মানের সারাংশ',
  'Questions reviewed': 'পর্যালোচিত প্রশ্ন',
  'Published after review': 'পর্যালোচনার পর প্রকাশ',
  'Average review time': 'গড় পর্যালোচনার সময়',
  'Resolve reports': 'রিপোর্ট সমাধান করুন',
  'CONTENT LIBRARY': 'কনটেন্ট লাইব্রেরি',
  Filters: 'ফিল্টার',
  Topic: 'টপিক',
  Status: 'অবস্থা',
  Draft: 'খসড়া',
  Edit: 'সম্পাদনা',
  'QUESTION BANK': 'প্রশ্নভান্ডার',
  'Create question': 'প্রশ্ন তৈরি করুন',
  'Clear explanations help students learn from every answer.':
    'সহজ ব্যাখ্যা শিক্ষার্থীদের প্রতিটি উত্তর থেকে শিখতে সাহায্য করে।',
  Chapter: 'অধ্যায়',
  Options: 'বিকল্পসমূহ',
  Explanation: 'ব্যাখ্যা',
  PUBLISHING: 'প্রকাশনা',
  Source: 'উৎস',
  Tags: 'ট্যাগ',
  'Save draft': 'খসড়া সংরক্ষণ',
  'Publish question': 'প্রশ্ন প্রকাশ করুন',
  'CONTENT QUALITY': 'কনটেন্টের মান',
  'Question reports': 'প্রশ্নের রিপোর্ট',
};
const LanguageContext = createContext({ language: 'bn', toggleLanguage: () => {} });
export const useLanguage = () => useContext(LanguageContext);
function translate(root, dictionary) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
    nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const text = node.nodeValue.trim();
    if (dictionary[text]) node.nodeValue = node.nodeValue.replace(text, dictionary[text]);
  });
  root.querySelectorAll('[placeholder]').forEach((input) => {
    if (dictionary[input.placeholder]) input.placeholder = dictionary[input.placeholder];
  });
}
export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('bn');
  // Layout effects run before the browser paints. This prevents the server's
  // English source strings from flashing before their Bangla equivalents appear.
  useLayoutEffect(() => {
    if (localStorage.getItem('portal-language') === 'en') setLanguage('en');
  }, []);
  useLayoutEffect(() => {
    const dictionary =
      language === 'bn'
        ? translations
        : Object.fromEntries(Object.entries(translations).map(([en, bn]) => [bn, en]));
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    const apply = () => translate(document.body, dictionary);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () => {
        const next = language === 'bn' ? 'en' : 'bn';
        localStorage.setItem('portal-language', next);
        setLanguage(next);
      },
    }),
    [language]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
