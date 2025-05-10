-- Seed data for concepts table
-- Contains test concepts for development environment

BEGIN;

-- Create test concepts
INSERT INTO concepts (
  concept_id,
  creator_id,
  name,
  description,
  status,
  is_synthesis,
  parent_concepts,
  synthesis_method,
  focus,
  innovation_degree,
  historical_context,
  metadata,
  creation_date,
  last_modified
)
VALUES
  -- Regular concept: Virtue Ethics
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d001',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003', -- John Doe
    'Virtue Ethics',
    'Virtue ethics is an approach to ethics that emphasizes the development of virtuous character traits, such as courage, honesty, and compassion, as the basis for ethical behavior. It focuses on what kind of person one should be, rather than what actions one should take.',
    'published',
    false,
    '[]',
    NULL,
    'ethics',
    70,
    'Originates in ancient Greek philosophy, particularly in the works of Aristotle, who emphasized the cultivation of virtues as essential to human flourishing (eudaimonia).',
    '{"key_virtues": ["courage", "honesty", "temperance", "justice", "wisdom"], "related_fields": ["moral psychology", "character development"]}',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '15 days'
  ),
  
  -- Regular concept: Epistemological Skepticism
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d002',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003', -- John Doe
    'Epistemological Skepticism',
    'Epistemological skepticism questions the possibility of certain knowledge and the reliability of various knowledge claims. It challenges the foundations of knowledge and inquires into the limits of what can be known with certainty.',
    'published',
    false,
    '[]',
    NULL,
    'epistemology',
    65,
    'Has roots in ancient Greek philosophy, particularly in the works of Pyrrho and the Academic Skeptics, and was later developed by thinkers such as Descartes, Hume, and contemporary epistemologists.',
    '{"key_questions": ["Can we know anything with certainty?", "How reliable are our senses?", "What constitutes justification for belief?"], "forms": ["global skepticism", "local skepticism", "Cartesian skepticism"]}',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '14 days'
  ),
  
  -- Regular concept: Mind-Body Problem
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d003',
    'd47ac10b-58cc-4372-a567-0e02b2c3d004', -- Jane Doe
    'Mind-Body Problem',
    'The mind-body problem addresses the relationship between mental phenomena (thoughts, feelings, consciousness) and physical phenomena (brain states, neural activity). It questions how the immaterial mind relates to the material body and vice versa.',
    'published',
    false,
    '[]',
    NULL,
    'philosophy_of_mind',
    75,
    'Has been a central concern in Western philosophy since Descartes, with various approaches including dualism, physicalism, functionalism, and property dualism attempting to resolve it.',
    '{"key_positions": ["dualism", "physicalism", "functionalism", "property dualism"], "related_fields": ["neuroscience", "psychology", "artificial intelligence"]}',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '12 days'
  ),
  
  -- Regular concept: Social Contract Theory
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d004',
    'd47ac10b-58cc-4372-a567-0e02b2c3d004', -- Jane Doe
    'Social Contract Theory',
    'Social contract theory posits that individuals consent, either explicitly or tacitly, to surrender some freedoms and submit to the authority of a ruler or state in exchange for protection of their remaining rights and maintenance of social order.',
    'published',
    false,
    '[]',
    NULL,
    'political_philosophy',
    80,
    'Developed primarily during the Age of Enlightenment by philosophers such as Hobbes, Locke, and Rousseau, with each offering different conceptions of the state of nature and the terms of the social contract.',
    '{"key_thinkers": ["Thomas Hobbes", "John Locke", "Jean-Jacques Rousseau"], "variants": ["contractarianism", "contractualism"]}',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '10 days'
  ),
  
  -- Regular concept: Aesthetic Experience
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d005',
    'd47ac10b-58cc-4372-a567-0e02b2c3d005', -- Bob Smith
    'Aesthetic Experience',
    'Aesthetic experience refers to perceptual, emotional, and cognitive responses to art and beauty. It encompasses subjective appreciation, critical evaluation, and the psychology of aesthetic preferences and judgments.',
    'published',
    false,
    '[]',
    NULL,
    'aesthetics',
    60,
    'Has been explored from ancient Greek philosophy through Kant and Hegel to contemporary aesthetics, with varying emphasis on objective properties, subjective responses, and cultural contexts.',
    '{"key_aspects": ["beauty", "sublimity", "taste", "disinterested contemplation"], "related_fields": ["art theory", "psychology of perception", "cultural studies"]}',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
  ),
  
  -- Synthesized concept: Virtue Epistemology
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d006',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003', -- John Doe
    'Virtue Epistemology',
    'Virtue epistemology applies virtue theory to questions of knowledge and justified belief, emphasizing intellectual virtues such as open-mindedness, intellectual courage, and intellectual humility in the acquisition and maintenance of knowledge.',
    'published',
    true,
    '["c47ac10b-58cc-4372-a567-0e02b2c3d001", "c47ac10b-58cc-4372-a567-0e02b2c3d002"]',
    'integration',
    'epistemology',
    85,
    'Emerged in the late 20th century as a response to traditional approaches in epistemology, drawing on virtue ethics and addressing issues in contemporary epistemology.',
    '{"key_virtues": ["intellectual curiosity", "open-mindedness", "intellectual courage", "intellectual humility"], "key_figures": ["Ernest Sosa", "Linda Zagzebski"]}',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days'
  ),
  
  -- Synthesized concept: Neuroaesthetics
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d007',
    'd47ac10b-58cc-4372-a567-0e02b2c3d004', -- Jane Doe
    'Neuroaesthetics',
    'Neuroaesthetics is an interdisciplinary field that studies the neural bases of aesthetic experience and artistic creativity. It uses neuroscientific methods to understand how the brain responds to art, beauty, and aesthetic judgments.',
    'published',
    true,
    '["c47ac10b-58cc-4372-a567-0e02b2c3d003", "c47ac10b-58cc-4372-a567-0e02b2c3d005"]',
    'integration',
    'philosophy_of_mind',
    90,
    'Emerged in the early 21st century at the intersection of neuroscience, psychology, and aesthetics, bringing empirical scientific methods to questions traditionally addressed in philosophical aesthetics.',
    '{"key_researchers": ["Semir Zeki", "Vilayanur S. Ramachandran"], "related_fields": ["neuroaesthetics", "empirical aesthetics", "cognitive neuroscience"]}',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '4 days'
  ),
  
  -- Draft concept: Embodied Cognition
  (
    'c47ac10b-58cc-4372-a567-0e02b2c3d008',
    'd47ac10b-58cc-4372-a567-0e02b2c3d005', -- Bob Smith
    'Embodied Cognition',
    'Embodied cognition is a theory that many features of cognition are shaped by aspects of the body beyond the brain. It emphasizes the role of the body's interactions with the environment in cognitive processes.',
    'draft',
    false,
    '[]',
    NULL,
    'philosophy_of_mind',
    75,
    'Developed in the late 20th and early 21st centuries as a challenge to traditional cognitivist approaches that treat cognition as primarily computational and disembodied.',
    '{"key_ideas": ["sensorimotor coupling", "extended mind", "enactivism"], "related_fields": ["cognitive science", "robotics", "phenomenology"]}',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  );

