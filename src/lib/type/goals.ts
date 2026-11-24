// Waar is het voor? Precies één doel. Het doel bepaalt de sjablonen, de schaal en de regels van de drukker

export type Goal = 'website' | 'boek' | 'affiche' | 'presentatie' | 'huisstijl' | 'app'
export const GOALS: readonly Goal[] = ['website', 'boek', 'affiche', 'presentatie', 'huisstijl', 'app']

export type Template = 'website' | 'boek' | 'affiche' | 'dia' | 'briefpapier' | 'app'
export const TEMPLATES: readonly Template[] = ['website', 'boek', 'affiche', 'dia', 'briefpapier', 'app']

/** Hoe zwaar een koppelregel telt bij dit doel. Ontbreekt een regel, dan telt hij 1 */
export type RuleWeights = Partial<Record<string, number>>

export interface GoalSpec {
  /** Schaalverhouding op een breed scherm */
  ratio: number
  /** De kleinste verhouding die de drukker nog goed vindt (affiche: 1,5 of meer) */
  minRatio: number
  /** Broodtekst in px op een breed scherm, en de kleinste die mag */
  base: number
  minBase: number
  /** Interlinie van de broodtekst */
  leading: number
  /** Tekens per regel: wat goed leest, en het ideaal */
  measure: [number, number]
  idealMeasure: number
  /** Het sjabloon dat er standaard bij hoort */
  template: Template
  /** Hoe zwaar de koppelregels tellen */
  weights: RuleWeights
  /** Een broodletter zonder cursief kan niet (boek) */
  needsItalic: boolean
  /** Geen gewicht lichter dan dit (presentatie: geen dunne gewichten) */
  minWeight: number
  /** De tekens moeten duidelijk verschillen en er zijn tabelcijfers nodig (app) */
  interface: boolean
  /** Voorkeur voor families met veel gewichten (huisstijl) */
  manyWeights: boolean
  /** Een display-letter als kop: goed (affiche), kan (website), liever niet (de rest) */
  display: number
}

export const GOAL_SPECS: Record<Goal, GoalSpec> = {
  website: {
    ratio: 1.25,
    minRatio: 1.2,
    base: 17,
    minBase: 16,
    leading: 1.6,
    measure: [60, 75],
    idealMeasure: 66,
    template: 'website',
    weights: {},
    needsItalic: false,
    minWeight: 300,
    interface: false,
    manyWeights: false,
    display: -0.1,
  },
  boek: {
    ratio: 1.2,
    minRatio: 1.125,
    base: 18,
    minBase: 16,
    leading: 1.65,
    measure: [55, 72],
    idealMeasure: 64,
    template: 'boek',
    // De broodtekst weegt het zwaarst: daar wordt een boek gelezen
    weights: { leesbaar: 2.2, 'x-hoogte': 0.6, karakter: 0.6 },
    needsItalic: true,
    minWeight: 300,
    interface: false,
    manyWeights: false,
    display: -0.4,
  },
  affiche: {
    ratio: 1.6,
    minRatio: 1.5,
    base: 18,
    minBase: 16,
    leading: 1.45,
    measure: [30, 55],
    idealMeasure: 42,
    template: 'affiche',
    weights: { 'x-hoogte': 0.3, karakter: 1.4, leesbaar: 0.5 },
    needsItalic: false,
    minWeight: 100,
    interface: false,
    manyWeights: false,
    display: 0.5,
  },
  presentatie: {
    ratio: 1.333,
    minRatio: 1.25,
    base: 28,
    minBase: 20,
    leading: 1.4,
    measure: [35, 60],
    idealMeasure: 48,
    template: 'dia',
    weights: { leesbaar: 1.4 },
    needsItalic: false,
    minWeight: 400,
    interface: false,
    manyWeights: false,
    display: -0.1,
  },
  huisstijl: {
    ratio: 1.25,
    minRatio: 1.2,
    base: 17,
    minBase: 16,
    leading: 1.6,
    measure: [55, 75],
    idealMeasure: 66,
    template: 'briefpapier',
    weights: { gewichten: 1.5 },
    needsItalic: false,
    minWeight: 300,
    interface: false,
    manyWeights: true,
    display: -0.2,
  },
  app: {
    ratio: 1.2,
    minRatio: 1.125,
    base: 16,
    minBase: 16,
    leading: 1.5,
    measure: [40, 75],
    idealMeasure: 60,
    template: 'app',
    weights: { interface: 2, karakter: 0.5 },
    needsItalic: false,
    minWeight: 300,
    interface: true,
    manyWeights: false,
    display: -0.6,
  },
}

export const goalSpec = (goal: Goal) => GOAL_SPECS[goal]

/** Het sjabloon dat bij een doel hoort */
export const templateFor = (goal: Goal): Template => GOAL_SPECS[goal].template
