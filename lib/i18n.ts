/**
 * Patient-facing UI strings for the web app. The active language is resolved
 * per request from the `synapse_lang` cookie, falling back to the patient's
 * `language` column, then English (see `lib/patient-lang.ts`).
 *
 * Reviewed translations: English, Hindi, Assamese, Bengali, Nepali. Other NER
 * languages fall back to English until a native speaker fills them in; the
 * voice (TTS) locale still follows the real choice.
 */

export type Dict = Record<string, string>;

/** Cookie the in-app language switcher writes; read back in `resolvePatientLang`. */
export const LANG_COOKIE = "synapse_lang";

const en: Dict = {
  readThisToMe: "Read this to me",
  next: "Next",
  open: "Open",
  nothingMoreToday: "Nothing more to do today. Well done.",
  playAGame: "Play a game",
  myReminders: "My reminders",
  whoIsThis: "Who is this?",
  feelLost:
    "If you feel lost, press and hold the Home button to call your family.",
  partMorning: "morning",
  partAfternoon: "afternoon",
  partEvening: "evening",
  itIsPartNow: "It is {part} now.",
  greetingWithNext: "Hello {name}. Your next task is {task} at {time}.",
  greetingNoNext: "Hello {name}. There are no more reminders today.",
  onlyMemoryLanePlayable:
    "Only Memory Lane is playable in this scaffold. The rest show the planned suite.",
  locked: "Locked",
  findTakeYourTime: "Find the two cards that match. Take your time.",
  showAll: "Show all",
  pairsFound: "{a} of {b} pairs found",
  wellDoneToday: "Well done today, {name}.",
  youFinished:
    "You finished the game. Your family and doctor can see that you played.",
  hearThis: "Hear this",
  playAgain: "Play again",
  goHome: "Go home",
  forYourCaregiver: "For your caregiver / doctor",
  todaysReminders: "Today's reminders",
  noRemindersToday: "No reminders scheduled for today.",
  atTime: "at {time}",
  done: "Done",
  later: "Later",
  hear: "Hear",
  yourFamilyIntro: "Your family and the people close to you.",
  noFamilyYet:
    "No family added yet. A caregiver can add them from the family dashboard.",
  thisIsPerson: "This is {name}, your {relationship}. {notes}",
  language: "Language",

  // Shared game words
  takeYourTime: "Take your time. There is no timer.",
  undo: "Undo",
  showAgain: "Show me again",
  imReady: "I'm ready",
  begin: "Begin",
  watchCarefully: "Watch carefully.",
  nowYourTurn: "Now it is your turn.",
  nextOne: "Next",
  goodChoice: "Good choice.",
  tryAnother: "Not quite. Try another.",
  sayTheWord: "Say the word",
  orTapAnswer: "or tap an answer",
  roundProgress: "{a} of {b}",
  foundAll: "You found them all.",

  // Market Basket
  titleMarketBasket: "Market Basket",
  instrMarketBasket: "Remember what to buy, then pick each thing at the market.",
  thingsToBuy: "Things to buy",
  goToMarket: "Go to the market",

  // Morning Routine
  titleMorningRoutine: "Morning Routine",
  instrMorningRoutine: "Put the morning steps in the order you do them.",

  // Pattern of the Loom
  titlePatternLoom: "Pattern of the Loom",
  instrPatternLoom:
    "Watch the lights on the loom, then tap them in the same order.",

  // Bird & Beast
  titleBirdBeast: "Bird & Beast",
  instrBirdBeast: "Tap every {target} you can see. Leave the rest.",
  theHornbill: "hornbill",
  theRhino: "rhino",
  theElephant: "elephant",
  theDeer: "deer",

  // Song of the Hills
  titleSongHills: "Song of the Hills",
  instrSongHills:
    "One word is missing from the song. Choose the word that fits.",
  hearTheLine: "Hear the line",

  // Word Garden
  titleWordGarden: "Word Garden",
  instrWordGarden: "What is this? Say the word, or tap the right answer.",
};

