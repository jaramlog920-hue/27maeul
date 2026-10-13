export const FAMILY_KINDS = ['firstMorning', 'spouseReturn', 'childFirstHelp', 'fullLibrary', 'familyWinter', 'springWalk', 'summerCreek', 'autumnPath', 'rainbowRest', 'afterCopy'] as const
export type FamilyKind = typeof FAMILY_KINDS[number]

export const PROGRESS_KINDS=['firstOtBook','psalmRest','firstHomeBook','childLeaves','childStays','workSuccession'] as const
export type ProgressKind=typeof PROGRESS_KINDS[number]

export const LIVING_KINDS=['readingFinished','firstDinner','coverFinished','childLetterReceived','facilityFinished'] as const
export type LivingKind=typeof LIVING_KINDS[number]