-- Create concept-philosopher relationships
INSERT INTO concept_philosophers (id, concept_id, philosopher_id, relationship_type)
VALUES
  -- Virtue Ethics
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d001', 'c47ac10b-58cc-4372-a567-0e02b2c3d001', 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'primary'), -- Aristotle
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d002', 'c47ac10b-58cc-4372-a567-0e02b2c3d001', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 'secondary'), -- Plato
  
  -- Epistemological Skepticism
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d003', 'c47ac10b-58cc-4372-a567-0e02b2c3d002', 'f47ac10b-58cc-4372-a567-0e02b2c3d491', 'primary'), -- David Hume
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d004', 'c47ac10b-58cc-4372-a567-0e02b2c3d002', 'f47ac10b-58cc-4372-a567-0e02b2c3d488', 'primary'), -- René Descartes
  
  -- Mind-Body Problem
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d005', 'c47ac10b-58cc-4372-a567-0e02b2c3d003', 'f47ac10b-58cc-4372-a567-0e02b2c3d488', 'primary'), -- René Descartes
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d006', 'c47ac10b-58cc-4372-a567-0e02b2c3d003', 'f47ac10b-58cc-4372-a567-0e02b2c3d489', 'secondary'), -- Baruch Spinoza
  
  -- Social Contract Theory
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d007', 'c47ac10b-58cc-4372-a567-0e02b2c3d004', 'f47ac10b-58cc-4372-a567-0e02b2c3d490', 'primary'), -- John Locke
  
  -- Aesthetic Experience
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d008', 'c47ac10b-58cc-4372-a567-0e02b2c3d005', 'f47ac10b-58cc-4372-a567-0e02b2c3d492', 'primary'), -- Immanuel Kant
  
  -- Virtue Epistemology
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d009', 'c47ac10b-58cc-4372-a567-0e02b2c3d006', 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'influence'), -- Aristotle
  
  -- Neuroaesthetics
  ('cp47ac10b-58cc-4372-a567-0e02b2c3d010', 'c47ac10b-58cc-4372-a567-0e02b2c3d007', 'f47ac10b-58cc-4372-a567-0e02b2c3d492', 'influence'); -- Immanuel Kant

