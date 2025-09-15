/**
 * Philosophy-specific constants for the Philosophy Service
 * Defines valid values for philosophical categories, types, and relationships
 */

const PHILOSOPHY_CONSTANTS = {
  // Thesis types
  THESIS_TYPES: {
    ONTOLOGICAL: 'ontological',
    EPISTEMOLOGICAL: 'epistemological',
    AXIOLOGICAL: 'axiological',
    ETHICAL: 'ethical',
    AESTHETIC: 'aesthetic',
    METAPHYSICAL: 'metaphysical',
    LOGICAL: 'logical',
    PRACTICAL: 'practical',
    POLITICAL: 'political',
    THEOLOGICAL: 'theological',
    ANTHROPOLOGICAL: 'anthropological',
    SOCIAL: 'social',
    LINGUISTIC: 'linguistic',
    PHENOMENOLOGICAL: 'phenomenological',
    EXISTENTIAL: 'existential',
    ANALYTICAL: 'analytical',
    HERMENEUTICAL: 'hermeneutical',
    CROSS_DISCIPLINARY: 'cross_disciplinary'
  },

  // Thesis styles
  THESIS_STYLES: {
    ACADEMIC: 'academic',
    POPULAR: 'popular',
    APHORISTIC: 'aphoristic',
    DIALOGICAL: 'dialogical',
    ANALYTICAL: 'analytical'
  },

  // Category types (same as thesis types but for graph categories)
  CATEGORY_TYPES: {
    ONTOLOGICAL: 'ontological',
    EPISTEMOLOGICAL: 'epistemological',
    AXIOLOGICAL: 'axiological',
    ETHICAL: 'ethical',
    AESTHETIC: 'aesthetic',
    METAPHYSICAL: 'metaphysical',
    LOGICAL: 'logical',
    PRACTICAL: 'practical',
    POLITICAL: 'political',
    THEOLOGICAL: 'theological',
    ANTHROPOLOGICAL: 'anthropological',
    SOCIAL: 'social',
    LINGUISTIC: 'linguistic',
    PHENOMENOLOGICAL: 'phenomenological',
    EXISTENTIAL: 'existential',
    ANALYTICAL: 'analytical',
    HERMENEUTICAL: 'hermeneutical',
    CROSS_DISCIPLINARY: 'cross_disciplinary'
  },

  // Relationship types between categories
  RELATIONSHIP_TYPES: {
    HIERARCHICAL: 'hierarchical',
    CAUSAL: 'causal',
    DIALECTICAL: 'dialectical',
    CORRELATIONAL: 'correlational',
    DISJUNCTIVE: 'disjunctive',
    CONJUNCTIVE: 'conjunctive',
    CONTRADICTION: 'contradiction',
    COMPLEMENTARY: 'complementary',
    EMERGENCE: 'emergence',
    NECESSARY_CONDITION: 'necessary_condition',
    SUFFICIENT_CONDITION: 'sufficient_condition',
    IDENTITY: 'identity',
    ANALOGY: 'analogy',
    IMPLEMENTATION: 'implementation',
    INSTANTIATION: 'instantiation',
    GENERALIZATION: 'generalization',
    PART_WHOLE: 'part_whole',
    MEANS_END: 'means_end',
    DEDUCTIVE: 'deductive',
    INDUCTIVE: 'inductive',
    ABDUCTIVE: 'abductive',
    TEMPORAL: 'temporal',
    CONCEPTUAL: 'conceptual',
    DEFINITIONAL: 'definitional',
    MANIFESTATION: 'manifestation',
    FOUNDATIONAL: 'foundational',
    RECOGNITION: 'recognition',
    REFLEXION: 'reflexion',
    DEVELOPMENT: 'development'
  },

  // Relationship directions
  RELATIONSHIP_DIRECTIONS: {
    UNIDIRECTIONAL: 'unidirectional',
    BIDIRECTIONAL: 'bidirectional',
    REFLEXIVE: 'reflexive'
  },

  // Synthesis methods
  SYNTHESIS_METHODS: {
    DIALECTICAL: 'dialectical',
    COMPLEMENTARY: 'complementary',
    HIERARCHICAL: 'hierarchical',
    HYBRID: 'hybrid'
  },

  // Innovation degrees (1-5 scale)
  INNOVATION_DEGREES: {
    TRADITIONAL: 1,        // Traditional understanding
    REINTERPRETED: 2,      // Reinterpreted understanding
    EXTENDED: 3,           // Extended understanding
    NOVEL: 4,              // Novel understanding
    REVOLUTIONARY: 5       // Revolutionary understanding
  },

  // Quantitative characteristic ranges
  CHARACTERISTIC_RANGES: {
    MIN: 0,
    MAX: 1,
    DEFAULT: 0.5
  },

  // Historical periods for contextualization
  HISTORICAL_PERIODS: {
    ANCIENT: 'ancient',           // Before 500 CE
    MEDIEVAL: 'medieval',         // 500-1400 CE
    RENAISSANCE: 'renaissance',   // 1400-1600 CE
    MODERN: 'modern',            // 1600-1900 CE
    CONTEMPORARY: 'contemporary', // 1900-present
    UNKNOWN: 'unknown'
  },

  // Philosophical traditions
  PHILOSOPHICAL_TRADITIONS: {
    WESTERN: {
      ANCIENT_GREEK: 'ancient_greek',
      HELLENISTIC: 'hellenistic',
      MEDIEVAL_SCHOLASTIC: 'medieval_scholastic',
      RENAISSANCE_HUMANISM: 'renaissance_humanism',
      RATIONALISM: 'rationalism',
      EMPIRICISM: 'empiricism',
      GERMAN_IDEALISM: 'german_idealism',
      EXISTENTIALISM: 'existentialism',
      PHENOMENOLOGY: 'phenomenology',
      ANALYTIC: 'analytic',
      CONTINENTAL: 'continental',
      PRAGMATISM: 'pragmatism',
      POSTMODERN: 'postmodern'
    },
    EASTERN: {
      CONFUCIANISM: 'confucianism',
      TAOISM: 'taoism',
      BUDDHISM: 'buddhism',
      HINDUISM: 'hinduism',
      JAINISM: 'jainism',
      SHINTO: 'shinto',
      ZEN: 'zen'
    },
    ISLAMIC: {
      CLASSICAL_ISLAMIC: 'classical_islamic',
      SUFISM: 'sufism',
      MODERN_ISLAMIC: 'modern_islamic'
    },
    OTHER: {
      AFRICAN: 'african',
      INDIGENOUS: 'indigenous',
      SYNCRETIC: 'syncretic'
    }
  },

  // Domains for practical application
  PRACTICAL_DOMAINS: {
    EDUCATION: 'education',
    POLITICS: 'politics',
    ETHICS: 'ethics',
    LAW: 'law',
    PSYCHOLOGY: 'psychology',
    SCIENCE: 'science',
    TECHNOLOGY: 'technology',
    ART: 'art',
    RELIGION: 'religion',
    BUSINESS: 'business',
    MEDICINE: 'medicine',
    ENVIRONMENT: 'environment',
    SOCIAL_WORK: 'social_work',
    PERSONAL_DEVELOPMENT: 'personal_development'
  },

  // Analysis types
  ANALYSIS_TYPES: {
    CRITICAL: 'critical',
    HISTORICAL: 'historical',
    COMPARATIVE: 'comparative',
    SYSTEMATIC: 'systematic',
    DECONSTRUCTIVE: 'deconstructive',
    HERMENEUTICAL: 'hermeneutical',
    PHENOMENOLOGICAL: 'phenomenological'
  },

  // Dialogue question types
  DIALOGUE_QUESTION_TYPES: {
    ONTOLOGICAL: 'ontological',
    EPISTEMOLOGICAL: 'epistemological',
    ETHICAL: 'ethical',
    METHODOLOGICAL: 'methodological',
    PRACTICAL: 'practical',
    COMPARATIVE: 'comparative',
    CRITICAL: 'critical'
  },

  // Evolution direction types
  EVOLUTION_DIRECTIONS: {
    EXPANSION: 'expansion',
    REFINEMENT: 'refinement',
    SYNTHESIS: 'synthesis',
    DECONSTRUCTION: 'deconstruction',
    RECONTEXTUALIZATION: 'recontextualization',
    SCIENTIFIC_UPDATE: 'scientific_update',
    CULTURAL_ADAPTATION: 'cultural_adaptation'
  },

  // Validation rules
  VALIDATION: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 5000,
    DEFINITION_MIN_LENGTH: 20,
    DEFINITION_MAX_LENGTH: 1000,
    THESIS_MIN_LENGTH: 50,
    THESIS_MAX_LENGTH: 5000,
    MIN_CATEGORIES_PER_CONCEPT: 3,
    MAX_CATEGORIES_PER_CONCEPT: 50,
    MIN_RELATIONSHIPS_PER_GRAPH: 1,
    MAX_RELATIONSHIPS_PER_GRAPH: 200
  }
};

