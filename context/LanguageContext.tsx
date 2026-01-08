import React, { createContext, useState, useContext, ReactNode } from 'react';

const translations = {
  en: {
    // --- NAVIGATION & HOME ---
    nav_home: "HOME",
    nav_tutorial: "TUTORIAL",
    nav_chat: "CHAT",
    nav_feedback: "FEEDBACK",
    nav_play: "PLAY GAME",
    home_subtitle: "Badan Warisan Malaysia Project",
    home_title_1: "The Art of",
    home_title_2: "Batu Seremban",
    home_desc: "Discover Malaysia's intangible cultural heritage. Interact with the artifact, listen to the story, and master the technique in Augmented Reality.",
    home_btn_start: "Start AR Experience",
    home_btn_history: "Read History",
    home_audio_text: "Audio Guide: Origins of the Game",
    home_audio_listen: "Listen",
    home_audio_stop: "Stop",
    
    // --- HISTORY CONTENT ---
    hist_title: "Origins & Culture",
    hist_intro: "Batu Seremban is a traditional Malaysian game passed down through generations. It has long been a popular pastime among children, especially in rural communities, and is considered part of Malaysia’s cultural heritage.",
    hist_section_1: "Evolution of the \"Batu\" (stones)",
    hist_p1_ancient: "Ancient Times: Small stones, beads, fruit seeds, or nutshells.",
    hist_p1_historical: "Historical: Hard wooden pieces were sometimes used.",
    hist_p1_modern: "Modern Era: Today, players use marbles or small fabric bags filled with sand or beans, as seen in this AR experience.",
    hist_section_sewing: "The Sewing Tradition",
    hist_p_sewing: "Traditionally, mothers taught their daughters to sew the batu bags themselves, turning the game into a lesson in needlework, patience, and craftsmanship before play even begins.",
    hist_section_2: "Objective of the Game",
    hist_p2: "Players throw one stone into the air and use the same hand to pick up the others from the ground, catching the thrown stone before it falls. The game progresses from simple pick-ups (Buah Satu) to more advanced techniques (Timbang, Level 8), testing agility, timing, and coordination.",
    hist_close: "Close",

    // --- CHAT CONTENT ---
    chat_title: "AI Digital Historian",
    chat_subtitle: "Your personal guide to the heritage of Batu Seremban.",
    chat_welcome: "Welcome! I am the AI Digital Historian for the Batu Seremban exhibit. Please ask me anything about the game's history, rules, or cultural significance.",
    chat_placeholder: "Ask about the game's origins, rules, variations...",
    chat_loading: "Consulting the archives...",
    chat_send: "SEND",
    chat_sources: "Sources:",

    // --- TUTORIAL CONTENT ---
    tut_title: "Tutorial",
    tut_desc: "Watch the animation to learn the technique.",
    tut_select_level: "Select Stage",
    tut_goal: "GOAL:",
    tut_level_prefix: "Level",

    // Action Words for Animation
    act_ready: "READY",
    act_toss: "TOSS!",
    act_dive: "DIVE",
    act_pick: "PICK",
    act_place: "PLACE",
    act_swap: "SWAP",
    act_sweep: "SWEEP",
    act_catch: "CATCH",
    act_got_it: "GOT IT!",
    act_pick_mom: "PICK MOTHER",

    // --- DETAILED LEVEL DESCRIPTIONS (ENGLISH) ---
    lvl_1_title: "Buah Satu (One by One)", 
    lvl_1_desc: "Start: 1 stone in hand (Mother), 4 on the ground.\nAction: Toss the Mother stone, pick up 1 stone from the ground, and catch the Mother stone.\nRepeat: Do this 4 times until all stones are collected.",
    
    lvl_2_title: "Buah Dua (Two by Two)", 
    lvl_2_desc: "Start: 1 stone in hand (Mother), 4 on the ground.\nAction: Toss the Mother stone, pick up 2 stones at once, and catch the Mother stone.\nRepeat: Do this 2 times to collect all stones.",
    
    lvl_3_title: "Buah Tiga (The Three)", 
    lvl_3_desc: "Start: 1 stone in hand (Mother), 4 on the ground.\nFirst Toss: Toss the Mother stone, pick up 1 stone, and catch.\nSecond Toss: Toss the Mother stone, pick up the remaining 3 stones at once, and catch.",
    
    lvl_4_title: "Buah Empat (The Four)", 
    lvl_4_desc: "Start: 1 stone in hand (Mother), 4 on the ground.\nAction: Toss the Mother stone, pick up all 4 stones from the ground simultaneously, and catch the Mother stone.",
    
    lvl_5_title: "Buah Lima (The Drop)", 
    lvl_5_desc: "Start: Hold all 5 stones in your hand.\nStep 1 (The Drop): Toss all 5 stones into the air together. Catch exactly 1 stone (the Mother) and let the remaining 4 stones fall onto the ground.\nStep 2 (The Pickup): Toss the Mother stone, pick up the 4 stones on the ground at once, and catch the Mother stone.",
    
    lvl_6_title: "Tukar (The Exchange)", 
    lvl_6_desc: "Start: Hold 2 stones (1 Mother + 1 Passenger), 3 on the ground.\nAction: Toss the Mother stone and exchange the Passenger stone in your hand with one stone on the ground.\nRepeat: Do this for all stones on the ground.",
    
    lvl_7_title: "Buah Tujuh (Exchange & Pickup)", 
    lvl_7_desc: "Start: Hold 2 stones (1 Mother + 1 Passenger) in hand, 3 on the ground.\nFirst Toss: Toss the Mother stone and exchange the Passenger stone in your hand with 1 stone on the ground.\nSecond Toss: Toss the Mother stone again and pick up all the remaining stones on the ground at once.",
    
    lvl_8_title: "Buah Lapan (The Sweep)", 
    lvl_8_desc: "Start: All 5 stones are on the ground. Hand is empty.\nStep 1: Pick up 1 stone (Mother) from the ground.\nStep 2: Toss the Mother stone, pick up all 4 remaining stones at once, and catch the Mother stone.",

    // --- GAMEPLAY UI KEYS ---
    game_level_prefix: "LEVEL",
    game_toss_btn: "TOSS",
    game_reload: "⬇️ RELOAD",
    game_wait: "WAIT...",
    game_ready: "DIP HAND HERE",
    game_toss_action: "⬆️ TOSS",
    game_level_complete: "LEVEL COMPLETE!",
    game_dropped: "DROPPED!",
    game_missed: "MISSED ACTION!",
    game_champion: "CHAMPION!",
    game_scan: "Scan Hand...",
    // NEW BUTTON KEYS
    game_play_again: "PLAY AGAIN",
    game_exit: "EXIT",
    game_exit_game: "EXIT GAME",
    
    msg_pick_1: "PICK 1 STONE",
    msg_pick_2: "PICK 2 STONES",
    msg_pick_3: "PICK 3 STONES",
    msg_pick_4: "PICK ALL 4",
    msg_place_4: "PLACE 4 STONES",
    msg_exchange: "EXCHANGE STONE",
    
    // --- DIFFICULTY SYSTEM ---
    diff_select_title: "Select Difficulty",
    diff_beginner: "BEGINNER",
    diff_normal: "NORMAL",
    diff_master: "MASTER",
    diff_beginner_desc: "Learn the basics with guidance. Slower pace, retry allowed, helpful hints.",
    diff_normal_desc: "Traditional gameplay. Medium pace, cultural insights, ends on failure.",
    diff_master_desc: "Challenge mode! Fast pace, combo scoring, leaderboard, no retries.",
    diff_time_window: "Air Window",
    diff_retry: "Retry on Fail",
    diff_hints: "Helpful Hints",
    diff_combo: "Combo System",
    diff_start: "START",
    
    // --- SCORING ---
    score_total: "Total Score",
    score_base: "Base Score",
    score_perfect: "Perfect Bonus",
    score_combo: "Combo Multiplier",
    score_failures: "Failures",
    score_perfect_cycles: "Perfect Cycles",
    score_max_combo: "Max Combo",
    
    // --- GAME STATES ---
    game_retry: "RETRY",
    game_slow_motion: "SLOW MOTION",
    game_perfect: "PERFECT!",
    game_combo: "COMBO",
    game_follow_guide: "Follow the Guide!",
    game_timbang: "TIMBANG! Catch all stones!",
    
    // --- CHALLENGE MODIFIERS ---
    modifier_no_rearrange: "No Rearrange",
    modifier_one_hand: "One Hand Only",
    modifier_perfect_only: "Perfect Only",
    modifier_no_rearrange_desc: "Cannot reorganize stones",
    modifier_one_hand_desc: "Only use right side of screen",
    modifier_perfect_only_desc: "Non-perfect resets combo",
  },
  bm: {
    // --- NAVIGATION & HOME (BM) ---
    nav_home: "UTAMA",
    nav_tutorial: "TUTORIAL",
    nav_chat: "PERBUALAN",
    nav_feedback: "MAKLUM BALAS",
    nav_play: "MULA MAIN",
    home_subtitle: "Projek Badan Warisan Malaysia",
    home_title_1: "Seni Warisan",
    home_title_2: "Batu Seremban",
    home_desc: "Terokai warisan budaya tidak ketara Malaysia. Berinteraksi dengan artifak, dengar kisahnya, dan kuasai teknik dalam Realiti Tambah (AR).",
    home_btn_start: "Mula Pengalaman AR",
    home_btn_history: "Baca Sejarah",
    home_audio_text: "Panduan Audio: Asal Usul Permainan",
    home_audio_listen: "Dengar",
    home_audio_stop: "Berhenti",
    
    // --- HISTORY CONTENT (BM) ---
    hist_title: "Asal Usul & Budaya",
    hist_intro: "Batu Seremban adalah permainan tradisional Malaysia yang diwarisi turun-temurun. Ia telah lama menjadi hobi popular di kalangan kanak-kanak, terutamanya di kawasan luar bandar, dan dianggap sebahagian daripada warisan budaya Malaysia.",
    hist_section_1: "Evolusi \"Batu\"",
    hist_p1_ancient: "Zaman Purba: Batu kecil, manik, biji buah, atau kulit kekeras.",
    hist_p1_historical: "Sejarah: Kepingan kayu keras kadang-kala digunakan.",
    hist_p1_modern: "Era Moden: Hari ini, pemain menggunakan guli atau uncang kain kecil berisi pasir atau kacang, seperti yang dilihat dalam pengalaman AR ini.",
    hist_section_sewing: "Tradisi Jahitan",
    hist_p_sewing: "Secara tradisi, ibu mengajar anak perempuan mereka menjahit uncang batu sendiri, menjadikan permainan ini satu pelajaran seni jarum, kesabaran, dan pertukangan sebelum permainan bermula.",
    hist_section_2: "Objektif Permainan",
    hist_p2: "Pemain melambung satu batu ke udara dan menggunakan tangan yang sama untuk memungut batu lain di tanah, sambil menyambut batu yang dilambung sebelum ia jatuh. Permainan berkembang dari pungutan mudah (Buah Satu) hingga teknik yang lebih maju (Timbang, Tahap 8), menguji ketangkasan, masa, dan koordinasi.",
    hist_close: "Tutup",

    // --- CHAT CONTENT (BM) ---
    chat_title: "Sejarawan Digital AI",
    chat_subtitle: "Panduan peribadi anda tentang warisan Batu Seremban.",
    chat_welcome: "Selamat datang! Saya Sejarawan Digital AI untuk pameran Batu Seremban. Tanya saya apa sahaja tentang sejarah, peraturan, atau kepentingan budaya permainan ini.",
    chat_placeholder: "Tanya tentang asal usul, peraturan, variasi...",
    chat_loading: "Sedang menyemak arkib...",
    chat_send: "HANTAR",
    chat_sources: "Sumber:",

    // --- TUTORIAL CONTENT (BM) ---
    tut_title: "Tutorial",
    tut_desc: "Tonton animasi untuk pelajari teknik.",
    tut_select_level: "Pilih Tahap",
    tut_goal: "MATLAMAT:",
    tut_level_prefix: "Tahap",

    // Action Words
    act_ready: "SEDIA",
    act_toss: "LAMBUNG!",
    act_dive: "TERJUN",
    act_pick: "PUNGUT",
    act_place: "LETAK",
    act_swap: "TUKAR",
    act_sweep: "SAPU",
    act_catch: "SAMBUT",
    act_got_it: "DAPAT!",
    act_pick_mom: "AMBIL IBU",

    // --- DETAILED LEVEL DESCRIPTIONS (MALAY) ---
    lvl_1_title: "Buah Satu", 
    lvl_1_desc: "Mula: 1 batu di tangan (Ibu), 4 di lantai.\nAksi: Lambung Ibu, pungut 1 batu dari lantai, dan sambut Ibu.\nUlang: Buat 4 kali sehingga semua batu dikutip.",
    
    lvl_2_title: "Buah Dua", 
    lvl_2_desc: "Mula: 1 batu di tangan (Ibu), 4 di lantai.\nAksi: Lambung Ibu, pungut 2 batu serentak, dan sambut Ibu.\nUlang: Buat 2 kali untuk kutip semua.",
    
    lvl_3_title: "Buah Tiga", 
    lvl_3_desc: "Mula: 1 batu di tangan (Ibu), 4 di lantai.\nLambungan Pertama: Lambung Ibu, pungut 1 batu, sambut.\nLambungan Kedua: Lambung Ibu, pungut baki 3 batu serentak, sambut.",
    
    lvl_4_title: "Buah Empat", 
    lvl_4_desc: "Mula: 1 batu di tangan (Ibu), 4 di lantai.\nAksi: Lambung Ibu, pungut semua 4 batu serentak dari lantai, dan sambut Ibu.",
    
    lvl_5_title: "Buah Lima", 
    lvl_5_desc: "Mula: Pegang semua 5 batu di tangan.\nLangkah 1 (Jatuh): Lambung semua 5 batu. Sambut 1 (Ibu) dan biarkan baki 4 jatuh ke lantai.\nLangkah 2 (Pungut): Lambung Ibu, pungut 4 batu di lantai serentak, dan sambut Ibu.",
    
    lvl_6_title: "Tukar (Buah Enam)", 
    lvl_6_desc: "Mula: Pegang 2 batu (1 Ibu + 1 Anak), 3 di lantai.\nAksi: Lambung Ibu dan tukar batu di tangan dengan satu batu di lantai.\nUlang: Buat untuk semua batu di lantai.",
    
    lvl_7_title: "Buah Tujuh", 
    lvl_7_desc: "Mula: Pegang 2 batu (1 Ibu + 1 Anak) di tangan, 3 di lantai.\nLambungan Pertama: Lambung Ibu dan tukar batu di tangan dengan 1 batu di lantai.\nLambungan Kedua: Lambung Ibu sekali lagi dan pungut semua baki batu di lantai serentak.",
    
    lvl_8_title: "Buah Lapan", 
    lvl_8_desc: "Mula: Semua 5 batu di lantai. Tangan kosong.\nLangkah 1: Ambil 1 batu (Ibu) dari lantai.\nLangkah 2: Lambung Ibu, pungut semua 4 batu baki serentak, dan sambut Ibu.",

    // --- GAMEPLAY UI KEYS (BM) ---
    game_level_prefix: "TAHAP",
    game_toss_btn: "LAMBUNG",
    game_reload: "⬇️ MUAT SEMULA",
    game_wait: "TUNGGU...",
    game_ready: "LETAK TANGAN",
    game_toss_action: "⬆️ LAMBUNG",
    game_level_complete: "TAHAP SELESAI!",
    game_dropped: "JATUH!",
    game_missed: "TERLEPAS!",
    game_champion: "JUARA!",
    game_scan: "Imbas Tangan...",
    // NEW BUTTON KEYS (BM)
    game_play_again: "MAIN SEMULA",
    game_exit: "KELUAR",
    game_exit_game: "KELUAR",

    msg_pick_1: "PUNGUT 1 BATU",
    msg_pick_2: "PUNGUT 2 BATU",
    msg_pick_3: "PUNGUT 3 BATU",
    msg_pick_4: "PUNGUT 4 BATU",
    msg_place_4: "LETAK 4 BATU",
    msg_exchange: "TUKAR BATU",
    
    // --- DIFFICULTY SYSTEM (BM) ---
    diff_select_title: "Pilih Tahap Kesukaran",
    diff_beginner: "PEMULA",
    diff_normal: "BIASA",
    diff_master: "MAHIR",
    diff_beginner_desc: "Belajar asas dengan panduan. Perlahan, boleh cuba lagi, petunjuk membantu.",
    diff_normal_desc: "Permainan tradisional. Sederhana, wawasan budaya, tamat jika gagal.",
    diff_master_desc: "Mod cabaran! Pantas, sistem kombo, papan pendahulu, tiada percubaan semula.",
    diff_time_window: "Masa Udara",
    diff_retry: "Cuba Semula",
    diff_hints: "Petunjuk",
    diff_combo: "Sistem Kombo",
    diff_start: "MULA",
    
    // --- SCORING (BM) ---
    score_total: "Jumlah Skor",
    score_base: "Skor Asas",
    score_perfect: "Bonus Sempurna",
    score_combo: "Pengganda Kombo",
    score_failures: "Kegagalan",
    score_perfect_cycles: "Kitaran Sempurna",
    score_max_combo: "Kombo Maksimum",
    
    // --- GAME STATES (BM) ---
    game_retry: "CUBA LAGI",
    game_slow_motion: "GERAK PERLAHAN",
    game_perfect: "SEMPURNA!",
    game_combo: "KOMBO",
    game_follow_guide: "Ikut Panduan!",
    game_timbang: "TIMBANG! Sambut semua batu!",
    
    // --- CHALLENGE MODIFIERS (BM) ---
    modifier_no_rearrange: "Tanpa Susun",
    modifier_one_hand: "Satu Tangan",
    modifier_perfect_only: "Sempurna Sahaja",
    modifier_no_rearrange_desc: "Tidak boleh susun semula batu",
    modifier_one_hand_desc: "Hanya guna sebelah kanan skrin",
    modifier_perfect_only_desc: "Bukan sempurna reset kombo",
  }
};

type Language = 'en' | 'bm';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'bm' : 'en'));
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