-- Create concept-tradition relationships
INSERT INTO concept_traditions (id, concept_id, tradition_id, relationship_strength)
VALUES
  -- Virtue Ethics
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d001', 'c47ac10b-58cc-4372-a567-0e02b2c3d001', 'e47ac10b-58cc-4372-a567-0e02b2c3d001', 0.9), -- ancient_greek
  
  -- Epistemological Skepticism
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d002', 'c47ac10b-58cc-4372-a567-0e02b2c3d002', 'e47ac10b-58cc-4372-a567-0e02b2c3d001', 0.7), -- ancient_greek
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d003', 'c47ac10b-58cc-4372-a567-0e02b2c3d002', 'e47ac10b-58cc-4372-a567-0e02b2c3d007', 0.8), -- early_modern
  
  -- Mind-Body Problem
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d004', 'c47ac10b-58cc-4372-a567-0e02b2c3d003', 'e47ac10b-58cc-4372-a567-0e02b2c3d007', 0.9), -- early_modern
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d005', 'c47ac10b-58cc-4372-a567-0e02b2c3d003', 'e47ac10b-58cc-4372-a567-0e02b2c3d013', 0.7), -- contemporary
  
  -- Social Contract Theory
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d006', 'c47ac10b-58cc-4372-a567-0e02b2c3d004', 'e47ac10b-58cc-4372-a567-0e02b2c3d007', 0.9), -- early_modern
  
  -- Aesthetic Experience
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d007', 'c47ac10b-58cc-4372-a567-0e02b2c3d005', 'e47ac10b-58cc-4372-a567-0e02b2c3d001', 0.6), -- ancient_greek
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d008', 'c47ac10b-58cc-4372-a567-0e02b2c3d005', 'e47ac10b-58cc-4372-a567-0e02b2c3d007', 0.8), -- early_modern
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d009', 'c47ac10b-58cc-4372-a567-0e02b2c3d005', 'e47ac10b-58cc-4372-a567-0e02b2c3d013', 0.7), -- contemporary
  
  -- Virtue Epistemology
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d010', 'c47ac10b-58cc-4372-a567-0e02b2c3d006', 'e47ac10b-58cc-4372-a567-0e02b2c3d013', 0.9), -- contemporary
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d011', 'c47ac10b-58cc-4372-a567-0e02b2c3d006', 'e47ac10b-58cc-4372-a567-0e02b2c3d001', 0.6), -- ancient_greek
  
  -- Neuroaesthetics
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d012', 'c47ac10b-58cc-4372-a567-0e02b2c3d007', 'e47ac10b-58cc-4372-a567-0e02b2c3d013', 1.0), -- contemporary
  
  -- Embodied Cognition
  ('ct47ac10b-58cc-4372-a567-0e02b2c3d013', 'c47ac10b-58cc-4372-a567-0e02b2c3d008', 'e47ac10b-58cc-4372-a567-0e02b2c3d013', 0.9); -- contemporary

