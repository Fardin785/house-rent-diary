export const MEM_DATA = [
  { id: 'fardin', en: 'Fardin', bn: 'ফারদিন', water: 2, gas: 2160 },
  { id: 'abdullah', en: 'Abdullah', bn: 'আবদুল্লাহ', water: 1, gas: 2160 },
  { id: 'ayesha', en: 'Ayesha', bn: 'আয়েশা', water: 1, gas: 1080 },
  { id: 'poly', en: 'Poly', bn: 'পলি', water: 1, gas: 1080 },
  { id: 'ammajan', en: 'Ammajan', bn: 'আম্মাজান', water: 2, gas: 2160 },
  { id: 'bayezid', en: 'Bayezid', bn: 'বায়েজিদ', water: 2, gas: 1080 },
  { id: 'adnan', en: 'Adnan', bn: 'আদনান', water: 2, gas: 2160 },
  { id: 'madrasha', en: 'Madrasha', bn: 'মাদ্রাসা', water: 1, gas: 0 },
  { id: 'bottom_floor', en: 'Bottom Floor', bn: 'নীচতলা', water: 1, gas: 1080 },
  { id: 'top_floor', en: '7.5th Floor', bn: 'সাড়ে ৭ তলা', water: 1, gas: 1080 },
];

export const WATER_RATIO_TOTAL = MEM_DATA.reduce((s, m) => s + m.water, 0); 

export const DEFAULT_COMMON_COSTS = [
  { name: 'বিদ্যুৎ বিল', nameEn: 'Electricity', amount: 4000 },
  { name: 'পানি বিল', nameEn: 'Water', amount: 500 },
  { name: 'গ্যাস বিল', nameEn: 'Gas', amount: 1080 },
  { name: 'সিঁড়ি ঝাড়ুর বিল', nameEn: 'Stair Sweeping', amount: 1200 },
  { name: 'ময়লার বিল', nameEn: 'Garbage', amount: 1500 },
  { name: 'কেয়ারটেকার বিল', nameEn: 'Caretaker', amount: 2000 },
  { name: 'মসজিদের ইমামের বেতন', nameEn: 'Mosque Imam Salary', amount: 1000 },
  { name: 'মাদ্রাসার ছাত্র', nameEn: 'Madrasa Student', amount: 2000 },
];