const hi: Dict = {
  ...en,
  readThisToMe: "यह मुझे पढ़कर सुनाओ",
  next: "अगला",
  open: "खोलें",
  nothingMoreToday: "आज और कुछ नहीं करना है। बहुत बढ़िया।",
  playAGame: "एक खेल खेलें",
  myReminders: "मेरे रिमाइंडर",
  whoIsThis: "यह कौन है?",
  feelLost: "अगर आप भ्रमित महसूस करें, तो परिवार को बुलाने के लिए होम बटन दबाकर रखें।",
  partMorning: "सुबह",
  partAfternoon: "दोपहर",
  partEvening: "शाम",
  itIsPartNow: "अभी {part} है।",
  greetingWithNext: "नमस्ते {name}। आपका अगला काम {time} बजे {task} है।",
  greetingNoNext: "नमस्ते {name}। आज और कोई रिमाइंडर नहीं है।",
  onlyMemoryLanePlayable: "यहाँ केवल Memory Lane खेला जा सकता है। बाकी योजना में हैं।",
  locked: "बंद",
  findTakeYourTime: "मिलते-जुलते दो कार्ड ढूँढें। जल्दबाज़ी न करें।",
  showAll: "सब दिखाएँ",
  pairsFound: "{b} में से {a} जोड़े मिले",
  wellDoneToday: "आज बहुत अच्छा किया, {name}।",
  youFinished: "आपने खेल पूरा किया। आपका परिवार और डॉक्टर देख सकते हैं कि आपने खेला।",
  hearThis: "यह सुनें",
  playAgain: "फिर से खेलें",
  goHome: "घर जाएँ",
  forYourCaregiver: "आपके देखभालकर्ता / डॉक्टर के लिए",
  todaysReminders: "आज के रिमाइंडर",
  noRemindersToday: "आज के लिए कोई रिमाइंडर नहीं है।",
  atTime: "{time} बजे",
  done: "हो गया",
  later: "बाद में",
  hear: "सुनें",
  yourFamilyIntro: "आपका परिवार और आपके करीबी लोग।",
  noFamilyYet: "अभी तक कोई परिवार नहीं जोड़ा गया। देखभालकर्ता इसे जोड़ सकते हैं।",
  thisIsPerson: "यह {name} हैं, आपके {relationship}। {notes}",
  language: "भाषा",

  // Shared game words
  takeYourTime: "आराम से कीजिए। कोई समय-सीमा नहीं है।",
  undo: "वापस लें",
  showAgain: "फिर से दिखाओ",
  imReady: "मैं तैयार हूँ",
  begin: "शुरू करें",
  watchCarefully: "ध्यान से देखिए।",
  nowYourTurn: "अब आपकी बारी है।",
  nextOne: "अगला",
  goodChoice: "सही चुना।",
  tryAnother: "ठीक नहीं। दूसरा देखिए।",
  sayTheWord: "शब्द बोलिए",
  orTapAnswer: "या कोई उत्तर दबाइए",
  roundProgress: "{b} में से {a}",
  foundAll: "आपने सब ढूँढ लिए।",

  titleMarketBasket: "Market Basket",
  instrMarketBasket: "क्या खरीदना है याद रखिए, फिर बाज़ार में हर चीज़ चुनिए।",
  thingsToBuy: "खरीदने की चीज़ें",
  goToMarket: "बाज़ार चलें",

  titleMorningRoutine: "Morning Routine",
  instrMorningRoutine: "सुबह के कामों को उसी क्रम में रखिए जिस क्रम में आप करते हैं।",

  titlePatternLoom: "Pattern of the Loom",
  instrPatternLoom: "करघे की बत्तियाँ देखिए, फिर उसी क्रम में उन्हें दबाइए।",

  titleBirdBeast: "Bird & Beast",
  instrBirdBeast: "हर {target} पर दबाइए। बाकी को छोड़ दीजिए।",
  theHornbill: "धनेश पक्षी",
  theRhino: "गैंडा",
  theElephant: "हाथी",
  theDeer: "हिरण",

  titleSongHills: "Song of the Hills",
  instrSongHills: "गीत में एक शब्द नहीं है। सही शब्द चुनिए।",
  hearTheLine: "पंक्ति सुनिए",

  titleWordGarden: "Word Garden",
  instrWordGarden: "यह क्या है? शब्द बोलिए, या सही उत्तर दबाइए।",
};