// Helper functions

/**
 * Check if a thesis type is valid
 * @param {string} type - The thesis type to check
 * @returns {boolean} - Whether the type is valid
 */
function isValidThesisType(type) {
  return Object.values(PHILOSOPHY_CONSTANTS.THESIS_TYPES).includes(type);
}

/**
 * Check if a relationship type is valid
 * @param {string} type - The relationship type to check
 * @returns {boolean} - Whether the type is valid
 */
function isValidRelationshipType(type) {
  return Object.values(PHILOSOPHY_CONSTANTS.RELATIONSHIP_TYPES).includes(type);
}

/**
 * Check if an innovation degree is valid
 * @param {number} degree - The innovation degree to check
 * @returns {boolean} - Whether the degree is valid
 */
function isValidInnovationDegree(degree) {
  return degree >= PHILOSOPHY_CONSTANTS.INNOVATION_DEGREES.TRADITIONAL && 
         degree <= PHILOSOPHY_CONSTANTS.INNOVATION_DEGREES.REVOLUTIONARY &&
         Number.isInteger(degree);
}

/**
 * Check if a characteristic value is in valid range
 * @param {number} value - The characteristic value to check
 * @returns {boolean} - Whether the value is valid
 */
function isValidCharacteristicValue(value) {
  return value >= PHILOSOPHY_CONSTANTS.CHARACTERISTIC_RANGES.MIN && 
         value <= PHILOSOPHY_CONSTANTS.CHARACTERISTIC_RANGES.MAX;
}

