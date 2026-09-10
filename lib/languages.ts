/** NER language codes used in the scaffold, with display names and a
 *  best-effort BCP-47 tag for browser speech synthesis. Languages without a
 *  system voice use pre-recorded human clips in the real app. */
export const LANGUAGES: Record<
  string,
  { name: string; nativeName: string; speechTag: string }
> = {
  as: { name: "Assamese", nativeName: "অসমীয়া", speechTag: "as-IN" },
  bn: { name: "Bengali", nativeName: "বাংলা", speechTag: "bn-IN" },
  ne: { name: "Nepali", nativeName: "नेपाली", speechTag: "ne-NP" },
  lus: { name: "Mizo", nativeName: "Mizo ṭawng", speechTag: "en-IN" },
  mni: { name: "Manipuri (Meitei)", nativeName: "ꯃꯦꯏꯇꯦꯏ", speechTag: "en-IN" },
  kha: { name: "Khasi", nativeName: "Ka Ktien Khasi", speechTag: "en-IN" },
  brx: { name: "Bodo", nativeName: "बर'", speechTag: "en-IN" },
  sip: { name: "Sikkimese (Bhutia)", nativeName: "འབྲས་ལྗོངས་", speechTag: "en-IN" },
  hi: { name: "Hindi", nativeName: "हिन्दी", speechTag: "hi-IN" },
  en: { name: "English", nativeName: "English", speechTag: "en-IN" },
};

export function langTag(code: string): string {
  return LANGUAGES[code]?.speechTag ?? "en-IN";
}

export function langName(code: string): string {
  return LANGUAGES[code]?.name ?? code;
}
