-- Seed data for traditions table
-- Contains philosophical traditions and schools of thought

BEGIN;

-- Insert Ancient traditions
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d001', 'ancient_greek', 'ancient', 
   'Philosophical traditions that originated in ancient Greece and encompass various schools of thought including Platonism, Aristotelianism, Stoicism, Epicureanism, and more.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d479", "f47ac10b-58cc-4372-a567-0e02b2c3d480", "f47ac10b-58cc-4372-a567-0e02b2c3d481", "f47ac10b-58cc-4372-a567-0e02b2c3d482", "f47ac10b-58cc-4372-a567-0e02b2c3d483"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d002', 'stoicism', 'ancient', 
   'Philosophical tradition founded by Zeno of Citium that teaches the development of self-control and fortitude as a means of overcoming destructive emotions.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d483"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d003', 'epicureanism', 'ancient', 
   'Philosophical system founded by Epicurus that seeks to attain tranquility and freedom from fear through knowledge, friendship, and living a self-sufficient life with limited desires.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d482"]');

-- Insert Medieval traditions
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d004', 'medieval', 'medieval', 
   'Philosophical traditions that developed during the Medieval period, characterized by attempts to reconcile Christian theology with classical philosophy.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d484", "f47ac10b-58cc-4372-a567-0e02b2c3d485", "f47ac10b-58cc-4372-a567-0e02b2c3d486", "f47ac10b-58cc-4372-a567-0e02b2c3d487"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d005', 'christian', 'medieval', 
   'Philosophical traditions that developed within the context of Christianity, integrating theological concerns with philosophical inquiry.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d484", "f47ac10b-58cc-4372-a567-0e02b2c3d485"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d006', 'islamic', 'medieval', 
   'Philosophical traditions that developed within the Islamic world, integrating Islamic theology with Greek and other philosophical traditions.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d486", "f47ac10b-58cc-4372-a567-0e02b2c3d487"]');

-- Insert Early Modern traditions
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d007', 'early_modern', 'early_modern', 
   'Philosophical traditions that developed during the Early Modern period (17th-18th centuries), characterized by a move away from religious authority and toward scientific rationality.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d488", "f47ac10b-58cc-4372-a567-0e02b2c3d489", "f47ac10b-58cc-4372-a567-0e02b2c3d490", "f47ac10b-58cc-4372-a567-0e02b2c3d491", "f47ac10b-58cc-4372-a567-0e02b2c3d492"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d008', 'rationalism', 'early_modern', 
   'Philosophical position that emphasizes the role of reason in acquiring knowledge, often contrasted with empiricism.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d488", "f47ac10b-58cc-4372-a567-0e02b2c3d489"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d009', 'empiricism', 'early_modern', 
   'Philosophical position that emphasizes the role of experience and evidence in forming ideas, often contrasted with rationalism.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d490", "f47ac10b-58cc-4372-a567-0e02b2c3d491"]');

-- Insert Modern traditions
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d010', 'modern', 'modern', 
   'Philosophical traditions that developed during the Modern period (19th-early 20th centuries), characterized by a wide range of philosophical approaches.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d493", "f47ac10b-58cc-4372-a567-0e02b2c3d494", "f47ac10b-58cc-4372-a567-0e02b2c3d495", "f47ac10b-58cc-4372-a567-0e02b2c3d496", "f47ac10b-58cc-4372-a567-0e02b2c3d497"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d011', 'german_idealism', 'modern', 
   'Philosophical movement that emerged in Germany in the late 18th and early 19th centuries, mainly associated with Kant, Fichte, Schelling, and Hegel.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d492", "f47ac10b-58cc-4372-a567-0e02b2c3d493", "f47ac10b-58cc-4372-a567-0e02b2c3d494"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d012', 'marxism', 'modern', 
   'Political philosophy and socioeconomic theory based on the works of Karl Marx, focusing on class conflict and critiques of capitalism.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d497"]');

