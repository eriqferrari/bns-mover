import punycode from 'punycode/';
import emojiDictionary from 'emoji-dictionary';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import twemoji from 'twemoji';

function parseEmoji(text: string): string {
  return twemoji.parse(text, {
    folder: 'svg',
    ext: '.svg',
    base: '/twemoji/',
  });
}



/**
 * Regex to match most emojis, including newer ones.
 */
const emojiRegex =
  /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier_Base})(?:\p{Emoji_Modifier})?/u;

/**
 * Checks if the given string is in Punycode format.
 * @param {string} str - The input string to check.
 * @returns {boolean} - True if the string is valid Punycode, false otherwise.
 */
export function isPunycode(str: string): boolean {
  if (!str.startsWith('xn--')) return false;

  const punycodePart = str.substring(4);
  return /^[a-z0-9-]+$/i.test(punycodePart);
}

/**
 * Decodes a Punycode domain to Unicode.
 * @param {string} punycodeStr - The Punycode string to decode.
 * @returns {string} - The decoded Unicode string, or the original string if decoding fails.
 */
export function decodePunycode(punycodeStr: string | null): string {
  if (!punycodeStr) {return ""}
  try {
    return punycode.toUnicode(punycodeStr);
  } catch {
    return punycodeStr; // Return original string on error.
  }
}

/**
 * Checks if the given string contains an emoji.
 * @param {string} str - The input string to check.
 * @returns {boolean} - True if the string contains an emoji, false otherwise.
 */
export function containsEmoji(str: string): boolean {
  return emojiRegex.test(str);
}

/**
 * Retrieves the name of an emoji.
 * @param {string} emoji - The emoji character.
 * @returns {string|null} - The name of the emoji, or "New Emoji" if not found.
 */
export function getEmojiName(emoji: string): string {
  return emojiDictionary.getName(emoji) || '';
}

export function decodeFQNSimple(fqn: string): JSX.Element | undefined {
  if (!fqn || typeof fqn !== 'string') {
    return undefined;
  }

  const [firstPart = '', ...restParts] = fqn.split('.');
  const restOfFQN = '.'+restParts; 
  const decodedFirstPart = decodePunycode(firstPart); // Decode first part of FQN
  const emojiParsedFirstPart = parseEmoji(decodedFirstPart+restOfFQN); // Parse emojis in the first part

  return (
  <span
    dangerouslySetInnerHTML={{
      __html: emojiParsedFirstPart,
    }}
    className="flex items-center" // Adds margin to separate emoji and text
  />

  );
}

export function decodeFQNTruncated(fqn: string) : JSX.Element | undefined {
  if (!fqn || typeof fqn !== 'string') {
    return;
  }

  if (fqn.includes("...")) {return <>{fqn}</>}

  const [firstPart = '', ...restParts] = fqn.split('.'); 
  const restOfFQN = '.'+restParts; 
  let decodedFirstPart = decodePunycode(firstPart);
  let emojiParsedFirstPart = parseEmoji(decodedFirstPart.length > 18 ? decodedFirstPart.slice(0,14) + "..." + decodedFirstPart.slice(-1) + restOfFQN : decodedFirstPart + restOfFQN)

  return (
    <span
    dangerouslySetInnerHTML={{
      __html: emojiParsedFirstPart,
    }}
    className="flex items-center" // Adds margin to separate emoji and text
  />
    )
}

export function decodeFQN(fqn: string) : string {
  if (!fqn || typeof fqn !== 'string') {
    return "";
  }

  if (fqn.includes("...")) {return fqn}

  const [firstPart = '', ...restParts] = fqn.split('.'); 
  let decodedFirstPart = decodePunycode(firstPart);
  let shorted = decodedFirstPart.length > 14 ? decodedFirstPart.slice(0, (11 - restParts.length )) + "..." + decodedFirstPart.slice(-1) : decodedFirstPart
  const result = `${shorted}.${restParts}`
  return result
}

export function punycodeDescription(fqn: string | undefined) : JSX.Element | undefined {
  if (!fqn || typeof fqn !== 'string') {
    return;
  }
  const [firstPart = '', ...restParts] = fqn.split('.'); 
  const restOfFQN = restParts.join('.'); 
  let decodedFirstPart = decodePunycode(firstPart);
  const isEmoji = containsEmoji(decodedFirstPart);
  const emojiName = isEmoji ? getEmojiName(decodedFirstPart).replaceAll("_", " ") : null;
  return (
    <>{isEmoji ? 
        <>Emoji {emojiName}: {firstPart}</>
        : firstPart
    }</>
    )
}

export function decodeFQNToString(fqn: string, len: string | null): JSX.Element | undefined {
  if (!fqn || typeof fqn !== 'string') {
    return;
  }

  if (!len) {len = "short"}


  const [firstPart = '', ...restParts] = fqn.split('.'); 
  const restOfFQN = '.'+restParts; 
  let decodedFirstPart = firstPart;
  let isPuny = false;

  // Check if the first part is valid Punycode
  if (isPunycode(firstPart)) {
    decodedFirstPart = decodePunycode(firstPart);
    isPuny = true;
  }

  // Limit the length of the first part if too long
  if (decodedFirstPart.length > 14 && len === "short") {
    decodedFirstPart = decodedFirstPart.slice(0, (11 - restParts.length )) + "..." + decodedFirstPart.slice(-1);
  }
  if (decodedFirstPart.length > 29 && len === "long") {
    decodedFirstPart = decodedFirstPart.slice(0, (26 - restParts.length )) + "..." + decodedFirstPart.slice(-1);
  }

  let emojiParsedFirstPart = parseEmoji(decodedFirstPart + restOfFQN)

  // Check if the decodedFirstPart contains an emoji
  const isEmoji = containsEmoji(decodedFirstPart);

  const emojiName = isEmoji ? getEmojiName(decodedFirstPart).replaceAll("_", " ") : null;

  return (
    <span className="whitespace-nowrap flex items-center">
      <span
        dangerouslySetInnerHTML={{
          __html: emojiParsedFirstPart,
        }}
        className="flex items-center " // Adds margin to separate emoji and text
      />
      {isEmoji && emojiName !== "" && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Info className="h-5 w-5 ml-0 pb-1.5" />
            </TooltipTrigger>
            <TooltipContent className="text-sans text-sm">
              Punycode Name for {emojiName}: {firstPart}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {isEmoji && emojiName === "" && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Info className="h-5 w-5 ml-0 pb-1.5" />
            </TooltipTrigger>
            <TooltipContent className="text-sans text-sm text-white">
              Punycode Name: {firstPart}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {isPuny && !isEmoji && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Info className="h-5 w-5 ml-0 pb-1.5" />
            </TooltipTrigger>
            <TooltipContent className="text-sans text-sm text-white">
              Punycode Name: {firstPart}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {firstPart.length > 14 && len === "short" && !isPuny && !isEmoji && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Info className="h-5 w-5 ml-0 pb-1.5" />
            </TooltipTrigger>
            <TooltipContent className="text-sans text-sm text-white">
              Full Name: {fqn}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {firstPart.length > 29 && len === "long" && !isPuny && !isEmoji && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Info className="h-5 w-5 ml-0 pb-1.5" />
            </TooltipTrigger>
            <TooltipContent className="text-sans text-sm text-white">
              Full Name: {fqn}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}