-- Create Claude interactions
INSERT INTO claude_interactions (
  interaction_id,
  user_id,
  concept_id,
  query_type,
  query_content,
  response_content,
  interaction_date,
  processing_time
)
VALUES
  -- Validation of Virtue Ethics
  (
    'i47ac10b-58cc-4372-a567-0e02b2c3d001',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003', -- John Doe
    'c47ac10b-58cc-4372-a567-0e02b2c3d001', -- Virtue Ethics
    'graph_validation',
    'Analyze the following graph of categories for the Virtue Ethics concept and identify any logical inconsistencies, missing elements, or opportunities for improvement.',
    'The graph of categories for Virtue Ethics is generally well-structured, with appropriate connections between key elements such as virtues, character development, and eudaimonia. A few suggestions for improvement: 1) Consider adding a category for "Practical Wisdom" (phronesis) which is central to Aristotelian virtue ethics; 2) The connection between virtues and emotions could be strengthened, as emotions play a crucial role in virtue ethics; 3) Consider adding more contemporary developments in virtue ethics, such as the work of Philippa Foot and Rosalind Hursthouse.',
    NOW() - INTERVAL '15 days',
    2.3
  ),
  
  -- Thesis generation for Epistemological Skepticism
  (
    'i47ac10b-58cc-4372-a567-0e02b2c3d002',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003', -- John Doe
    'c47ac10b-58cc-4372-a567-0e02b2c3d002', -- Epistemological Skepticism
    'thesis_generation',
    'Generate 5 key epistemological theses based on the graph for Epistemological Skepticism, focusing on fundamental knowledge claims and their justification.',
    'Based on the graph for Epistemological Skepticism, here are 5 key epistemological theses:\n\n1. The Problem of the Criterion: Any attempt to establish a criterion for knowledge presupposes that we already have knowledge, creating a circular argument that undermines certainty.\n\n2. The Limitations of Sensory Experience: Our sensory experiences are inherently unreliable and insufficient for establishing justified true beliefs about external reality.\n\n3. The Contextual Nature of Justification: Knowledge claims can only be evaluated within particular epistemic contexts, making universal or absolute knowledge claims untenable.\n\n4. The Vulnerability of Memory: Memory-based knowledge claims are subject to distortion, degradation, and false construction, undermining their reliability as foundations for certain knowledge.\n\n5. The Social Dimensions of Knowledge: What counts as knowledge is partially determined by social consensus and power structures, introducing contingency into even our most confident epistemic assertions.',
    NOW() - INTERVAL '14 days',
    3.1
  ),
  
  -- Synthesis creation
  (
    'i47ac10b-58cc-4372-a567-0e02b2c3d003',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003', -- John Doe
    'c47ac10b-58cc-4372-a567-0e02b2c3d006', -- Virtue Epistemology
    'synthesis',
    'Create a synthesis of Virtue Ethics and Epistemological Skepticism, focusing on how virtuous character traits might address skeptical concerns about knowledge.',
    'Synthesis of Virtue Ethics and Epistemological Skepticism into Virtue Epistemology:\n\nThis synthesis recognizes that intellectual virtues (such as open-mindedness, intellectual humility, intellectual courage, and thoroughness) can provide a response to skeptical challenges by shifting the focus from abstract justification of beliefs to the character of the knower. Rather than seeking absolute certainty or infallible criteria for knowledge, virtue epistemology suggests that knowledge emerges from the exercise of intellectual virtues in appropriate contexts.\n\nKey aspects of this synthesis include:\n\n1. Intellectual virtues as the foundation for reliable cognitive processes\n2. Recognition of epistemic limitations while maintaining that knowledge is possible\n3. Focus on the agent rather than propositions or beliefs in isolation\n4. A naturalized approach that connects epistemology to human psychology and social practices\n5. Recognition that knowledge has both cognitive and ethical dimensions\n\nThis synthesis addresses skeptical concerns not by refuting them directly, but by offering an alternative framework for understanding knowledge that accommodates fallibility while maintaining that knowledge is possible through virtuous intellectual conduct.',
    NOW() - INTERVAL '7 days',
    5.7
  ),
  
  -- Name analysis
  (
    'i47ac10b-58cc-4372-a567-0e02b2c3d004',
    'd47ac10b-58cc-4372-a567-0e02b2c3d004', -- Jane Doe
    'c47ac10b-58cc-4372-a567-0e02b2c3d007', -- Neuroaesthetics
    'name_analysis',
    'Analyze the name "Neuroaesthetics" for this concept and suggest alternative names that might better capture its interdisciplinary nature.',
    'Analysis of the name "Neuroaesthetics":\n\nThe term "Neuroaesthetics" effectively combines "neuro" (relating to the nervous system and brain) with "aesthetics" (the study of beauty and artistic experience). This name clearly indicates the interdisciplinary nature of the field, highlighting its connection to both neuroscience and aesthetic theory. The name is concise, descriptive, and has gained recognition in academic literature.\n\nPossible alternative names:\n\n1. "Cognitive Aesthetics" - Emphasizes the broader cognitive aspects beyond just neural mechanisms\n2. "Neurological Foundations of Aesthetic Experience" - More descriptive but less concise\n3. "Brain-Based Aesthetics" - More accessible terminology\n4. "Neurocognitive Aesthetics" - Emphasizes both neural and cognitive dimensions\n5. "Aesthetic Neuroscience" - Reverses the emphasis, foregrounding the scientific approach to aesthetics\n6. "Mind-Art Interface Studies" - Broader focus on the relationship between mind and art\n\nWhile these alternatives have merit, "Neuroaesthetics" remains a strong name due to its conciseness, clarity, and established usage in the field. The term effectively communicates the integration of neuroscientific methods with aesthetic inquiry.',
    NOW() - INTERVAL '4 days',
    3.3
  ),
  
  -- Historical context
  (
    'i47ac10b-58cc-4372-a567-0e02b2c3d005',
    'd47ac10b-58cc-4372-a567-0e02b2c3d005', -- Bob Smith
    'c47ac10b-58cc-4372-a567-0e02b2c3d004', -- Social Contract Theory
    'historical_context',
    'Create a historical contextualization for Social Contract Theory, focusing on the social and political conditions that influenced its development in the Early Modern period.',
    'Historical Contextualization of Social Contract Theory:\n\nSocial Contract Theory emerged primarily during the 17th and 18th centuries in Europe, a period of profound social, political, and intellectual transformation. Several key historical factors influenced its development:\n\n1. Political Instability and Religious Conflict: The devastation of the Thirty Years\' War (1618-1648) and the English Civil War (1642-1651) created an urgent need for theories that could establish stable political authority and religious tolerance. Hobbes\' Leviathan (1651) was directly influenced by the English Civil War and its chaos.\n\n2. Rise of Absolutism and Challenges to Divine Right: The theory developed partly in response to the rise of absolutist monarchies and the doctrine of divine right. Social contract theorists sought alternative justifications for political authority based on consent rather than divine mandate.\n\n3. Early Capitalism and Emerging Middle Class: The rise of mercantile capitalism and an increasingly powerful middle class created tensions with traditional feudal power structures, generating interest in theories that could justify political arrangements more favorable to commercial interests and private property (particularly evident in Locke\'s work).\n\n4. Scientific Revolution: The methodological innovations of the Scientific Revolution influenced social contract theorists to apply similar rational, systematic approaches to political questions, treating the state as a human construction rather than a natural or divine institution.\n\n5. Enlightenment Values: The broader intellectual context of the Enlightenment, with its emphasis on reason, individualism, and critical examination of tradition, provided fertile ground for social contract theories.\n\nThese historical conditions help explain why social contract theory took different forms in different thinkers: Hobbes emphasized security and order in response to civil war; Locke emphasized protection of natural rights in response to concerns about absolutism; and Rousseau emphasized authentic self-governance in response to the perceived corruption and inequality of emerging modern society.',
    NOW() - INTERVAL '3 days',
    4.2
  );

COMMIT;