const as: Dict = {
  ...en,
  readThisToMe: "মোক এইটো পঢ়ি শুনাওক",
  next: "পৰৱৰ্তী",
  open: "খোলক",
  nothingMoreToday: "আজি আৰু একো কৰিবলগীয়া নাই। বৰ ভাল।",
  playAGame: "এটা খেল খেলক",
  myReminders: "মোৰ ৰিমাইণ্ডাৰ",
  whoIsThis: "এইজন কোন?",
  feelLost: "যদি বিভ্ৰান্ত অনুভৱ কৰে, পৰিয়ালক মাতিবলৈ হ'ম বুটামটো টিপি ধৰক।",
  partMorning: "ৰাতিপুৱা",
  partAfternoon: "দুপৰীয়া",
  partEvening: "সন্ধিয়া",
  itIsPartNow: "এতিয়া {part}।",
  greetingWithNext: "নমস্কাৰ {name}। আপোনাৰ পৰৱৰ্তী কাম {time} বজাত {task}।",
  greetingNoNext: "নমস্কাৰ {name}। আজি আৰু ৰিমাইণ্ডাৰ নাই।",
  onlyMemoryLanePlayable: "ইয়াত কেৱল Memory Lane খেলিব পাৰি। বাকীবোৰ পৰিকল্পনাত আছে।",
  locked: "বন্ধ",
  findTakeYourTime: "মিলা দুখন কাৰ্ড বিচাৰক। খৰখেদা নকৰিব।",
  showAll: "সকলো দেখুৱাওক",
  pairsFound: "{b} ৰ ভিতৰত {a} যোৰ পোৱা গ'ল",
  wellDoneToday: "আজি বৰ ভাল কৰিলে, {name}।",
  youFinished:
    "আপুনি খেলখন সম্পূৰ্ণ কৰিলে। আপোনাৰ পৰিয়াল আৰু চিকিৎসকে দেখিব পাৰে যে আপুনি খেলিছে।",
  hearThis: "এইটো শুনক",
  playAgain: "আকৌ খেলক",
  goHome: "ঘৰলৈ যাওক",
  forYourCaregiver: "আপোনাৰ যত্নকাৰী / চিকিৎসকৰ বাবে",
  todaysReminders: "আজিৰ ৰিমাইণ্ডাৰ",
  noRemindersToday: "আজিৰ বাবে কোনো ৰিমাইণ্ডাৰ নাই।",
  atTime: "{time} বজাত",
  done: "হ'ল",
  later: "পিছত",
  hear: "শুনক",
  yourFamilyIntro: "আপোনাৰ পৰিয়াল আৰু ওচৰৰ মানুহবোৰ।",
  noFamilyYet: "এতিয়ালৈকে কোনো পৰিয়াল যোগ কৰা হোৱা নাই। যত্নকাৰীয়ে যোগ কৰিব পাৰে।",
  thisIsPerson: "এইজন {name}, আপোনাৰ {relationship}। {notes}",
  language: "ভাষা",
};