/**
 * Get all philosophical traditions as a flat array
 * @returns {string[]} - Array of all tradition values
 */
function getAllTraditions() {
  const traditions = [];
  for (const category of Object.values(PHILOSOPHY_CONSTANTS.PHILOSOPHICAL_TRADITIONS)) {
    traditions.push(...Object.values(category));
  }
  return traditions;
}

/**
 * Get tradition category for a specific tradition
 * @param {string} tradition - The tradition to check
 * @returns {string|null} - The category name or null if not found
 */
function getTraditionCategory(tradition) {
  for (const [category, traditions] of Object.entries(PHILOSOPHY_CONSTANTS.PHILOSOPHICAL_TRADITIONS)) {
    if (Object.values(traditions).includes(tradition)) {
      return category;
    }
  }
  return null;
}

/**
 * Get description for innovation degree
 * @param {number} degree - The innovation degree
 * @returns {string} - Description of the degree
 */
function getInnovationDegreeDescription(degree) {
  const descriptions = {
    1: 'Traditional understanding - follows established interpretations',
    2: 'Reinterpreted understanding - offers new perspective on existing ideas',
    3: 'Extended understanding - expands beyond traditional boundaries',
    4: 'Novel understanding - introduces significantly new concepts',
    5: 'Revolutionary understanding - fundamentally challenges existing paradigms'
  };
  return descriptions[degree] || 'Unknown innovation degree';
}

module.exports = {
  PHILOSOPHY_CONSTANTS,
  isValidThesisType,
  isValidRelationshipType,
  isValidInnovationDegree,
  isValidCharacteristicValue,
  getAllTraditions,
  getTraditionCategory,
  getInnovationDegreeDescription
};