-- Insert Contemporary traditions
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d013', 'contemporary', 'contemporary', 
   'Philosophical traditions that developed during the Contemporary period (20th-21st centuries), characterized by a wide range of approaches and methodologies.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d498", "f47ac10b-58cc-4372-a567-0e02b2c3d499", "f47ac10b-58cc-4372-a567-0e02b2c3d500", "f47ac10b-58cc-4372-a567-0e02b2c3d501", "f47ac10b-58cc-4372-a567-0e02b2c3d502", "f47ac10b-58cc-4372-a567-0e02b2c3d503", "f47ac10b-58cc-4372-a567-0e02b2c3d504"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d014', 'analytic', 'contemporary', 
   'Philosophical tradition that emphasizes clear, rigorous arguments and often focuses on language, logic, and science.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d498", "f47ac10b-58cc-4372-a567-0e02b2c3d499", "f47ac10b-58cc-4372-a567-0e02b2c3d504"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d015', 'continental', 'contemporary', 
   'Philosophical tradition that originated in continental Europe and encompasses phenomenology, existentialism, critical theory, and more.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d500", "f47ac10b-58cc-4372-a567-0e02b2c3d501", "f47ac10b-58cc-4372-a567-0e02b2c3d502", "f47ac10b-58cc-4372-a567-0e02b2c3d503"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d016', 'existentialism', 'contemporary', 
   'Philosophical tradition focused on individual existence, freedom, and choice, emphasizing subjective experience and personal responsibility.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d495", "f47ac10b-58cc-4372-a567-0e02b2c3d496", "f47ac10b-58cc-4372-a567-0e02b2c3d500", "f47ac10b-58cc-4372-a567-0e02b2c3d501"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d017', 'postmodern', 'contemporary', 
   'Philosophical tradition characterized by skepticism toward grand narratives, and is associated with thinkers such as Foucault, Derrida, and Lyotard.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d502"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d018', 'feminism', 'contemporary', 
   'Philosophical perspective that examines gender roles, relations, and identities, often with a focus on social, political, and economic equality.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d501", "f47ac10b-58cc-4372-a567-0e02b2c3d503"]');

-- Insert Eastern traditions
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d019', 'eastern', 'ancient', 
   'Philosophical traditions that originated in East and South Asia, including Confucianism, Taoism, Buddhism, and Hinduism.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d505", "f47ac10b-58cc-4372-a567-0e02b2c3d506", "f47ac10b-58cc-4372-a567-0e02b2c3d507", "f47ac10b-58cc-4372-a567-0e02b2c3d508"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d020', 'confucianism', 'ancient', 
   'Philosophical tradition developed from the teachings of Confucius that emphasizes personal and governmental morality, correctness of social relationships, and justice.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d505"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d021', 'taoism', 'ancient', 
   'Philosophical and religious tradition that emphasizes living in harmony with the Tao, the source and drive of everything that exists.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d506"]'),
   
  ('e47ac10b-58cc-4372-a567-0e02b2c3d022', 'buddhism', 'ancient', 
   'Philosophical and religious tradition founded by Siddhartha Gautama (the Buddha) that emphasizes liberation from suffering through wisdom and compassion.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d507", "f47ac10b-58cc-4372-a567-0e02b2c3d508"]');

-- Insert African traditions
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d023', 'african', 'contemporary', 
   'Philosophical traditions that originated in Africa, encompassing a wide range of approaches including Ubuntu philosophy, Négritude, and more.', 
   '["f47ac10b-58cc-4372-a567-0e02b2c3d509", "f47ac10b-58cc-4372-a567-0e02b2c3d510", "f47ac10b-58cc-4372-a567-0e02b2c3d511"]');

-- Insert pragmatism
INSERT INTO traditions (tradition_id, name, time_period, description, key_figures)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d024', 'pragmatism', 'modern', 
   'Philosophical tradition that evaluates theories or beliefs in terms of the success of their practical application.', 
   '[]');

COMMIT;