const bn: Dict = {
  ...en,
  readThisToMe: "এটা আমাকে পড়ে শোনাও",
  next: "পরবর্তী",
  open: "খুলুন",
  nothingMoreToday: "আজ আর কিছু করার নেই। খুব ভালো।",
  playAGame: "একটি খেলা খেলুন",
  myReminders: "আমার রিমাইন্ডার",
  whoIsThis: "এটা কে?",
  feelLost: "বিভ্রান্ত বোধ করলে, পরিবারকে ডাকতে হোম বোতাম চেপে ধরুন।",
  partMorning: "সকাল",
  partAfternoon: "দুপুর",
  partEvening: "সন্ধ্যা",
  itIsPartNow: "এখন {part}।",
  greetingWithNext: "নমস্কার {name}। আপনার পরবর্তী কাজ {time} টায় {task}।",
  greetingNoNext: "নমস্কার {name}। আজ আর কোনো রিমাইন্ডার নেই।",
  onlyMemoryLanePlayable: "এখানে শুধু Memory Lane খেলা যায়। বাকিগুলো পরিকল্পনায় আছে।",
  locked: "বন্ধ",
  findTakeYourTime: "মিলে যাওয়া দুটি কার্ড খুঁজুন। তাড়াহুড়ো করবেন না।",
  showAll: "সব দেখান",
  pairsFound: "{b} টির মধ্যে {a} জোড়া পাওয়া গেছে",
  wellDoneToday: "আজ খুব ভালো করেছেন, {name}।",
  youFinished:
    "আপনি খেলা শেষ করেছেন। আপনার পরিবার ও ডাক্তার দেখতে পাবেন যে আপনি খেলেছেন।",
  hearThis: "এটা শুনুন",
  playAgain: "আবার খেলুন",
  goHome: "বাড়ি যান",
  forYourCaregiver: "আপনার পরিচর্যাকারী / ডাক্তারের জন্য",
  todaysReminders: "আজকের রিমাইন্ডার",
  noRemindersToday: "আজকের জন্য কোনো রিমাইন্ডার নেই।",
  atTime: "{time} টায়",
  done: "হয়েছে",
  later: "পরে",
  hear: "শুনুন",
  yourFamilyIntro: "আপনার পরিবার ও কাছের মানুষজন।",
  noFamilyYet: "এখনও কোনো পরিবার যোগ করা হয়নি। পরিচর্যাকারী যোগ করতে পারেন।",
  thisIsPerson: "ইনি {name}, আপনার {relationship}। {notes}",
  language: "ভাষা",
};

const ne: Dict = {
  ...en,
  readThisToMe: "मलाई यो पढेर सुनाउनुहोस्",
  next: "अर्को",
  open: "खोल्नुहोस्",
  nothingMoreToday: "आज अरू केही गर्नु छैन। धेरै राम्रो।",
  playAGame: "एउटा खेल खेल्नुहोस्",
  myReminders: "मेरा रिमाइन्डरहरू",
  whoIsThis: "यो को हो?",
  feelLost: "अलमल महसुस भएमा, परिवारलाई बोलाउन होम बटन थिचिराख्नुहोस्।",
  partMorning: "बिहान",
  partAfternoon: "दिउँसो",
  partEvening: "साँझ",
  itIsPartNow: "अहिले {part} हो।",
  greetingWithNext: "नमस्ते {name}। तपाईंको अर्को काम {time} बजे {task} हो।",
  greetingNoNext: "नमस्ते {name}। आज अरू रिमाइन्डर छैन।",
  onlyMemoryLanePlayable: "यहाँ Memory Lane मात्र खेल्न सकिन्छ। बाँकी योजनामा छन्।",
  locked: "बन्द",
  findTakeYourTime: "मिल्ने दुई कार्ड खोज्नुहोस्। हतार नगर्नुहोस्।",
  showAll: "सबै देखाउनुहोस्",
  pairsFound: "{b} मध्ये {a} जोडी भेटियो",
  wellDoneToday: "आज धेरै राम्रो गर्नुभयो, {name}।",
  youFinished:
    "तपाईंले खेल पूरा गर्नुभयो। तपाईंको परिवार र डाक्टरले तपाईंले खेलेको देख्न सक्छन्।",
  hearThis: "यो सुन्नुहोस्",
  playAgain: "फेरि खेल्नुहोस्",
  goHome: "गृह जानुहोस्",
  forYourCaregiver: "तपाईंको हेरचाहकर्ता / डाक्टरका लागि",
  todaysReminders: "आजका रिमाइन्डरहरू",
  noRemindersToday: "आजका लागि कुनै रिमाइन्डर छैन।",
  atTime: "{time} बजे",
  done: "भयो",
  later: "पछि",
  hear: "सुन्नुहोस्",
  yourFamilyIntro: "तपाईंको परिवार र नजिकका मानिसहरू।",
  noFamilyYet: "अहिलेसम्म कुनै परिवार थपिएको छैन। हेरचाहकर्ताले थप्न सक्छन्।",
  thisIsPerson: "यी {name} हुन्, तपाईंका {relationship}। {notes}",
  language: "भाषा",
};

const DICTS: Record<string, Dict> = { en, hi, as, bn, ne };

export function getDict(code: string | undefined | null): Dict {
  return DICTS[(code ?? "en").toLowerCase()] ?? en;
}

/** Fill `{token}` placeholders. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
