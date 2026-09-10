package com.sigmafusion.synapse.domain

/** The six cognitive domains (five from the problem statement + language). */
enum class CognitiveDomain(val wire: String, val label: String) {
    MEMORY("memory", "Memory"),
    ATTENTION("attention", "Attention & Concentration"),
    ROUTINE_RECALL("routine_recall", "Daily Routine Recall"),
    PATTERN_RECOGNITION("pattern_recognition", "Pattern & Object Recognition"),
    ENGAGEMENT("engagement", "Emotional & Mental Engagement"),
    LANGUAGE("language", "Language & Fluency");

    companion object {
        fun fromWire(v: String) = entries.firstOrNull { it.wire == v } ?: MEMORY
    }
}

data class GameInfo(
    val key: String,
    val title: String,
    val domain: CognitiveDomain,
    val emoji: String,
    val culturalTheme: String,
    val playable: Boolean,
)

val GAME_CATALOG = listOf(
    GameInfo(
        "memory_lane", "Memory Lane", CognitiveDomain.MEMORY, "🖼️",
        "Family photos, NER landmarks and festivals (Bihu, Hornbill, Chapchar Kut, Losar).",
        playable = true,
    ),
    GameInfo(
        "market_basket", "Market Basket", CognitiveDomain.ATTENTION, "🧺",
        "Buying rice, betel nut, bamboo shoot and Assam tea at a virtual haat.",
        playable = false,
    ),
    GameInfo(
        "morning_routine", "Morning Routine", CognitiveDomain.ROUTINE_RECALL, "🌅",
        "Putting the day's activities in order; ties into reminders.",
        playable = false,
    ),
    GameInfo(
        "pattern_of_the_loom", "Pattern of the Loom", CognitiveDomain.PATTERN_RECOGNITION, "🧶",
        "Re-weaving Naga shawl, Mekhela Chador and Mizo puan motifs.",
        playable = false,
    ),
    GameInfo(
        "bird_and_beast", "Bird & Beast", CognitiveDomain.ATTENTION, "🦏",
        "Finding the hornbill or one-horned rhino among distractors.",
        playable = false,
    ),
    GameInfo(
        "song_of_the_hills", "Song of the Hills", CognitiveDomain.ENGAGEMENT, "🎵",
        "Humming along and filling missing words in regional folk songs.",
        playable = false,
    ),
    GameInfo(
        "word_garden", "Word Garden", CognitiveDomain.LANGUAGE, "🌱",
        "Naming things in a category and completing proverbs in your language.",
        playable = false,
    ),
)

fun gameByKey(key: String): GameInfo? = GAME_CATALOG.firstOrNull { it.key == key }

/** NER language codes → best-effort BCP-47 tag for on-device speech. */
val LANGUAGE_OPTIONS = listOf(
    LanguageOption("as", "Assamese", "অসমীয়া", "as-IN"),
    LanguageOption("bn", "Bengali", "বাংলা", "bn-IN"),
    LanguageOption("ne", "Nepali", "नेपाली", "ne-NP"),
    LanguageOption("lus", "Mizo", "Mizo ṭawng", "en-IN"),
    LanguageOption("mni", "Manipuri (Meitei)", "ꯃꯦꯏꯇꯦꯏ", "en-IN"),
    LanguageOption("kha", "Khasi", "Ka Ktien Khasi", "en-IN"),
    LanguageOption("brx", "Bodo", "बर'", "en-IN"),
    LanguageOption("sip", "Sikkimese", "འབྲས་ལྗོངས་", "en-IN"),
    LanguageOption("hi", "Hindi", "हिन्दी", "hi-IN"),
    LanguageOption("en", "English", "English", "en-IN"),
)

data class LanguageOption(
    val code: String,
    val name: String,
    val nativeName: String,
    val speechTag: String,
)

fun speechTagFor(code: String): String =
    LANGUAGE_OPTIONS.firstOrNull { it.code == code }?.speechTag ?: "en-IN"

fun languageName(code: String): String =
    LANGUAGE_OPTIONS.firstOrNull { it.code == code }?.name ?: code
