import { cookies } from "next/headers";
import { getDict, LANG_COOKIE, type Dict } from "@/lib/i18n";
import { langTag } from "@/lib/languages";

export { LANG_COOKIE };

/**
 * Resolve the patient UI language for this request:
 *   1. the `synapse_lang` cookie (set by the in-app language switcher)
 *   2. the patient's stored `language`
 *   3. English
 * Returns the code, the string dictionary, and the BCP-47 tag for TTS.
 */
export async function resolvePatientLang(patientLanguage?: string | null): Promise<{
  code: string;
  dict: Dict;
  speechTag: string;
}> {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const code = (cookie || patientLanguage || "en").toLowerCase();
  return { code, dict: getDict(code), speechTag: langTag(code) };
}
